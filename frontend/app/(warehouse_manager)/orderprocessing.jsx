import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import {getOrders, updateOrderStatus} from '../../constants/services/api';
const mockOrders = [
  { id: '#KF-12400', _id: '#KF-12400', store: 'Kingfood Nguyễn Văn Linh, Q.7', items: 12, status: 'Chờ duyệt', date: '10/05/2026' },
  { id: '#KF-12399', _id: '#KF-12399', store: 'Kingfood Đinh Tiên Hoàng, Q.1', items: 8, status: 'Đang xử lý', date: '09/05/2026' },
  { id: '#KF-12398', _id: '#KF-12398', store: 'Kingfood Lê Văn Việt, Q.9', items: 5, status: 'Chờ duyệt', date: '08/05/2026' },
  { id: '#KF-12397', _id: '#KF-12397', store: 'Kingfood Nguyễn Văn Linh, Q.7', items: 15, status: 'Đang xử lý', date: '07/05/2026' },
  { id: '#KF-12396', _id: '#KF-12396', store: 'Kingfood Đinh Tiên Hoàng, Q.1', items: 10, status: 'Hoàn thành', date: '06/05/2026' },
];

const statusConfig = {
  'Chờ duyệt': { color: '#fff3e0', textColor: '#e65100' },
  'Đang xử lý': { color: '#e3f2fd', textColor: '#1565c0' },
  'Hoàn thành': { color: '#e8f5e9', textColor: COLORS.primary },
  'Đã từ chối': { color: '#ffebee', textColor: '#c62828' },
};

export default function OrderProcessingScreen() {
  const [filter, setFilter] = useState('all');
  const [orders, setOrders] = useState(mockOrders);
  const [loadingOrders, setLoadingOrders] = useState(true);
  useEffect(() => {
    async function fetchOrders(){
      try{
        const res = await getOrders();
        if (Array.isArray(res)) {
          setOrders(res.map(o => ({
            id: o.id || o._id,
            _id: o._id || o.id,
            store: o.store || o.storeName || '',
            items: o.items || o.totalItems || o.productCount || 0,
            date: o.date || (o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : ''),
            status: o.status,
          })));
        }
      }
      catch(err){
        // fallback to mock data
      }
      finally{
        setLoadingOrders(false);
      }
    }
    fetchOrders();
  }, [])
  const statusMap = {
    pending: ['Chờ duyệt', 'pending'],
    processing: ['Đang xử lý', 'processing'],
    done: ['Hoàn thành', 'completed', 'done'],
  };
  const filteredOrders = filter === 'all' ? orders : orders.filter(o =>
    (statusMap[filter] || []).includes(o.status)
  );

  const handleAction = (order) => {
    const orderId = order._id || order.id;
    if (order.status === 'Chờ duyệt' || order.status === 'pending') {
      Alert.alert(
        'Xử lý đơn hàng',
        `${order.id || order._id} - ${order.store || order.storeName}\n\nDuyệt đơn hàng này?`,
        [
          { text: 'Từ chối', style: 'destructive' ,
            onPress : async() =>{
              try{
                await updateOrderStatus(orderId, 'cancelled');
                setOrders(prev => prev.map(o =>
                  (o._id || o.id) === orderId ? {...o, status: 'Đã từ chối'} : o
                ));
              } catch(err) {Alert.alert('Lỗi!', err.message);}
            }
          },
          { text: 'Để sau', style: 'cancel' },
          { text: 'Duyệt', onPress: async () =>{
            try{
            await updateOrderStatus(orderId, 'approved');
            setOrders(prev => prev.map(o=>
              (o._id || o.id) === orderId ? {...o, status: 'Đang xử lí'}: o
            ));
            Alert.alert('✅ Đã duyệt', `Đơn hàng đã được duyệt`);
          } catch(err) { Alert.alert('Lỗi', err.message); }
        }
      },
    ]
  );
} else if (order.status === 'Đang xử lý' || order.status === 'processing') {
      router.push('/productlist');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xử lý đơn hàng</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'pending', label: 'Chờ duyệt' },
          { key: 'processing', label: 'Đang xử lý' },
          { key: 'done', label: 'Hoàn thành' },
        ].map(f => (
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
      {loadingOrders ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView style={styles.scroll}>
          {filteredOrders.length === 0 ? (
            <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
          ) : (
            filteredOrders.map((order) => {
              const cfg = statusConfig[order.status] || statusConfig['Đang xử lý'];
              return (
                <TouchableOpacity
                  key={order.id || order._id}
                  style={styles.orderCard}
                  onPress={() => handleAction(order)}
                >
                  <View style={styles.orderHead}>
                    <Text style={styles.orderId}>{order.id || order._id}</Text>
                    <View style={[styles.statusTag, { backgroundColor: cfg.color }]}>
                      <Text style={[styles.statusText, { color: cfg.textColor }]}>{order.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderStore}>{order.store}</Text>
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderItems}>{order.items} sản phẩm</Text>
                    <Text style={styles.orderDate}>{order.date}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f1' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { fontSize: 28, color: COLORS.primary },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  filterRow: {
    flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#aaa', fontSize: 14, marginTop: 40 },
  scroll: { flex: 1, padding: 16 },
  orderCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  orderHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  orderId: { fontSize: 14, fontWeight: '700', color: '#222' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderStore: { fontSize: 12, color: '#888', marginBottom: 8 },
  orderFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 0.5, borderTopColor: '#eee', paddingTop: 8,
  },
  orderItems: { fontSize: 12, color: '#666' },
  orderDate: { fontSize: 11, color: '#aaa' },
});
