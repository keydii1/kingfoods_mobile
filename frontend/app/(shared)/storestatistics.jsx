import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import {useState, useEffect} from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import {getClientOrders} from '../../constants/services/api';

const kpis = [
  { icon: '📦', value: '24', label: 'Đơn đã đặt (tháng)', color: '#e8f5e9', textColor: COLORS.primary },
  { icon: '✅', value: '18', label: 'Đã giao', color: '#e3f2fd', textColor: '#1565c0' },
  { icon: '⏳', value: '4', label: 'Đang xử lý', color: '#fff3e0', textColor: '#e65100' },
  { icon: '❌', value: '2', label: 'Đã huỷ', color: '#ffebee', textColor: '#e53935' },
];

const recentOrders = [
  { id: '#KF-12400', date: '10/05/2026', items: 12, total: '245,000đ', status: 'Đã giao' },
  { id: '#KF-12399', date: '09/05/2026', items: 8, total: '180,000đ', status: 'Đã giao' },
  { id: '#KF-12398', date: '08/05/2026', items: 5, total: '96,000đ', status: 'Đang xử lý' },
  { id: '#KF-12397', date: '07/05/2026', items: 15, total: '320,000đ', status: 'Đã huỷ' },
];

const mockTopProducts = [
  { name: 'Mì gói Hảo Hảo', qty: 120, unit: 'Gói' },
  { name: 'Nước tương Chinsu', qty: 85, unit: 'Chai' },
  { name: 'Coca Cola 330ml', qty: 72, unit: 'Lon' },
];

export default function StoreStatisticsScreen() {
  const [topProducts, setTopProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchStats(){
      try{
        const res = await getClientOrders();
        setOrders(Array.isArray(res) ? res : []);
        const top = res.topProducts || [];
        setTopProducts(top.length > 0 ? top : mockTopProducts);
      }
      catch(err){
        // giữ mockdata nếu bị lỗi
      }
      finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [])
  // Tính kpi từ API
  const displayKpis = orders.length > 0 ? [
    { icon: '📦', value: String(orders.length),
      label: 'Đơn đã đặt (tháng)', color: '#e8f5e9', textColor: COLORS.primary },
    { icon: '✅', value: String(orders.filter(o => o.status === 'delivered').length),
      label: 'Đã giao', color: '#e3f2fd', textColor: '#1565c0' },
    { icon: '⏳', value: String(orders.filter(o => o.status === 'processing').length),
      label: 'Đang xử lý', color: '#fff3e0', textColor: '#e65100' },
    { icon: '❌', value: String(orders.filter(o => o.status === 'cancelled').length),
      label: 'Đã huỷ', color: '#ffebee', textColor: '#e53935' },
  ] : kpis ; // fallback mock
  const displayOrders = orders.length > 0
    ? orders.slice(0, 10).map(o => ({
        id: `#${o.orderId || o._id}`,
        date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '',
        items: o.items?.length || 0,
        total: `${(o.totalAmount || 0).toLocaleString()}đ`,
        status: o.status === 'delivered'  ? 'Đã giao'
              : o.status === 'processing' ? 'Đang xử lý'
              : o.status === 'cancelled'  ? 'Đã huỷ' : o.status,
    }))
    : recentOrders; // fallback mock
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thống kê cửa hàng</Text>
        <View style={{ width: 28 }} />
      </View>
      {loading ? (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
) : (
      <ScrollView style={styles.scroll}>
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          {displayKpis.map((item, index) => (
            <View key={item.label} style={[styles.kpiCard, { backgroundColor: item.color }]}>
              <Text style={styles.kpiIcon}>{item.icon}</Text>
              <Text style={[styles.kpiValue, { color: item.textColor }]}>{item.value}</Text>
              <Text style={styles.kpiLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Top sản phẩm */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 Top sản phẩm đặt nhiều nhất</Text>
          {(topProducts.length > 0 ? topProducts : mockTopProducts).map((p, i) => (
            <View key={i} style={styles.topRow}>
              <Text style={styles.topRank}>{i + 1}</Text>
              <View style={styles.topInfo}>
                <Text style={styles.topName}>{p.name}</Text>
                <Text style={styles.topQty}>{p.qty} {p.unit}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Đơn hàng gần đây */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Đơn hàng gần đây</Text>
          {displayOrders.map((order, i) => (
            <View key={i} style={styles.orderRow}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>{order.id}</Text>
                <Text style={styles.orderDate}>{order.date} · {order.items} sản phẩm</Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderTotal}>{order.total}</Text>
                <Text style={[styles.orderStatus, {
                  color: order.status === 'Đã giao' ? COLORS.primary :
                         order.status === 'Đang xử lý' ? '#e65100' : '#e53935'
                }]}>{order.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      )}
      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/storeorder')}>
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navLabel}>Đặt hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={[styles.navLabel, styles.navActive]}>Thống kê</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/setting')}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Cài đặt</Text>
        </TouchableOpacity>
      </View>
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
  scroll: { flex: 1, padding: 16 },
  kpiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12,
  },
  kpiCard: {
    width: '47%', borderRadius: 16, padding: 14, alignItems: 'center', gap: 4,
  },
  kpiIcon: { fontSize: 24 },
  kpiValue: { fontSize: 26, fontWeight: '900' },
  kpiLabel: { fontSize: 11, color: '#888', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#222', marginBottom: 14 },
  topRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12,
  },
  topRank: {
    fontSize: 16, fontWeight: '800', color: COLORS.primary, width: 24,
  },
  topInfo: { flex: 1 },
  topName: { fontSize: 13, fontWeight: '600', color: '#222' },
  topQty: { fontSize: 11, color: '#888', marginTop: 2 },
  orderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  orderInfo: { flex: 1 },
  orderId: { fontSize: 13, fontWeight: '600', color: '#222' },
  orderDate: { fontSize: 11, color: '#888', marginTop: 2 },
  orderRight: { alignItems: 'flex-end' },
  orderTotal: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  orderStatus: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  bottomNav: {
    flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 10, color: '#aaa', marginTop: 2 },
  navActive: { color: COLORS.primary, fontWeight: '600' },
});
