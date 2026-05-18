import { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { getOrders } from '../../constants/services/api';
import StaffBottomNav from '../../components/StaffBottomNav';

const statusConfig = {
  pending: { label: 'Chờ duyệt', color: '#fff3e0', textColor: '#e65100' },
  processing: { label: 'Đang xử lý', color: '#e3f2fd', textColor: '#1565c0' },
  shipped: { label: 'Đã giao', color: '#e8f5e9', textColor: '#2e7d32' },
  delivered: { label: 'Hoàn thành', color: '#e8f5e9', textColor: COLORS.primary },
  cancelled: { label: 'Đã hủy', color: '#ffebee', textColor: '#c62828' },
};

export default function OrderSearchScreen() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await getOrders();
      setOrders(Array.isArray(res) ? res : []);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const filtered = query.trim()
    ? orders.filter(o => {
        const id = String(o.id);
        const branchName = (o.branch?.name || '').toLowerCase();
        const q = query.toLowerCase();
        return id.includes(q) || branchName.includes(q);
      })
    : orders;

  const renderItem = ({ item }) => {
    const st = statusConfig[item.status] || { label: item.status, color: '#f5f5f5', textColor: '#888' };
    return (
      <TouchableOpacity style={styles.orderCard}>
        <View style={styles.orderHead}>
          <Text style={styles.orderId}>#{item.id}</Text>
          <View style={[styles.statusTag, { backgroundColor: st.color }]}>
            <Text style={[styles.statusText, { color: st.textColor }]}>{st.label}</Text>
          </View>
        </View>
        <Text style={styles.branchName}>{item.branch?.name || 'Không có tên cửa hàng'}</Text>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tìm kiếm đơn hàng</Text>
        <Text style={styles.count}>{filtered.length}</Text>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo mã đơn hoặc tên cửa hàng"
          placeholderTextColor="#aaa"
          value={query}
          onChangeText={setQuery}
          autoFocus={true}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Không tìm thấy đơn hàng</Text>
            </View>
          }
        />
      )}

      <StaffBottomNav active="search" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  count: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6',
    marginHorizontal: 16, marginTop: 14, borderRadius: 14,
    paddingHorizontal: 12, height: 52,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.text },
  clearBtn: { fontSize: 18, color: '#888', paddingHorizontal: 4 },
  list: { padding: 16, paddingBottom: 80 },
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
  branchName: { fontSize: 12, color: '#888', marginBottom: 8 },
  orderFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 0.5, borderTopColor: '#eee', paddingTop: 8,
  },
  orderTotal: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  orderDate: { fontSize: 11, color: '#aaa' },
  separator: { height: 8 },
  emptyText: { fontSize: 14, color: '#888' },
});
