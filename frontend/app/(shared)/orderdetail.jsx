import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Alert } from '../../utils/appAlert';
import { getClientOrderDetail, cancelClientOrder } from '../../constants/services/api';
import { getOrderStatusMeta, canCustomerCancelOrder } from '../../constants/orderStatus';
import { notifyOrdersRefresh } from '../../utils/ordersRefresh';

// Timezone date helper for Vietnam (UTC+7)
const formatVietnamDate = (dateStr) => {
  if (!dateStr) return '—';
  const tStr = dateStr.replace(' ', 'T');
  const match = tStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) {
    return dateStr;
  }
  
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const hours = parseInt(match[4], 10);
  const minutes = parseInt(match[5], 10);
  const seconds = parseInt(match[6], 10);
  
  const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  const vnTimeMs = utcDate.getTime() + (7 * 60 * 60 * 1000);
  const vnDate = new Date(vnTimeMs);
  
  const d = String(vnDate.getUTCDate()).padStart(2, '0');
  const m = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
  const y = vnDate.getUTCFullYear();
  const h = String(vnDate.getUTCHours()).padStart(2, '0');
  const min = String(vnDate.getUTCMinutes()).padStart(2, '0');
  const sec = String(vnDate.getUTCSeconds()).padStart(2, '0');
  
  return `${h}:${min}:${sec} ${d}/${m}/${y}`;
};

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await getClientOrderDetail(orderId);
      setOrder(res);
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không tải được chi tiết đơn hàng');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  const handleCancel = () => {
    Alert.alert(
      'Huỷ đơn hàng',
      `Bạn có chắc muốn huỷ đơn #${orderId}?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Huỷ đơn',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelClientOrder(orderId);
              setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
              notifyOrdersRefresh();
              Alert.alert('Thành công', 'Đơn hàng đã được huỷ');
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể huỷ đơn');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const statusMeta = getOrderStatusMeta(order?.status);
  const canCancel = order && canCustomerCancelOrder(order.status);
  const details = order?.orderDetails || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn #{orderId}</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={styles.summaryCard}>
            <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
              <Text style={[styles.statusText, { color: statusMeta.color }]}>
                {statusMeta.label}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {formatVietnamDate(order?.createdAt)}
            </Text>
            <Text style={styles.totalText}>
              {(parseFloat(order?.totalPrice) || 0).toLocaleString()}đ
            </Text>
            <Text style={styles.itemsCount}>
              {details.length} loại sản phẩm ·{' '}
              {details.reduce((s, d) => s + (d.quantity || 0), 0)} SP
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sản phẩm trong đơn</Text>
            {details.map((line, i) => (
              <View
                key={line.id || `${line.productId}-${i}`}
                style={[styles.productRow, i > 0 && styles.productRowBorder]}
              >
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>
                    {line.product?.name || `Sản phẩm #${line.productId}`}
                  </Text>
                  <Text style={styles.productSku}>
                    SL: {line.quantity}
                  </Text>
                </View>
                <Text style={styles.lineTotal}>
                  {(
                    (parseFloat(line.product?.price) || 0) * (line.quantity || 0)
                  ).toLocaleString()}
                  đ
                </Text>
              </View>
            ))}
          </View>

          {canCancel && (
            <TouchableOpacity
              style={[styles.cancelBtn, cancelling && { opacity: 0.7 }]}
              onPress={handleCancel}
              disabled={cancelling}
            >
              <Ionicons name="close-circle-outline" size={20} color="#e53935" />
              <Text style={styles.cancelBtnText}>
                {cancelling ? 'Đang huỷ...' : 'Huỷ đơn hàng'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f1' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  scroll: { flex: 1, padding: 16 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusText: { fontSize: 13, fontWeight: '700' },
  dateText: { fontSize: 12, color: '#888', marginBottom: 8 },
  totalText: { fontSize: 28, fontWeight: '900', color: COLORS.primary },
  itemsCount: { fontSize: 12, color: '#888', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#222', marginBottom: 12 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  productRowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 13, fontWeight: '600', color: '#222' },
  productSku: { fontSize: 11, color: '#888', marginTop: 3 },
  lineTotal: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#ffcdd2',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#e53935' },
});
