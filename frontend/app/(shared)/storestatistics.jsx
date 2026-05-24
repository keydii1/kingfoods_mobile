import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { Alert } from '../../utils/appAlert';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { getClientStatistics, cancelClientOrder, BASE_URL } from '../../constants/services/api';
import { getOrderStatusMeta, canCustomerCancelOrder } from '../../constants/orderStatus';
import { subscribeOrdersRefresh, notifyOrdersRefresh } from '../../utils/ordersRefresh';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { translateProductName, translateUnit } from '../../utils/translator';

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

const TRANSLATIONS = {
  vi: {
    stats: 'Thống kê',
    statsTitle: 'Thống kê cửa hàng',
    order: 'Đặt hàng',
    settings: 'Cài đặt',
    profile: 'Cá nhân',
    fromDate: 'Từ ngày',
    toDate: 'Đến ngày',
    filter: 'Lọc',
    today: 'Hôm nay',
    week: '7 ngày qua',
    month: 'Tháng này',
    topProducts: 'Top sản phẩm đặt nhiều nhất',
    ordersPeriod: 'Đơn hàng trong giai đoạn',
    noProductData: 'Không có dữ liệu sản phẩm trong khoảng thời gian này',
    noOrdersFound: 'Không tìm thấy đơn hàng nào',
    cancelOrder: 'Huỷ đơn hàng',
    cancelConfirm: 'Huỷ đơn #',
    cancel: 'Huỷ',
    stay: 'Không',
    success: 'Thành công',
    error: 'Lỗi',
    cancelSuccess: 'Đơn hàng đã được huỷ',
    cancelFail: 'Không thể huỷ đơn',
    formatError: 'Định dạng sai',
    formatErrorMsg: 'Vui lòng nhập ngày theo định dạng YYYY-MM-DD (Ví dụ: 2026-05-18)',
    placed: 'Đơn đã đặt',
    processing: 'Đang xử lý',
    delivered: 'Đã giao',
    cancelled: 'Đã huỷ',
    pending: 'Chờ xác nhận',
    items: 'sản phẩm',
  },
  en: {
    stats: 'Statistics',
    statsTitle: 'Store Statistics',
    order: 'Order',
    settings: 'Settings',
    profile: 'Profile',
    fromDate: 'From Date',
    toDate: 'To Date',
    filter: 'Filter',
    today: 'Today',
    week: 'Last 7 days',
    month: 'This month',
    topProducts: 'Most Ordered Products',
    ordersPeriod: 'Orders in Period',
    noProductData: 'No product data in this period',
    noOrdersFound: 'No orders found',
    cancelOrder: 'Cancel Order',
    cancelConfirm: 'Cancel order #',
    cancel: 'Cancel',
    stay: 'No',
    success: 'Success',
    error: 'Error',
    cancelSuccess: 'Order successfully cancelled',
    cancelFail: 'Cannot cancel order',
    formatError: 'Invalid Format',
    formatErrorMsg: 'Please enter date in YYYY-MM-DD format (e.g. 2026-05-18)',
    placed: 'Placed Orders',
    processing: 'Processing',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    pending: 'Pending',
    items: 'products',
  }
};

export default function StoreStatisticsScreen() {
  const { darkMode, language } = useAppPreferences();
  const t = TRANSLATIONS[language] || TRANSLATIONS.vi;
  const insets = useSafeAreaInsets();

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
  const [selectedStatus, setSelectedStatus] = useState('all');
  const hasLoadedRef = useRef(false);

  const fetchStats = useCallback(async (start = startDate, end = endDate, silent = false) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(start) || !regex.test(end)) {
      return;
    }
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
        Alert.alert(t.error, 'Không thể kết nối đến máy chủ.');
        setOrders([]);
        setTopProducts([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [startDate, endDate, t.error]);

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
      Alert.alert(t.formatError, t.formatErrorMsg);
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
    { key: 'all', icon: 'cube-outline', value: String(orders.length),
      label: t.placed, color: darkMode ? '#1e2a1e' : '#e8f5e9', textColor: COLORS.primary },
    { key: 'pending', icon: 'hourglass-outline', value: String(orders.filter(o => o.status === 'pending').length),
      label: t.pending, color: darkMode ? '#33230a' : '#fff3e0', textColor: '#e65100' },
    { key: 'processing', icon: 'time-outline', value: String(orders.filter(o => o.status === 'processing').length),
      label: t.processing, color: darkMode ? '#1a2436' : '#e3f2fd', textColor: '#1565c0' },
    { key: 'delivered', icon: 'checkmark-circle-outline', value: String(orders.filter(o => o.status === 'delivered').length),
      label: t.delivered, color: darkMode ? '#1e2a1e' : '#e8f5e9', textColor: COLORS.primary },
    { key: 'cancelled', icon: 'close-circle-outline', value: String(orders.filter(o => o.status === 'cancelled').length),
      label: t.cancelled, color: darkMode ? '#3b181a' : '#ffebee', textColor: '#e53935' },
  ];

  const filteredOrders = useMemo(() => {
    if (selectedStatus === 'all') return orders;
    return orders.filter(o => o.status === selectedStatus);
  }, [orders, selectedStatus]);

  const openOrderDetail = (order) => {
    router.push({
      pathname: '/orderdetail',
      params: { orderId: String(order.id) },
    });
  };

  const handleQuickCancel = (order) => {
    const id = order.id;
    Alert.alert(
      t.cancelOrder,
      `${t.cancelConfirm}${id}?`,
      [
        { text: t.stay, style: 'cancel' },
        {
          text: t.cancel,
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelClientOrder(id);
              setOrders((prev) =>
                prev.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o))
              );
              notifyOrdersRefresh();
              fetchStats(startDate, endDate, true);
              Alert.alert(t.success, t.cancelSuccess);
            } catch (err) {
              Alert.alert(t.error, err.message || t.cancelFail);
            }
          },
        },
      ]
    );
  };

  // Dark Mode variables
  const activeBg = darkMode ? '#121212' : '#f0f4f1';
  const activeCardBg = darkMode ? '#1e1e1e' : '#fff';
  const activeTextColor = darkMode ? '#f3f4f6' : '#222';
  const activeTextGrayColor = darkMode ? '#9ca3af' : '#888';
  const activeBorderColor = darkMode ? '#2d2d2d' : '#eee';
  const activeInputBg = darkMode ? '#2d2d2d' : '#f5f7f6';

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: activeCardBg, borderBottomColor: activeBorderColor }]}>
        <TouchableOpacity onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/storeorder');
          }
        }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeTextColor }]}>{t.statsTitle}</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Date Filter Panel */}
      <View style={[styles.filterCard, { backgroundColor: activeCardBg }]}>
        <View style={styles.dateInputsRow}>
          <View style={styles.dateField}>
            <Text style={[styles.dateLabel, { color: activeTextGrayColor }]}>{t.fromDate}</Text>
            <TextInput
              style={[styles.dateInput, { backgroundColor: activeInputBg, color: activeTextColor, borderColor: activeBorderColor }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={activeTextGrayColor}
              value={startDate}
              onChangeText={setStartDate}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.dateField}>
            <Text style={[styles.dateLabel, { color: activeTextGrayColor }]}>{t.toDate}</Text>
            <TextInput
              style={[styles.dateInput, { backgroundColor: activeInputBg, color: activeTextColor, borderColor: activeBorderColor }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={activeTextGrayColor}
              value={endDate}
              onChangeText={setEndDate}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Preset Badges */}
        <View style={styles.presetRow}>
          <TouchableOpacity 
            style={[styles.presetBadge, { backgroundColor: darkMode ? '#2d2d2d' : '#f0f3f1' }, activePreset === 'today' && styles.presetActive]} 
            onPress={() => applyPreset('today')}
          >
            <Text style={[styles.presetText, { color: activeTextGrayColor }, activePreset === 'today' && styles.presetTextActive]}>{t.today}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.presetBadge, { backgroundColor: darkMode ? '#2d2d2d' : '#f0f3f1' }, activePreset === 'week' && styles.presetActive]} 
            onPress={() => applyPreset('week')}
          >
            <Text style={[styles.presetText, { color: activeTextGrayColor }, activePreset === 'week' && styles.presetTextActive]}>{t.week}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.presetBadge, { backgroundColor: darkMode ? '#2d2d2d' : '#f0f3f1' }, activePreset === 'month' && styles.presetActive]} 
            onPress={() => applyPreset('month')}
          >
            <Text style={[styles.presetText, { color: activeTextGrayColor }, activePreset === 'month' && styles.presetTextActive]}>{t.month}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16 }}>
          {/* KPI Grid */}
          <View style={styles.kpiGrid}>
            {displayKpis.map((item, index) => {
              const isActive = selectedStatus === item.key;
              return (
                <TouchableOpacity 
                  key={item.key} 
                  style={[
                    styles.kpiCard, 
                    { backgroundColor: item.color },
                    isActive && { borderWidth: 2, borderColor: item.textColor }
                  ]}
                  onPress={() => setSelectedStatus(item.key === selectedStatus ? 'all' : item.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={item.icon} size={24} color={item.textColor} style={{ marginBottom: 4 }} />
                  <Text style={[styles.kpiValue, { color: item.textColor }]}>{item.value}</Text>
                  <Text style={[styles.kpiLabel, darkMode && { color: '#9ca3af' }]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Top sản phẩm */}
          <View style={[styles.card, { backgroundColor: activeCardBg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <Ionicons name="flame-outline" size={20} color={activeTextColor} style={{ marginRight: 6 }} />
              <Text style={[styles.cardTitle, { color: activeTextColor }]}>{t.topProducts}</Text>
            </View>
            {topProducts.length > 0 ? (
              topProducts.map((p, i) => (
                <View key={i} style={styles.topRow}>
                  <Text style={styles.topRank}>{i + 1}</Text>
                  <View style={styles.topInfo}>
                    <Text style={[styles.topName, { color: activeTextColor }]}>{translateProductName(p.name, language)}</Text>
                    <Text style={[styles.topQty, { color: activeTextGrayColor }]}>{p.qty} {translateUnit(p.unit, language)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: activeTextGrayColor }}>{t.noProductData}</Text>
              </View>
            )}
          </View>

          {/* Đơn hàng gần đây */}
          <View style={[styles.card, { backgroundColor: activeCardBg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <Ionicons name="document-text-outline" size={20} color={activeTextColor} style={{ marginRight: 6 }} />
              <Text style={[styles.cardTitle, { color: activeTextColor }]}>{t.ordersPeriod}</Text>
            </View>

            {/* Premium Status Filters Tab Bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14, flexDirection: 'row' }}>
              {[
                { key: 'all', label: 'Tất cả', count: orders.length },
                { key: 'pending', label: 'Chờ xác nhận', count: orders.filter(o => o.status === 'pending').length },
                { key: 'processing', label: 'Đang xử lý', count: orders.filter(o => o.status === 'processing').length },
                { key: 'delivered', label: 'Đã hoàn thành', count: orders.filter(o => o.status === 'delivered').length },
                { key: 'cancelled', label: 'Đã hủy', count: orders.filter(o => o.status === 'cancelled').length },
              ].map(tab => {
                const isActive = selectedStatus === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      backgroundColor: isActive ? COLORS.primary : (darkMode ? '#2d2d2d' : '#f0f3f1'),
                      marginRight: 8,
                      borderWidth: 1.5,
                      borderColor: isActive ? COLORS.primary : (darkMode ? '#3d3d3d' : '#e2e8e3'),
                    }}
                    onPress={() => setSelectedStatus(tab.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: isActive ? '#fff' : (darkMode ? '#d1d5db' : '#555'),
                    }}>
                      {tab.label} ({tab.count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {filteredOrders.length > 0 ? (
              filteredOrders.map((o) => {
                const meta = getOrderStatusMeta(o.status);
                const cancellable = canCustomerCancelOrder(o.status);
                const itemCount = o.orderDetails?.length || 0;
                const total = `${(parseFloat(o.totalPrice) || 0).toLocaleString()}đ`;
                const date = formatVietnamDateOnly(o.createdAt);

                return (
                  <TouchableOpacity
                    key={o.id}
                    style={[styles.orderRow, { borderBottomColor: activeBorderColor }]}
                    onPress={() => openOrderDetail(o)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.orderInfo}>
                      <Text style={[styles.orderId, { color: activeTextColor }]}>#{o.id}</Text>
                      <Text style={[styles.orderDate, { color: activeTextGrayColor }]}>
                        {date} · {itemCount} {t.items}
                      </Text>
                      {cancellable && (
                        <TouchableOpacity
                          style={styles.cancelLink}
                          onPress={() => handleQuickCancel(o)}
                        >
                          <Text style={styles.cancelLinkText}>{t.cancel}</Text>
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
                <Text style={{ fontSize: 13, color: activeTextGrayColor }}>{t.noOrdersFound}</Text>
              </View>
            )}
          </View>
        </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { backgroundColor: activeCardBg, borderTopColor: activeBorderColor, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/storeorder')}>
          <Ionicons name="cart-outline" size={22} color={activeTextGrayColor} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, { color: activeTextGrayColor }]}>{t.order}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="stats-chart" size={22} color={COLORS.primary} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, styles.navActive]}>{t.stats}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/setting')}>
          <Ionicons name="settings-outline" size={22} color={activeTextGrayColor} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, { color: activeTextGrayColor }]}>{t.settings}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/customerprofile')}>
          <Ionicons name="person-outline" size={22} color={activeTextGrayColor} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, { color: activeTextGrayColor }]}>{t.profile}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f1' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  scroll: { flex: 1 },
  kpiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12,
  },
  kpiCard: {
    width: '31%', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4,
  },
  kpiValue: { fontSize: 22, fontWeight: '900' },
  kpiLabel: { fontSize: 10, color: '#888', textAlign: 'center' },
  card: {
    borderRadius: 16, padding: 16, marginBottom: 12,
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
    flexDirection: 'row', paddingVertical: 10,
    borderTopWidth: 1,
  },
  navItem: { flex: 1, alignItems: 'center' },
  navLabel: { fontSize: 10, marginTop: 2 },
  navActive: { color: COLORS.primary, fontWeight: '600' },
  filterCard: {
    padding: 14, marginHorizontal: 16, marginTop: 12, borderRadius: 16,
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
    borderWidth: 1, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 10, fontSize: 13, fontWeight: '500',
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
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20,
  },
  presetActive: {
    borderWidth: 1, borderColor: COLORS.primary,
  },
  presetText: {
    fontSize: 11, fontWeight: '500',
  },
  presetTextActive: {
    color: COLORS.primary, fontWeight: '600',
  },
});
