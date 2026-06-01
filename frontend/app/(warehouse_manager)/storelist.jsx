import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Alert } from '../../utils/appAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { getCustomers, getOrders, getCachedData } from '../../constants/services/api';
import ManagerBottomNav from '../../components/ManagerBottomNav';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

const filterTabs = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'delivered', label: 'Hoàn thành' },
];

export default function StoreListScreen() {
  const cachedStores = getCachedData('/admin/customers?page=1&limit=200');
  const cachedOrders = getCachedData('/admin/orders');

  const { darkMode } = useAppPreferences();

  const activeBg = darkMode ? '#121212' : '#f0f4f1';
  const activeHeaderBg = darkMode ? '#1e1e1e' : '#fff';
  const activeBorderColor = darkMode ? '#2d2d2d' : '#eee';
  const activeTextColor = darkMode ? '#f3f4f6' : '#222';
  const activeCardBg = darkMode ? '#1e1e1e' : '#fff';
  const activeTextGrayColor = darkMode ? '#9ca3af' : '#666';

  const [stores, setStores] = useState(cachedStores?.data || cachedStores?.customers || cachedStores?.items || (Array.isArray(cachedStores) ? cachedStores : []));
  const [orders, setOrders] = useState(Array.isArray(cachedOrders) ? cachedOrders : (cachedOrders?.data || []));
  const [loading, setLoading] = useState(!cachedStores || !cachedOrders);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [storesRes, ordersRes] = await Promise.all([
        getCustomers(1, 200),
        getOrders()
      ]);
      
      const storeList = storesRes?.data ?? storesRes?.customers ?? storesRes?.items ?? (Array.isArray(storesRes) ? storesRes : []);
      const orderList = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data || []);
      
      setStores(storeList);
      setOrders(orderList);
    } catch (err) {
      console.log('Store list fetch error:', err.message);
      Alert.alert('Lỗi', `Không thể tải dữ liệu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getFilterCount = (filterType) => {
    if (filterType === 'all') return stores.length;
    
    // Count how many stores have at least one order matching the filterType status
    return stores.filter(s => 
      orders.some(o => 
        (String(o.customerId) === String(s.id) || String(o.branchId) === String(s.id)) && 
        o.status === filterType
      )
    ).length;
  };

  const getFilteredStores = () => {
    if (selectedFilter === 'all') return stores;
    
    return stores.filter(store => 
      orders.some(o => 
        (String(o.customerId) === String(store.id) || String(o.branchId) === String(store.id)) && 
        o.status === selectedFilter
      )
    );
  };

  const renderItem = ({ item }) => {
    // Count orders for this store matching the active selectedFilter
    const matchedOrders = orders.filter(o => 
      (String(o.customerId) === String(item.id) || String(o.branchId) === String(item.id)) &&
      (selectedFilter === 'all' || o.status === selectedFilter)
    );

    return (
      <TouchableOpacity
        style={[styles.storeItem, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]}
        onPress={() => router.push({ 
          pathname: '/storeorders', 
          params: { 
            customerId: item.id, 
            storeName: item.name,
            initialFilter: selectedFilter
          } 
        })}
      >
        <View style={[styles.storeIcon, { backgroundColor: darkMode ? '#2d2d2d' : '#e8f5e9' }]}>
          <Ionicons name="business-outline" size={22} color={COLORS.primary} />
        </View>
        <View style={styles.storeInfo}>
          <Text style={[styles.storeName, { color: activeTextColor }]}>{item.name}</Text>
          <Text style={[styles.storeEmail, { color: activeTextGrayColor }]}>{item.email}</Text>
          {matchedOrders.length > 0 && (
            <View style={styles.badgeRow}>
              <View style={[
                styles.statusBadge, 
                selectedFilter === 'pending' && { backgroundColor: darkMode ? '#7c2d12' : '#fff3e0' },
                selectedFilter === 'processing' && { backgroundColor: darkMode ? '#1e3a8a' : '#e3f2fd' },
                selectedFilter === 'delivered' && { backgroundColor: darkMode ? '#14532d' : '#e8f5e9' },
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  selectedFilter === 'pending' && { color: darkMode ? '#fb923c' : '#e65100' },
                  selectedFilter === 'processing' && { color: darkMode ? '#60a5fa' : '#1565c0' },
                  selectedFilter === 'delivered' && { color: darkMode ? '#4ade80' : '#2e7d32' },
                ]}>
                  {selectedFilter === 'all' 
                    ? `${matchedOrders.length} đơn hàng` 
                    : `${matchedOrders.length} đơn ${filterTabs.find(t => t.key === selectedFilter)?.label}`
                  }
                </Text>
              </View>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>
    );
  };

  const filteredStores = getFilteredStores();

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg }]}>
      <View style={[styles.header, { backgroundColor: activeHeaderBg, borderBottomColor: activeBorderColor }]}>
        <View style={{ width: 32 }} />
        <Text style={[styles.headerTitle, { color: activeTextColor }]}>Danh sách cửa hàng</Text>
        <Text style={[styles.count, { color: activeTextColor, width: 32, textAlign: 'right' }]}>{filteredStores.length}</Text>
      </View>

      {/* Filter Row */}
      <View style={[styles.filterRow, { backgroundColor: activeHeaderBg, borderBottomColor: activeBorderColor }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterTabs}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const count = getFilterCount(item.key);
            const isActive = selectedFilter === item.key;
            return (
              <TouchableOpacity
                style={[
                  styles.filterBtn, 
                  { backgroundColor: darkMode ? '#2d2d2d' : '#f5f5f5', borderColor: darkMode ? '#3d3d3d' : '#e0e0e0' },
                  isActive && styles.filterActive
                ]}
                onPress={() => setSelectedFilter(item.key)}
              >
                <Text style={[styles.filterText, { color: darkMode ? '#cbd5e1' : '#666' }, isActive && styles.filterTextActive]}>
                  {item.label} {count > 0 ? `(${count})` : '(0)'}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={filteredStores}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: activeBorderColor }]} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: activeTextGrayColor }]}>Không có cửa hàng nào có đơn hàng phù hợp</Text>
          </View>
        }
      />
      
      {/* Bottom Nav */}
      <ManagerBottomNav active="storelist" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f1',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  filterRow: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  filterList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 12,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  storeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  storeEmail: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
  },
  separator: {
    height: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
  },
});
