import { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Alert } from '../../utils/appAlert';
import { getAssignedTasks } from '../../constants/services/api';
import StaffBottomNav from '../../components/StaffBottomNav';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

const cleanLocationName = (name) => {
    if (!name) return '';
    return name.replace(/^[🥦🥫🧴❄️\s]+/, '').replace(/^[^a-zA-Z0-9À-ỹđĐ\s]+/, '').trim();
};

const TRANSLATIONS = {
  vi: {
    headerTitle: 'Tìm kiếm nhiệm vụ hôm nay',
    searchPlaceholder: 'Tìm theo sản phẩm, mã đơn hoặc chi nhánh...',
    emptyTasks: 'Không tìm thấy nhiệm vụ nào trong hôm nay',
    completedAlert: 'Nhiệm vụ này đã hoàn tất!',
    unassignedZone: 'Chưa phân khu',
    taskTitle: 'Nhiệm vụ',
    orderText: 'Đơn',
    sp: 'sp',
    all: 'Tất cả',
    pending: 'Chờ lấy',
    picking: 'Đang lấy',
    completed: 'Hoàn tất',
    errorTitle: 'Lỗi',
    errorDesc: 'Không thể tải danh sách nhiệm vụ',
  },
  en: {
    headerTitle: "Search Today's Tasks",
    searchPlaceholder: 'Search by product, order ID or branch...',
    emptyTasks: 'No tasks found today',
    completedAlert: 'This task is already completed!',
    unassignedZone: 'Unassigned Zone',
    taskTitle: 'Task',
    orderText: 'Order',
    sp: 'pcs',
    all: 'All',
    pending: 'Pending',
    picking: 'Picking',
    completed: 'Completed',
    errorTitle: 'Error',
    errorDesc: 'Unable to load task list',
  }
};


export default function OrderSearchScreen() {
  const { darkMode, language } = useAppPreferences();

  const activeBg = darkMode ? '#121212' : '#f9fafb';
  const activeHeaderBg = darkMode ? '#1e1e1e' : '#fff';
  const activeBorderColor = darkMode ? '#2d2d2d' : '#f1f5f9';
  const activeTextColor = darkMode ? '#f3f4f6' : COLORS.text;
  const activeCardBg = darkMode ? '#1e1e1e' : '#fff';
  const activeTextGrayColor = darkMode ? '#9ca3af' : '#64748b';
  const activeInputBg = darkMode ? '#2d2d2d' : '#f1f5f9';
  const activeInputText = darkMode ? '#f3f4f6' : COLORS.text;
  const activeTabBg = darkMode ? '#2d2d2d' : '#f1f5f9';
  const activeTabBorder = darkMode ? '#3d3d3d' : '#e2e8f0';

  const t = TRANSLATIONS[language];

  const FILTER_TABS = [
    { key: 'all', label: t.all },
    { key: 'pending', label: t.pending },
    { key: 'picking', label: t.picking },
    { key: 'completed', label: t.completed },
  ];

  const [tasks, setTasks] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await getAssignedTasks();
      setTasks(Array.isArray(res) ? res : []);
    } catch (err) {
      Alert.alert(t.errorTitle, t.errorDesc);
    } finally {
      setLoading(false);
    }
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const filtered = tasks.filter(t => {
    // 1. Chỉ hiển thị task trong ngày hôm nay
    if (!isToday(t.createdAt)) return false;

    // 2. Lọc theo trạng thái picking task
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;

    // 3. Lọc theo thanh tìm kiếm (Mã đơn, Tên sản phẩm, Tên cửa hàng)
    if (query.trim()) {
      const q = query.toLowerCase();
      const orderId = String(t.orderDetail?.orderId || '');
      const productName = (t.orderDetail?.product?.name || '').toLowerCase();
      const branchName = (t.orderDetail?.order?.branch?.name || '').toLowerCase();
      const taskId = String(t.id || '');

      return orderId.includes(q) || productName.includes(q) || branchName.includes(q) || taskId.includes(q);
    }
    return true;
  });

  const handleTaskPress = (task) => {
    if (task.status === 'completed') {
      Alert.alert(t.taskTitle, t.completedAlert);
      return;
    }
    router.push({
      pathname: '/pickingflow',
      params: { taskId: task.id }
    });
  };

  const getStatusTheme = (status) => {
    if (darkMode) {
      if (status === 'completed') return { label: t.completed, bg: 'rgba(46, 125, 50, 0.15)', text: '#81c784' };
      if (status === 'picking') return { label: t.picking, bg: 'rgba(21, 101, 192, 0.15)', text: '#64b5f6' };
      return { label: t.pending, bg: 'rgba(183, 129, 3, 0.15)', text: '#ffd54f' };
    } else {
      if (status === 'completed') return { label: t.completed, bg: '#e8f5e9', text: COLORS.primary };
      if (status === 'picking') return { label: t.picking, bg: '#e3f2fd', text: '#1565c0' };
      return { label: t.pending, bg: '#ffeebf', text: '#b78103' };
    }
  };

  const renderItem = ({ item }) => {
    const st = getStatusTheme(item.status);
    const productName = item.orderDetail?.product?.name || (language === 'vi' ? 'Sản phẩm không xác định' : 'Unknown Product');
    const branchName = item.orderDetail?.order?.branch?.name || (language === 'vi' ? 'Chi nhánh Kingfood' : 'Kingfood Branch');
    const orderId = item.orderDetail?.orderId || '';
    const locName = item.location?.name ? cleanLocationName(item.location.name) : t.unassignedZone;
    const progressText = `${item.quantityPicked}/${item.quantityToPick}`;
    const timeStr = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <TouchableOpacity 
        style={[styles.taskCard, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]} 
        onPress={() => handleTaskPress(item)}
        activeOpacity={0.85}
      >
        {/* Header row: task ID + status */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.taskId, { color: activeTextColor }]} numberOfLines={1}>
              #{item.id} <Text style={[styles.orderLabel, { color: activeTextGrayColor }]}>· {t.orderText} #{orderId}</Text>
            </Text>
          </View>
          <View style={[styles.statusTag, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
          </View>
        </View>

        {/* Product name */}
        <Text style={[styles.productName, { color: activeTextColor }]} numberOfLines={2}>{productName}</Text>
        <Text style={[styles.branchName, { color: activeTextGrayColor }]} numberOfLines={1}>{branchName}</Text>

        {/* Footer: clean tag chips in a wrapping row */}
        <View style={[styles.cardFooter, { borderTopColor: activeBorderColor }]}>
          <View style={[styles.chipTag, { backgroundColor: activeTabBg }]}>
            <Ionicons name="location-outline" size={12} color={activeTextGrayColor} />
            <Text style={[styles.chipText, { color: activeTextColor }]} numberOfLines={1}>{locName}</Text>
          </View>
          <View style={[styles.chipTag, { backgroundColor: darkMode ? 'rgba(46, 125, 50, 0.15)' : '#e8f5e9' }]}>
            <Ionicons name="cube-outline" size={12} color={COLORS.primary} />
            <Text style={[styles.chipText, { color: COLORS.primary, fontWeight: '700' }]}>{progressText} {t.sp}</Text>
          </View>
          {timeStr ? (
            <View style={[styles.chipTag, { backgroundColor: activeTabBg }]}>
              <Ionicons name="time-outline" size={12} color={activeTextGrayColor} />
              <Text style={[styles.chipText, { color: activeTextColor }]}>{timeStr}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: activeHeaderBg, borderBottomColor: activeBorderColor }]}>
        <Text style={[styles.headerTitle, { color: activeTextColor }]}>{t.headerTitle}</Text>
        <Text style={styles.count}>{filtered.length}</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: activeInputBg }]}>
        <TextInput
          style={[styles.searchInput, { color: activeInputText }]}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={darkMode ? '#64748b' : '#aaa'}
          value={query}
          onChangeText={setQuery}
          autoFocus={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filters */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab, 
                { backgroundColor: activeTabBg, borderColor: activeTabBorder },
                isActive && styles.filterTabActive
              ]}
              onPress={() => setStatusFilter(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Task List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: activeTextGrayColor }]}>{t.emptyTasks}</Text>
          </View>
        }
      />

      <StaffBottomNav active="search" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  count: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9',
    marginHorizontal: 16, marginTop: 12, borderRadius: 12,
    paddingHorizontal: 14, height: 48,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  clearBtn: { fontSize: 16, color: '#94a3b8', paddingHorizontal: 4 },
  
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  
  list: { padding: 16, paddingBottom: 100 },
  taskCard: {
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  taskId: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  orderLabel: { fontWeight: 'normal', color: '#64748b', fontSize: 12 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  
  productName: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4, lineHeight: 20 },
  branchName: { fontSize: 12, color: '#64748b', marginBottom: 12, fontWeight: '500' },
  
  cardFooter: {
    flexDirection: 'row', flexWrap: 'wrap',
    borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10,
    gap: 6,
  },
  chipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  chipProgress: {
    backgroundColor: '#e8f5e9',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  separator: { height: 12 },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center', fontWeight: '500' },
});
