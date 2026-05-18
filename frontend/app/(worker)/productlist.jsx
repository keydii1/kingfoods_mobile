import { useState, useEffect, useCallback } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {getAssignedTasks} from '../../constants/services/api'
import { COLORS } from '../../constants/colors';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import StaffBottomNav from '../../components/StaffBottomNav';

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
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const { userRole } = useAuth();

  const [taskInfo, setTaskInfo] = useState(null);
  useFocusEffect(useCallback(() => {
    async function fetchItem() {
      try{
        setLoading(true);
        const res = await getAssignedTasks();
        console.log('productlist: getAssignedTasks response', JSON.stringify(res, null, 2));
        const arr = Array.isArray(res) ? res : [];
        console.log(`productlist: looking for taskId=${taskId}, type=${typeof taskId}`);
        console.log(`productlist: available task IDs:`, arr.map(t => ({ id: t.id, type: typeof t.id })));
        const task = arr.find(t => String(t.id) === String(taskId));
        console.log('productlist: found task?', !!task);
        console.log('productlist: found task data', JSON.stringify(task, null, 2));
        if(task){
          const orderId = task.orderDetail?.order?.id;
          // find all tasks belonging to the same order
          const orderTasks = orderId
            ? arr.filter(t => t.orderDetail?.order?.id === orderId)
            : [task];
          setTaskInfo(task);
          setProducts(orderTasks.map(t => {
            const prod = t.orderDetail?.product;
            const remaining = (t.quantityToPick ?? 1) - (t.quantityPicked ?? 0);
            return {
              taskId: t.id,
              location: t.location?.name || '',
              name: prod?.name || 'Unknown',
              sku: String(prod?.id ?? t.id),
              qty: Math.max(0, remaining),
              unit: 'cái',
              done: t.status === 'completed' || remaining <= 0,
            };
          }));
        } else {
          // fallback: show hardcoded mock data để user thấy gì đó
          setProducts(initialProducts);
        }
      }
      catch(err){
        console.log('productlist: fetch error', err.message);
        setProducts(initialProducts);
      }
      finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [taskId]));

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
    return (
      <TouchableOpacity onPress={() => !item.done && startPicking(item, index)} disabled={item.done}>
        <View style={[styles.itemRow, item.done && styles.itemDone]}>
          <View style={styles.locationBox}>
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSKU}>{item.sku}</Text>
          </View>
          <View style={styles.itemQty}>
            <Text style={styles.qtyValue}>{item.done ? '✓' : item.qty}</Text>
            <Text style={styles.qtyUnit}>{item.unit}</Text>
          </View>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() =>
              router.push({
                pathname: '/(worker)/missingitem',
                params: { itemId: item.taskId },
              })
            }
          >
            <Text style={styles.reportBtnText}>Báo thiếu</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
        <Text style={styles.zoneIcon}>🍬</Text>
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
        {loading ? (
            <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : products.length === 0 ? (
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
      />
        )}
      </View>
      {/* Confirm Order Button — luôn hiển thị dưới cùng */}
      <View style={styles.confirmBar}>
        {allDone ? (
          <>
            <Text style={styles.confirmText}>✅ Đã hoàn thành tất cả sản phẩm</Text>
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmOrder}>
              <Text style={styles.confirmBtnText}>Xác nhận hoàn thành đơn hàng</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.confirmText}>⏳ Còn {remaining} sản phẩm chưa lấy</Text>
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
