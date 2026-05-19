import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { Alert } from '../../utils/appAlert';
import { useState, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { getClientStatistics, cancelClientOrder, BASE_URL } from '../../constants/services/api';
import { getOrderStatusMeta, canCustomerCancelOrder } from '../../constants/orderStatus';
import { subscribeOrdersRefresh, notifyOrdersRefresh } from '../../utils/ordersRefresh';

// Timezone date helper for Vietnam (UTC+7)
const formatVietnamDateOnly = (dateStr) => {
  if (!dateStr) return '';
  let date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  // Workaround: If connecting to Render (which has the timezone bug), compensate by adding 7 hours
  if (BASE_URL && BASE_URL.includes('onrender.com')) {
    date = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  }
  
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  
  return `${d}/${m}/${y}`;
};

const defaultKpis = [
  { icon: 'cube-outline', value: '0', label: 'Đơn đã đặt', color: '#e8f5e9', textColor: COLORS.primary },
  { icon: 'checkmark-circle-outline', value: '0', label: 'Đã giao', color: '#e3f2fd', textColor: '#1565c0' },
  { icon: 'hourglass-outline', value: '0', label: 'Chờ xác nhận', color: '#fff3e0', textColor: '#e65100' },
  { icon: 'time-outline', value: '0', label: 'Đang xử lý', color: '#e3f2fd', textColor: '#1565c0' },
  { icon: 'close-circle-outline', value: '0', label: 'Đã huỷ', color: '#ffebee', textColor: '#e53935' },
];

export default function StoreStatisticsScreen() {
  const getFirstDayOfMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  };

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [topProducts, setTopProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getTodayStr());
  const [activePreset, setActivePreset] = useState('month');
  const hasLoadedRef = useRef(false);

  const fetchStats = useCallback(async (start = startDate, end = endDate, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getClientStatistics(start, end);
      const rawOrders = res?.orders || [];
      const sortedOrders = [...rawOrders].sort((a, b) => b.id - a.id);
      setOrders(sortedOrders);
      setTopProducts(res?.topProducts || []);
    } catch (err) {
      console.log('Fetch stats error:', err.message);
      if (!silent) {
        Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
        setOrders([]);
        setTopProducts([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [startDate, endDate]);

  useFocusEffect(
    useCallback(() => {
      fetchStats(startDate, endDate, hasLoadedRef.current);
      hasLoadedRef.current = true;

      return subscribeOrdersRefresh(() => {
        fetchStats(startDate, endDate, true);
      });
    }, [fetchStats, startDate, endDate])
  );

  const handleFilterPress = () => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(startDate) || !regex.test(endDate)) {
      Alert.alert('Định dạng sai', 'Vui lòng nhập ngày theo định dạng YYYY-MM-DD (Ví dụ: 2026-05-18)');
      return;
    }
    setActivePreset('');
    fetchStats(startDate, endDate);
  };

  const applyPreset = (preset) => {
    const today = getTodayStr();
    let start = '';
    if (preset === 'today') {
      start = today;
    } else if (preset === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else if (preset === 'month') {
      start = getFirstDayOfMonth();
    }
    setStartDate(start);
    setEndDate(today);
    setActivePreset(preset);
    fetchStats(start, today);
  };

  const displayKpis = [
    { icon: 'cube-outline', value: String(orders.length),
      label: 'Đơn đã đặt', color: '#e8f5e9', textColor: COLORS.primary },
    { icon: 'hourglass-outline', value: String(orders.filter(o => o.status === 'pending').length),
      label: 'Chờ xác nhận', color: '#fff3e0', textColor: '#e65100' },
    { icon: 'time-outline', value: String(orders.filter(o => o.status === 'processing').length),
      label: 'Đang xử lý', color: '#e3f2fd', textColor: '#1565c0' },
    { icon: 'checkmark-circle-outline', value: String(orders.filter(o => o.status === 'delivered').length),
      label: 'Đã giao', color: '#e8f5e9', textColor: COLORS.primary },
    { icon: 'close-circle-outline', value: String(orders.filter(o => o.status === 'cancelled').length),
      label: 'Đã huỷ', color: '#ffebee', textColor: '#e53935' },
  ];

  const openOrderDetail = (order) => {
    router.push({
      pathname: '/orderdetail',
      params: { orderId: String(order.id) },
    });
  };

  const handleQuickCancel = (order) => {
    const id = order.id;
    Alert.alert(
      'Huỷ đơn hàng',
      `Huỷ đơn #${id}?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Huỷ đơn',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelClientOrder(id);
              setOrders((prev) =>
                prev.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o))
              );
              notifyOrdersRefresh();
              fetchStats(startDate, endDate, true);
              Alert.alert('Thành công', 'Đơn hàng đã được huỷ');
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể huỷ đơn');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thống kê cửa hàng</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Date Filter Panel */}
      <View style={styles.filterCard}>
        <View style={styles.dateInputsRow}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Từ ngày</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              value={startDate}
              onChangeText={setStartDate}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Đến ngày</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              value={endDate}
              onChangeText={setEndDate}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={handleFilterPress}>
            <Ionicons name="funnel-outline" size={14} color="#fff" />
            <Text style={styles.filterBtnText}>Lọc</Text>
          </TouchableOpacity>
        </View>

        {/* Preset Badges */}
        <View style={styles.presetRow}>
          <TouchableOpacity 
            style={[styles.presetBadge, activePreset === 'today' && styles.presetActive]} 
            onPress={() => applyPreset('today')}
          >
            <Text style={[styles.presetText, activePreset === 'today' && styles.presetTextActive]}>Hôm nay</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.presetBadge, activePreset === 'week' && styles.presetActive]} 
            onPress={() => applyPreset('week')}
          >
            <Text style={[styles.presetText, activePreset === 'week' && styles.presetTextActive]}>7 ngày qua</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.presetBadge, activePreset === 'month' && styles.presetActive]} 
            onPress={() => applyPreset('month')}
          >
            <Text style={[styles.presetText, activePreset === 'month' && styles.presetTextActive]}>Tháng này</Text>
          </TouchableOpacity>
        </View>
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
                <Ionicons name={item.icon} size={24} color={item.textColor} style={{ marginBottom: 4 }} />
                <Text style={[styles.kpiValue, { color: item.textColor }]}>{item.value}</Text>
                <Text style={styles.kpiLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Top sản phẩm */}
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <Ionicons name="flame-outline" size={20} color="#222" style={{ marginRight: 6 }} />
              <Text style={styles.cardTitle}>Top sản phẩm đặt nhiều nhất</Text>
            </View>
            {topProducts.length > 0 ? (
              topProducts.map((p, i) => (
                <View key={i} style={styles.topRow}>
                  <Text style={styles.topRank}>{i + 1}</Text>
                  <View style={styles.topInfo}>
                    <Text style={styles.topName}>{p.name}</Text>
                    <Text style={styles.topQty}>{p.qty} {p.unit}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#999' }}>Không có dữ liệu sản phẩm trong khoảng thời gian này</Text>
              </View>
            )}
          </View>

          {/* Đơn hàng gần đây */}
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <Ionicons name="document-text-outline" size={20} color="#222" style={{ marginRight: 6 }} />
              <Text style={styles.cardTitle}>Đơn hàng trong giai đoạn</Text>
            </View>
            {orders.length > 0 ? (
              orders.map((o) => {
                const meta = getOrderStatusMeta(o.status);
                const cancellable = canCustomerCancelOrder(o.status);
                const itemCount = o.orderDetails?.length || 0;
                const total = `${(parseFloat(o.totalPrice) || 0).toLocaleString()}đ`;
                const date = formatVietnamDateOnly(o.createdAt);

                return (
                  <TouchableOpacity
                    key={o.id}
                    style={styles.orderRow}
                    onPress={() => openOrderDetail(o)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderId}>#{o.id}</Text>
                      <Text style={styles.orderDate}>
                        {date} · {itemCount} sản phẩm
                      </Text>
                      {cancellable && (
                        <TouchableOpacity
                          style={styles.cancelLink}
                          onPress={() => handleQuickCancel(o)}
                        >
                          <Text style={styles.cancelLinkText}>Huỷ đơn</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.orderRight}>
                      <Text style={styles.orderTotal}>{total}</Text>
                      <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.orderStatus, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#ccc" style={{ marginTop: 6 }} />
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#999' }}>Không tìm thấy đơn hàng nào</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/storeorder')}>
          <Ionicons name="cart-outline" size={22} color="#aaa" style={{ marginBottom: 2 }} />
          <Text style={styles.navLabel}>Đặt hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="stats-chart" size={22} color={COLORS.primary} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, styles.navActive]}>Thống kê</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/setting')}>
          <Ionicons name="settings-outline" size={22} color="#aaa" style={{ marginBottom: 2 }} />
          <Text style={styles.navLabel}>Cài đặt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/customerprofile')}>
          <Ionicons name="person-outline" size={22} color="#aaa" style={{ marginBottom: 2 }} />
          <Text style={styles.navLabel}>Cá nhân</Text>
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
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  scroll: { flex: 1, padding: 16 },
  kpiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12,
  },
  kpiCard: {
    width: '31%', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4,
  },
  kpiValue: { fontSize: 22, fontWeight: '900' },
  kpiLabel: { fontSize: 10, color: '#888', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#222' },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    gap: 8,
  },
  orderInfo: { flex: 1 },
  orderId: { fontSize: 14, fontWeight: '700', color: '#222' },
  orderDate: { fontSize: 11, color: '#888', marginTop: 3 },
  cancelLink: { marginTop: 6, alignSelf: 'flex-start' },
  cancelLinkText: { fontSize: 12, fontWeight: '700', color: '#e53935' },
  orderRight: { alignItems: 'flex-end' },
  orderTotal: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  orderStatus: { fontSize: 11, fontWeight: '700' },
  bottomNav: {
    flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  navItem: { flex: 1, alignItems: 'center' },
  navLabel: { fontSize: 10, color: '#aaa', marginTop: 2 },
  navActive: { color: COLORS.primary, fontWeight: '600' },
  filterCard: {
    backgroundColor: '#fff', padding: 14, marginHorizontal: 16, marginTop: 12, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  dateInputsRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10, fontWeight: '600', color: '#666', marginBottom: 4, marginLeft: 2,
  },
  dateInput: {
    backgroundColor: '#f5f7f6', borderWidth: 1, borderColor: '#e0e5e2', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 10, fontSize: 13, color: '#333', fontWeight: '500',
  },
  filterBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4, height: 38, justifyContent: 'center',
  },
  filterBtnText: {
    color: '#fff', fontSize: 13, fontWeight: '600',
  },
  presetRow: {
    flexDirection: 'row', gap: 8, marginTop: 10,
  },
  presetBadge: {
    backgroundColor: '#f0f3f1', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20,
  },
  presetActive: {
    backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: COLORS.primary,
  },
  presetText: {
    fontSize: 11, color: '#666', fontWeight: '500',
  },
  presetTextActive: {
    color: COLORS.primary, fontWeight: '600',
  },
});
