import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { getOrders, updateOrderStatus, deleteOrder } from '../../constants/services/api';

const statusConfig = {
  pending: { label: 'Chờ duyệt', color: '#fff3e0', textColor: '#e65100' },
  processing: { label: 'Đang xử lý', color: '#e3f2fd', textColor: '#1565c0' },
  shipped: { label: 'Đã giao', color: '#e8f5e9', textColor: '#2e7d32' },
  delivered: { label: 'Hoàn thành', color: '#e8f5e9', textColor: COLORS.primary },
  cancelled: { label: 'Đã hủy', color: '#ffebee', textColor: '#c62828' },
};

const filters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'delivered', label: 'Hoàn thành' },
];

export default function StoreOrdersScreen() {
  const { customerId, storeName } = useLocalSearchParams();
  const [orders, setOrders] = useState([]);
  const [branchName, setBranchName] = useState(storeName || 'Cửa hàng');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await getOrders();
      const allOrders = Array.isArray(res) ? res : (res.data || []);
      const filtered = allOrders.filter(o =>
        String(o.customerId) === String(customerId) || String(o.branchId) === String(customerId)
      );
      if (filtered.length > 0 && filtered[0].branch?.name) {
        setBranchName(filtered[0].branch.name);
      }
      setOrders(filtered);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (order) => {
    if (order.status === 'pending') {
      Alert.alert(
        'Xử lý đơn hàng',
        `Đơn hàng #${order.id}\n\nDuyệt đơn hàng này?`,
        [
          { text: 'Từ chối', style: 'destructive', onPress: () => confirmStatus(order.id || order._id, 'cancelled') },
          { text: 'Để sau', style: 'cancel' },
          { text: 'Duyệt', onPress: () => confirmStatus(order.id || order._id, 'processing') },
        ]
      );
    } else if (order.status === 'processing') {
      router.push({ pathname: '/(worker)/productlist', params: { taskId: order.id || order._id } });
    }
  };

  const confirmStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      setOrders(prev => prev.map(o => (o.id || o._id) === id ? { ...o, status } : o));
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = (order) => {
    Alert.alert(
      'Xoá đơn hàng',
      `Xoá đơn #${order.id || order._id}?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Xoá', style: 'destructive', onPress: async () => {
          try {
            await deleteOrder(order.id || order._id);
            setOrders(prev => prev.filter(o => (o.id || o._id) !== (order.id || order._id)));
          } catch {
            Alert.alert('Lỗi', 'Không thể xoá đơn hàng');
          }
        }},
      ]
    );
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  const renderItem = ({ item }) => {
    const st = statusConfig[item.status] || { label: item.status, color: '#f5f5f5', textColor: '#888' };
    return (
      <TouchableOpacity style={styles.orderCard} onPress={() => handleAction(item)} onLongPress={() => handleDelete(item)}>
        <View style={styles.orderHead}>
          <Text style={styles.orderId}>#{item.id || item._id}</Text>
          <View style={[styles.statusTag, { backgroundColor: st.color }]}>
            <Text style={[styles.statusText, { color: st.textColor }]}>{st.label}</Text>
          </View>
        </View>
        <Text style={styles.orderAddress}>{item.address || 'Chưa có địa chỉ'}</Text>
        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>
            {item.totalPrice ? item.totalPrice.toLocaleString() : '0'}đ
          </Text>
          <Text style={styles.orderDate}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Đơn hàng</Text>
          <Text style={styles.headerSub}>{branchName}</Text>
        </View>
        <Text style={styles.count}>{filteredOrders.length}</Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => String(item.id || item._id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f1' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { fontSize: 28, color: COLORS.primary, marginRight: 12 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  count: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  filterRow: {
    flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f5f5f5',
  },
  filterActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16 },
  orderCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  orderHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  orderId: { fontSize: 14, fontWeight: '700', color: '#222' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderAddress: { fontSize: 12, color: '#888', marginBottom: 8 },
  orderFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 0.5, borderTopColor: '#eee', paddingTop: 8,
  },
  orderTotal: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  orderDate: { fontSize: 11, color: '#aaa' },
  separator: { height: 8 },
  emptyText: { fontSize: 14, color: '#888' },
});
