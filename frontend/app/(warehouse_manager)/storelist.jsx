import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { getCustomers } from '../../constants/services/api';

export default function StoreListScreen() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await getCustomers(1, 200);
      console.log('🏪 Store list response:', JSON.stringify(res, null, 2));
      const list = res?.data ?? res?.customers ?? res?.items ?? (Array.isArray(res) ? res : []);
      setStores(list);
    } catch (err) {
      console.log('🏪 Store list error:', err.message);
      Alert.alert('Lỗi', `Không thể tải: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.storeItem}
      onPress={() => router.push({ pathname: '/storeorders', params: { customerId: item.id, storeName: item.name } })}
    >
      <View style={styles.storeIcon}>
        <Text style={styles.storeIconText}>🏪</Text>
      </View>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{item.name}</Text>
        <Text style={styles.storeEmail}>{item.email}</Text>
        {item.phone && <Text style={styles.storePhone}>{item.phone}</Text>}
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách cửa hàng</Text>
        <Text style={styles.count}>{stores.length}</Text>
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Không có cửa hàng nào</Text>
          </View>
        }
      />
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
  backBtn: {
    fontSize: 28,
    color: COLORS.primary,
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
  storeIconText: {
    fontSize: 22,
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
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  storePhone: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  arrow: {
    fontSize: 22,
    color: '#ccc',
  },
  separator: {
    height: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
  },
});
