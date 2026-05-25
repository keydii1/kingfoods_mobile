import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Alert } from '../../utils/appAlert';
import { getClientOrderDetail, cancelClientOrder, BASE_URL } from '../../constants/services/api';
import { getOrderStatusMeta, canCustomerCancelOrder } from '../../constants/orderStatus';
import { notifyOrdersRefresh } from '../../utils/ordersRefresh';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreCart } from '../../contexts/StoreCartContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { translateProductName, translateUnit } from '../../utils/translator';

// Timezone date helper for Vietnam (UTC+7)
const formatVietnamDate = (dateStr) => {
  if (!dateStr) return '—';
  let date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  // Workaround: If connecting to Render (which has the timezone bug), compensate by adding 7 hours
  if (BASE_URL && BASE_URL.includes('onrender.com')) {
    date = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  }
  
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  
  return `${h}:${min}:${sec} ${d}/${m}/${y}`;
};

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams();
  const { darkMode, language } = useAppPreferences();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await getClientOrderDetail(orderId);
      setOrder(res);
    } catch (err) {
      Alert.alert(
        language === 'en' ? 'Error' : 'Lỗi',
        err.message || (language === 'en' ? 'Cannot load order details' : 'Không tải được chi tiết đơn hàng')
      );
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/storestatistics');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  const handleCancel = () => {
    if (order?.status === 'processing') {
      Alert.alert(
        language === 'en' ? 'Cannot Cancel Order' : 'Không thể huỷ đơn',
        language === 'en' 
          ? 'The order has been approved and is being processed/picked, it cannot be cancelled at this time.'
          : 'Đơn hàng đã được duyệt và đang trong quá trình xử lý/chuẩn bị lấy hàng, không thể huỷ lúc này.'
      );
      return;
    }
    Alert.alert(
      language === 'en' ? 'Cancel Order' : 'Huỷ đơn hàng',
      language === 'en' ? `Are you sure you want to cancel order #${orderId}?` : `Bạn có chắc muốn huỷ đơn #${orderId}?`,
      [
        { text: language === 'en' ? 'No' : 'Không', style: 'cancel' },
        {
          text: language === 'en' ? 'Cancel' : 'Huỷ đơn',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelClientOrder(orderId);
              setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
              notifyOrdersRefresh();
              Alert.alert(
                language === 'en' ? 'Success' : 'Thành công',
                language === 'en' ? 'Order cancelled successfully' : 'Đơn hàng đã được huỷ'
              );
            } catch (err) {
              Alert.alert(
                language === 'en' ? 'Error' : 'Lỗi',
                err.message || (language === 'en' ? 'Cannot cancel order' : 'Không thể huỷ đơn')
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const { userRole } = useAuth();
  const { addToCart, clearCart } = useStoreCart();

  const handleReorder = () => {
    Alert.alert(
      language === 'en' ? 'Re-order' : 'Đặt lại đơn hàng',
      language === 'en' 
        ? 'Add all products of this order to the current cart?' 
        : 'Thêm tất cả sản phẩm của đơn hàng này vào giỏ hàng hiện tại?',
      [
        { text: language === 'en' ? 'Cancel' : 'Huỷ', style: 'cancel' },
        {
          text: language === 'en' ? 'Agree' : 'Đồng ý',
          onPress: () => {
            clearCart();
            details.forEach(line => {
              if (line.product) {
                const prod = {
                  id: line.product.id,
                  name: line.product.name,
                  sku: line.product.sku || `SKU-${line.product.id}`,
                  unit: line.product.unit || 'cái',
                  price: typeof line.product.price === 'string' ? parseFloat(line.product.price) : (line.product.price || 0),
                  image: line.product.image || '',
                  categoryId: line.product.category_id || line.product.category?.id || null,
                };
                for (let k = 0; k < (line.quantity || 1); k++) {
                  addToCart(prod);
                }
              }
            });
            Alert.alert(
              language === 'en' ? 'Success' : 'Thành công',
              language === 'en' 
                ? 'All products have been added to the shopping cart. Go to the Order screen?' 
                : 'Đã thêm tất cả sản phẩm vào giỏ hàng. Chuyển đến trang Đặt hàng?',
              [
                { text: language === 'en' ? 'Stay' : 'Ở lại', style: 'cancel' },
                {
                  text: language === 'en' ? 'Go to Order' : 'Đi đặt hàng',
                  onPress: () => {
                    router.push('/storeorder');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const statusMeta = getOrderStatusMeta(order?.status, language);
  const canCancel = order && canCustomerCancelOrder(order.status);
  const details = order?.orderDetails || [];

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (userRole === 'store_manager') {
            router.replace('/storestatistics');
          } else {
            router.replace('/managerdashboard');
          }
        }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{language === 'en' ? `Order Details #${orderId}` : `Chi tiết đơn #${orderId}`}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 32 }}>
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
            {details.length} {language === 'en' ? 'types of products' : 'loại sản phẩm'} ·{' '}
            {details.reduce((s, d) => s + (d.quantity || 0), 0)} {language === 'en' ? 'Items' : 'SP'}
          </Text>
        </View>

        {/* Order Progress Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>{language === 'en' ? 'Order Status' : 'Trạng thái đơn hàng'}</Text>
          
          {order?.status === 'cancelled' ? (
            <View style={styles.cancelledAlert}>
              <Ionicons name="close-circle-outline" size={24} color="#e53935" />
              <View>
                <Text style={styles.cancelledTitle}>{language === 'en' ? 'Order Cancelled' : 'Đơn hàng đã bị hủy'}</Text>
                <Text style={styles.cancelledSub}>{language === 'en' ? 'This order has been cancelled and cannot be processed.' : 'Đơn hàng này không thể xử lý tiếp.'}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.timelineRow}>
              {/* Step 1: Đã đặt */}
              <View style={styles.timelineStep}>
                <View style={[styles.stepNode, styles.stepNodeDone]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
                <Text style={[styles.stepLabel, styles.stepLabelDone]}>{language === 'en' ? 'Placed' : 'Đã đặt'}</Text>
              </View>
              
              <View style={[styles.stepLine, ['processing', 'shipped', 'delivered'].includes(order?.status) && styles.stepLineDone]} />

              {/* Step 2: Duyệt đơn */}
              <View style={styles.timelineStep}>
                <View style={[
                  styles.stepNode,
                  ['processing', 'shipped', 'delivered'].includes(order?.status) && styles.stepNodeDone,
                  order?.status === 'pending' && styles.stepNodeActive
                ]}>
                  {['processing', 'shipped', 'delivered'].includes(order?.status) ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    order?.status === 'pending' ? <View style={styles.stepPulse} /> : null
                  )}
                </View>
                <Text style={[
                  styles.stepLabel,
                  ['processing', 'shipped', 'delivered'].includes(order?.status) && styles.stepLabelDone,
                  order?.status === 'pending' && styles.stepLabelActive
                ]}>{language === 'en' ? 'Approved' : 'Duyệt đơn'}</Text>
              </View>

              <View style={[styles.stepLine, ['shipped', 'delivered'].includes(order?.status) && styles.stepLineDone]} />

              {/* Step 3: Đang giao */}
              <View style={styles.timelineStep}>
                <View style={[
                  styles.stepNode,
                  ['shipped', 'delivered'].includes(order?.status) && styles.stepNodeDone,
                  order?.status === 'processing' && styles.stepNodeActive
                ]}>
                  {['shipped', 'delivered'].includes(order?.status) ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    order?.status === 'processing' ? <View style={styles.stepPulse} /> : null
                  )}
                </View>
                <Text style={[
                  styles.stepLabel,
                  ['shipped', 'delivered'].includes(order?.status) && styles.stepLabelDone,
                  order?.status === 'processing' && styles.stepLabelActive
                ]}>{language === 'en' ? 'Shipped' : 'Đang giao'}</Text>
              </View>

              <View style={[styles.stepLine, order?.status === 'delivered' && styles.stepLineDone]} />

              {/* Step 4: Đã giao */}
              <View style={styles.timelineStep}>
                <View style={[
                  styles.stepNode,
                  order?.status === 'delivered' && styles.stepNodeDone,
                  order?.status === 'shipped' && styles.stepNodeActive
                ]}>
                  {order?.status === 'delivered' ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    order?.status === 'shipped' ? <View style={styles.stepPulse} /> : null
                  )}
                </View>
                <Text style={[
                  styles.stepLabel,
                  order?.status === 'delivered' && styles.stepLabelDone,
                  order?.status === 'shipped' && styles.stepLabelActive
                ]}>{language === 'en' ? 'Delivered' : 'Đã nhận'}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{language === 'en' ? 'Products in Order' : 'Sản phẩm trong đơn'}</Text>
          {details.map((line, i) => (
            <View
              key={line.id || `${line.productId}-${i}`}
              style={[styles.productRow, i > 0 && styles.productRowBorder]}
            >
              {line.product?.image ? (
                <Image
                  source={{ uri: line.product.image }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="image-outline" size={20} color="#b0bec5" />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName}>
                  {line.product ? translateProductName(line.product.name, language) : (language === 'en' ? `Product #${line.productId}` : `Sản phẩm #${line.productId}`)}
                </Text>
                <Text style={styles.productSku}>
                  {language === 'en' ? 'QTY' : 'SL'}: {line.quantity}
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
            style={[
              styles.cancelBtn,
              cancelling && { opacity: 0.7 },
              order?.status === 'processing' && { opacity: 0.4, borderColor: '#e0e0e0', backgroundColor: '#f5f5f5' }
            ]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            <Ionicons name="close-circle-outline" size={20} color={order?.status === 'processing' ? '#9e9e9e' : '#e53935'} />
            <Text style={[styles.cancelBtnText, order?.status === 'processing' && { color: '#9e9e9e' }]}>
              {cancelling 
                ? (language === 'en' ? 'Cancelling...' : 'Đang huỷ...') 
                : (language === 'en' ? 'Cancel Order' : 'Huỷ đơn hàng')}
            </Text>
          </TouchableOpacity>
        )}

        {userRole === 'store_manager' && (
          <TouchableOpacity
            style={[styles.reorderBtn, canCancel && { marginTop: 12 }]}
            onPress={handleReorder}
          >
            <Ionicons name="refresh-circle-outline" size={22} color="#fff" />
            <Text style={styles.reorderBtnText}>
              Đặt lại đơn này
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  productImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f0f4f1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  stepNodeDone: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepNodeActive: {
    backgroundColor: '#fff',
    borderColor: COLORS.primary,
  },
  stepPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  stepLine: {
    height: 3,
    backgroundColor: '#e2e8f0',
    flex: 1,
    marginTop: -16,
  },
  stepLineDone: {
    backgroundColor: COLORS.primary,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
  },
  stepLabelDone: {
    color: COLORS.primary,
  },
  stepLabelActive: {
    color: COLORS.primary,
  },
  cancelledAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  cancelledTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c53030',
  },
  cancelledSub: {
    fontSize: 12,
    color: '#e53e3e',
    marginTop: 2,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  reorderBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
