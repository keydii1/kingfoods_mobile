import { useState, useEffect, useCallback } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {getAssignedTasks} from '../../constants/services/api'
import { COLORS } from '../../constants/colors';
import { router, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import StaffBottomNav from '../../components/StaffBottomNav';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from '../../utils/appAlert';

const getZoneMeta = (locationName) => {
  if (!locationName) return { icon: 'cube-outline', label: 'Kho sỉ', color: COLORS.primary, bg: '#e8f5e9' };
  // Remove emojis and get clear name
  const name = locationName.replace(/[^\w\s\dÀ-ỹ]/g, '').trim();
  if (locationName.includes('tươi') || locationName.includes('fresh') || locationName.includes('1')) {
    return { icon: 'leaf-outline', label: 'Thực phẩm tươi', color: '#2e7d32', bg: '#e8f5e9' };
  }
  if (locationName.includes('khô') || locationName.includes('dry') || locationName.includes('2')) {
    return { icon: 'fast-food-outline', label: 'Đồ khô & Gia vị', color: '#ef6c00', bg: '#fff3e0' };
  }
  if (locationName.includes('mỹ') || locationName.includes('chemical') || locationName.includes('3')) {
    return { icon: 'color-palette-outline', label: 'Hoá mỹ phẩm', color: '#00838f', bg: '#e0f7fa' };
  }
  if (locationName.includes('lạnh') || locationName.includes('frozen') || locationName.includes('4')) {
    return { icon: 'snow-outline', label: 'Đồ đông lạnh', color: '#1565c0', bg: '#e3f2fd' };
  }
  return { icon: 'cube-outline', label: name || 'Khu vực kệ', color: COLORS.primary, bg: '#e8f5e9' };
};

const initialProducts = [
  { id: 1, location: '26.10.15', name: 'Bánh Quy Hải Hà 200g', sku: 'KF-00123', qty: 5, unit: 'Hộp', done: true },
  { id: 2, location: '14.07.B', name: 'Nước tương chinsu 500ml', sku: 'KF-00456', qty: 3, unit: 'Chai', done: false },
  { id: 3, location: '17.02.A', name: 'Mì gói hảo hảo tôm 75g', sku: 'KF-00789', qty: 20, unit: 'Gói', done: false },
  { id: 4, location: '22.08.A', name: 'Snack Oshi Tôm 68g', sku: 'KF-01024', qty: 12, unit: 'Gói', done: false },
  { id: 5, location: '09.03.C', name: 'Dầu ăn Neptune 1L', sku: 'KF-01100', qty: 6, unit: 'Chai', done: false },
];

export default function productListScreen() {
  const params = useLocalSearchParams();
  const taskId = params.taskId;
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const { userRole } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const [taskInfo, setTaskInfo] = useState(null);

  const loadItems = useCallback(async (silent = false) => {
    try{
      if (!silent) setLoading(true);
      const res = await getAssignedTasks();
      const arr = Array.isArray(res) ? res : [];
      const task = arr.find(t => String(t.id) === String(taskId));
      if(task){
        const orderId = task.orderDetail?.order?.id;
        const orderTasks = orderId
          ? arr.filter(t => t.orderDetail?.order?.id === orderId)
          : [task];
        setTaskInfo(task);
        const newProducts = orderTasks.map(t => {
          const prod = t.orderDetail?.product;
          const remaining = (t.quantityToPick ?? 1) - (t.quantityPicked ?? 0);
          const loc = t.location;
          const catLoc = t.orderDetail?.product?.category?.location;
          return {
            taskId: t.id,
            location: loc?.name || catLoc?.name || '',
            locationCode: loc?.code || catLoc?.code || '',
            name: prod?.name || 'Unknown',
            sku: String(prod?.id ?? t.id),
            qty: Math.max(0, remaining),
            unit: 'cái',
            done: t.status === 'completed' || remaining <= 0,
          };
        });
        // Only update state if data actually changed (avoid unnecessary re-renders)
        setProducts(prev => {
          const hasChanged = prev.length !== newProducts.length ||
            newProducts.some((np, i) => np.taskId !== prev[i]?.taskId || np.done !== prev[i]?.done || np.qty !== prev[i]?.qty);
          return hasChanged ? newProducts : prev;
        });
      } else {
        if (!silent) setProducts(initialProducts);
      }
    }
    catch(err){
      if (!silent) setProducts(initialProducts);
    }
    finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadItems();
    const unsub = navigation.addListener('focus', () => loadItems(true));
    return unsub;
  }, [navigation, loadItems]);

  const doneCount = products.filter(p => p.done).length;
  const remaining = products.length - doneCount;
  const allDone = products.every(p => p.done);

  const startPicking = (item, index) => {
    router.push({
      pathname: '/(worker)/pickingflow',
      params: {
        tasksJson: JSON.stringify(products),
        startIndex: String(index),
      },
    });
  };

  const confirmOrder = () => {
    Alert.alert(
      'Xác nhận hoàn thành',
      'Bạn đã hoàn thành tất cả sản phẩm. Xác nhận kết thúc đơn hàng?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Hoàn thành',
          onPress: () => {
            const dest = userRole === 'admin' ? '/managerdashboard' : '/dashboard';
            router.replace(dest);
          },
        },
      ]
    );
  };

  function renderItem({ item, index }) {
    const isDone = item.done;
    const meta = getZoneMeta(item.location);

    return (
      <TouchableOpacity 
        onPress={() => !isDone && startPicking(item, index)} 
        disabled={isDone}
        activeOpacity={0.7}
        style={{ marginBottom: 10 }}
      >
        <View style={[
          styles.itemRow, 
          isDone && styles.itemDone,
          { 
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: isDone ? '#e2e8f0' : '#f1f5f9'
          }
        ]}>
          {/* 1. Left Icon Container: Zone category indicator */}
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: meta.bg || '#f1f5f9',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12
          }}>
            <Ionicons name={meta.icon} size={24} color={meta.color} />
          </View>

          {/* 2. Middle Content: Product name, SKU, and Clean Zone Label */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text 
              style={{ 
                fontSize: 14, 
                fontWeight: '700', 
                color: isDone ? '#94a3b8' : '#1e293b',
                lineHeight: 18 
              }} 
              numberOfLines={2}
            >
              {item.name}
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 6 }}>
              {/* SKU label */}
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                SKU: {item.sku}
              </Text>
              
              {/* Zone label */}
              <Text style={{ fontSize: 11, fontWeight: '700', color: meta.color, backgroundColor: meta.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                {meta.label}
              </Text>
            </View>
          </View>

          {/* 3. Right Content: Qty and Report Button */}
          <View style={{ alignItems: 'flex-end', justifyContent: 'center', minWidth: 85 }}>
            {/* Qty value */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 }}>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '900', 
                color: isDone ? '#94a3b8' : COLORS.primary 
              }}>
                {isDone ? '✓' : item.qty}
              </Text>
              {!isDone && (
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b', marginLeft: 2 }}>
                  {item.unit || 'cái'}
                </Text>
              )}
            </View>

            {/* Báo thiếu button */}
            {!isDone && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#fff5f5',
                  borderWidth: 1.2,
                  borderColor: '#feb2b2',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
                onPress={() =>
                  router.push({
                    pathname: '/(worker)/missingitem',
                    params: { itemId: item.taskId },
                  })
                }
              >
                <Text style={{ color: '#c53030', fontSize: 11, fontWeight: '700' }}>Báo thiếu</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contentArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}> ‹ </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{taskInfo?.orderDetail?.order?.id ? `Đơn hàng #${taskInfo.orderDetail.order.id}` : `Đơn hàng #${taskId}`}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{remaining} Còn Lại</Text>
        </View>
      </View>

      {/* Zone Chip */}
      <View style={styles.zoneChip}>
        <View style={styles.zoneInfo}>
          <Text style={styles.zoneName}>Khu vực Bánh & Kẹo</Text>
          <Text style={styles.zoneSub}>12 sản phẩm thuộc khu vực của bạn</Text>
        </View>
        <View style={styles.zoneProgress}>
          <Text style={styles.zoneProgressVal}>{doneCount}/{products.length}</Text>
          <Text style={styles.zoneProgressLbl}>Đã lấy</Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        {products.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
                Không có sản phẩm nào
            </Text>
        ) : (
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.taskId ?? item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        style={{ flex: 1 }}
        refreshing={refreshing}
        onRefresh={loadItems}
      />
        )}
      </View>
      {/* Confirm Order Button — luôn hiển thị dưới cùng */}
      <View style={styles.confirmBar}>
        {allDone ? (
          <>
            <Text style={styles.confirmText}>Đã hoàn thành tất cả sản phẩm</Text>
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmOrder}>
              <Text style={styles.confirmBtnText}>Xác nhận hoàn thành đơn hàng</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.confirmText}>Còn {remaining} sản phẩm chưa lấy</Text>
        )}
      </View>
      </View>
        <StaffBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f1' },
  contentArea: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { fontSize: 28, color: COLORS.primary, marginRight: 10 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#222' },
  badge: {
    backgroundColor: '#fff3e0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#e65100' },
  zoneChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    margin: 12, padding: 14, borderRadius: 16, gap: 12,
  },
  zoneIcon: { fontSize: 28 },
  zoneInfo: { flex: 1 },
  zoneName: { fontSize: 14, fontWeight: '700', color: '#222' },
  zoneSub: { fontSize: 12, color: '#888', marginTop: 2 },
  zoneProgress: { alignItems: 'center' },
  zoneProgressVal: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  zoneProgressLbl: { fontSize: 11, color: '#888' },
  list: { padding: 12, gap: 8 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 12, gap: 12, borderWidth: 1.5, borderColor: 'transparent',
  },
  itemDone: { opacity: 0.45 },
  locationBox: {
    backgroundColor: COLORS.primary, borderRadius: 10, padding: 8,
    alignItems: 'center', minWidth: 52,
  },
  locationText: { color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#222' },
  itemSku: { fontSize: 11, color: '#888', marginTop: 3 },
  itemQty: { alignItems: 'center' },
  qtyValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  qtyUnit: { fontSize: 11, color: '#888' },
  confirmBar: {
    padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', gap: 10,
  },
  confirmText: { fontSize: 14, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  confirmBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  reportBtn: {
    backgroundColor: '#e53935', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  reportBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
