import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Alert } from '../../utils/appAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { getOrders, updateOrderStatus, deleteOrder, getUsers, assignPickingTask } from '../../constants/services/api';
import { Ionicons } from '@expo/vector-icons';
import { playSound } from '../../utils/soundService';

const statusConfig = {
  pending: { label: 'Chờ duyệt', color: '#fff3e0', textColor: '#e65100' },
  processing: { label: 'Đang xử lý', color: '#e3f2fd', textColor: '#1565c0' },
  shipped: { label: 'Đã giao', color: '#e8f5e9', textColor: '#2e7d32' },
  delivered: { label: 'Hoàn thành', color: '#e8f5e9', textColor: COLORS.primary },
  cancelled: { label: 'Đã hủy', color: '#ffebee', textColor: '#c62828' },
};

const filters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'delivered', label: 'Hoàn thành' },
];

export default function StoreOrdersScreen() {
  const { customerId, storeName, initialFilter } = useLocalSearchParams();
  const [orders, setOrders] = useState([]);
  const [branchName, setBranchName] = useState(storeName || 'Cửa hàng');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter || 'all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Task assignment states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [assignQuantities, setAssignQuantities] = useState({}); // mapping: productId -> quantity
  const [selectedProducts, setSelectedProducts] = useState({}); // mapping: productId -> boolean
  const [assigning, setAssigning] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      const res = await getUsers();
      const allUsers = Array.isArray(res) ? res : (res?.data || []);
      // Filter for staff role only
      const staffOnly = allUsers.filter(u => u.role === 'staff');
      // Sort staff: 1. Free first (activePickingTasksCount === 0), 2. Workload ascending
      const sortedStaff = [...staffOnly].sort((a, b) => {
        const aTasks = a.activePickingTasksCount || 0;
        const bTasks = b.activePickingTasksCount || 0;
        return aTasks - bTasks;
      });
      setStaffList(sortedStaff);
      if (sortedStaff.length > 0) {
        setSelectedStaff(sortedStaff[0].id || sortedStaff[0]._id);
      }
    } catch (err) {
      console.log('Error fetching staff:', err.message);
    } finally {
      setLoadingStaff(false);
    }
  };

  const openAssignModal = (order) => {
    const initialQtys = {};
    const initialSelected = {};
    order.orderDetails?.forEach(detail => {
      if (detail.product) {
        initialQtys[detail.product.id] = detail.quantity;
        initialSelected[detail.product.id] = true;
      }
    });
    setAssignQuantities(initialQtys);
    setSelectedProducts(initialSelected);
    setSelectedOrder(order);
    setShowAssignModal(true);
    fetchStaff();
  };

  const handleAssignTask = async () => {
    if (!selectedStaff) {
      Alert.alert('Lỗi', 'Vui lòng chọn nhân viên để giao việc');
      return;
    }

    const tasksToSubmit = [];
    selectedOrder.orderDetails?.forEach(detail => {
      const pId = detail.product?.id;
      if (pId && selectedProducts[pId]) {
        const qty = assignQuantities[pId] || detail.quantity;
        tasksToSubmit.push({
          productId: pId,
          staffId: selectedStaff,
          quantity: qty
        });
      }
    });

    if (tasksToSubmit.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một sản phẩm để giao việc');
      return;
    }

    setAssigning(true);
    try {
      await assignPickingTask({
        orderId: selectedOrder.id || selectedOrder._id,
        tasks: tasksToSubmit
      });
      playSound('success');
      Alert.alert('Thành công', 'Đã phân công và giao nhiệm vụ soạn hàng thành công!');
      setShowAssignModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể giao việc');
    } finally {
      setAssigning(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await getOrders();
      const allOrders = Array.isArray(res) ? res : (res.data || []);
      const filtered = allOrders.filter(o =>
        String(o.customerId) === String(customerId) || String(o.branchId) === String(customerId)
      );
      if (filtered.length > 0 && filtered[0].branch?.name) {
        setBranchName(filtered[0].branch.name);
      }
      setOrders(filtered);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const confirmStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      setOrders(prev => prev.map(o => (o.id || o._id) === id ? { ...o, status } : o));
      if (status === 'processing') {
        playSound('success'); // Play premium success chime
      } else if (status === 'cancelled') {
        playSound('error'); // Play distinct alert sound for rejection
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const handleConfirm = async (orderId) => {
    await confirmStatus(orderId, 'processing');
    setSelectedOrder(null);
    Alert.alert('Thành công', `Đơn hàng #${orderId} đã được DUYỆT THÀNH CÔNG!`);
  };

  const handleReject = async (orderId) => {
    await confirmStatus(orderId, 'cancelled');
    setSelectedOrder(null);
    Alert.alert('Đã từ chối', `Đơn hàng #${orderId} đã bị TỪ CHỐI duyệt!`);
  };

  const handleDelete = (order) => {
    Alert.alert(
      'Xoá đơn hàng',
      `Xoá đơn #${order.id || order._id}?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Xoá', style: 'destructive', onPress: async () => {
          try {
            await deleteOrder(order.id || order._id);
            setOrders(prev => prev.filter(o => (o.id || o._id) !== (order.id || order._id)));
          } catch {
            Alert.alert('Lỗi', 'Không thể xoá đơn hàng');
          }
        }},
      ]
    );
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  const renderItem = ({ item }) => {
    const st = statusConfig[item.status] || { label: item.status, color: '#f5f5f5', textColor: '#888' };
    return (
      <TouchableOpacity 
        style={styles.orderCard} 
        onPress={() => setSelectedOrder(item)} 
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.orderHead}>
          <Text style={styles.orderId}>#{item.id || item._id}</Text>
          <View style={[styles.statusTag, { backgroundColor: st.color }]}>
            <Text style={[styles.statusText, { color: st.textColor }]}>{st.label}</Text>
          </View>
        </View>
        
        {/* Render a premium preview of items in the card */}
        <Text style={styles.orderItemCount}>
          {item.orderDetails?.length || 0} sản phẩm · Nhấn để xem chi tiết
        </Text>

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

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  // Find the label for active filter status config
  const selectedOrderSt = selectedOrder 
    ? (statusConfig[selectedOrder.status] || { label: selectedOrder.status, color: '#f5f5f5', textColor: '#888' })
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} style={{ marginRight: 8 }} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Đơn hàng</Text>
          <Text style={styles.headerSub}>{branchName}</Text>
        </View>
        <Text style={styles.count}>{filteredOrders.length}</Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map(f => (
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

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => String(item.id || item._id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
          </View>
        }
      />

      {/* Premium Order Details Bottom-Sheet Modal */}
      {selectedOrder && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedOrder}
          onRequestClose={() => setSelectedOrder(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Đơn hàng #{selectedOrder.id || selectedOrder._id}</Text>
                  <Text style={styles.modalSub}>{branchName}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.closeBtn}>
                  <Ionicons name="close-circle" size={28} color="#aaa" />
                </TouchableOpacity>
              </View>

              {/* Modal Body / Product List */}
              <ScrollView style={styles.modalBody}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Danh sách sản phẩm</Text>
                  <View style={[styles.statusTag, { backgroundColor: selectedOrderSt.color }]}>
                    <Text style={[styles.statusText, { color: selectedOrderSt.textColor }]}>
                      {selectedOrderSt.label}
                    </Text>
                  </View>
                </View>

                {selectedOrder.orderDetails && selectedOrder.orderDetails.length > 0 ? (
                  selectedOrder.orderDetails.map((detail, idx) => {
                    const p = detail.product || {};
                    return (
                      <View key={idx} style={styles.productRow}>
                        <View style={styles.productIcon}>
                          <Ionicons name="nutrition" size={20} color={COLORS.primary} />
                        </View>
                        <View style={styles.productInfo}>
                          <Text style={styles.productName}>{p.name || 'Sản phẩm'}</Text>
                          <Text style={styles.productPrice}>
                            Đơn giá: {p.price ? p.price.toLocaleString() : '0'}đ
                          </Text>
                        </View>
                        <View style={styles.productQtyCol}>
                          <Text style={styles.productQty}>x{detail.quantity}</Text>
                          <Text style={styles.productSubtotal}>
                            {((p.price || 0) * (detail.quantity || 0)).toLocaleString()}đ
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyProducts}>Không có thông tin chi tiết sản phẩm</Text>
                )}

                {/* Additional Info Block */}
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ngày đặt hàng</Text>
                    <Text style={styles.detailVal}>
                      {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('vi-VN') : ''}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Địa chỉ giao hàng</Text>
                    <Text style={styles.detailVal}>{selectedOrder.address || branchName}</Text>
                  </View>
                </View>
              </ScrollView>

              {/* Modal Footer / Actions */}
              <View style={styles.modalFooter}>
                <View style={styles.priceSummary}>
                  <Text style={styles.priceLabel}>Tổng tiền đơn hàng</Text>
                  <Text style={styles.priceVal}>
                    {selectedOrder.totalPrice ? selectedOrder.totalPrice.toLocaleString() : '0'}đ
                  </Text>
                </View>

                {selectedOrder.status === 'pending' ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.btnReject]} 
                      onPress={() => handleReject(selectedOrder.id || selectedOrder._id)}
                    >
                      <Ionicons name="close-circle-outline" size={20} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={styles.btnText}>Từ chối</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.btnConfirm]} 
                      onPress={() => handleConfirm(selectedOrder.id || selectedOrder._id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={styles.btnText}>Xác nhận duyệt</Text>
                    </TouchableOpacity>
                  </View>
                ) : selectedOrder.status === 'processing' ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.btnGoToTask, { flex: 1 }]} 
                      onPress={() => {
                        setSelectedOrder(null);
                        router.push({ pathname: '/(worker)/productlist', params: { taskId: selectedOrder.id || selectedOrder._id } });
                      }}
                    >
                      <Ionicons name="eye-outline" size={18} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={styles.btnText}>Xem soạn</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { flex: 1.5, backgroundColor: COLORS.primary }]} 
                      onPress={() => {
                        openAssignModal(selectedOrder);
                      }}
                    >
                      <Ionicons name="people-outline" size={18} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={styles.btnText}>Giao việc nhân viên</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.btnCloseFooter, { width: '100%' }]} 
                    onPress={() => setSelectedOrder(null)}
                  >
                    <Text style={styles.btnText}>Đóng</Text>
                  </TouchableOpacity>
                )}
              </View>

            </View>
          </View>
        </Modal>
      )}

      {/* Modal Phân Chia & Giao Việc Cho Nhân Viên */}
      {showAssignModal && selectedOrder && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAssignModal}
          onRequestClose={() => setShowAssignModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { height: '85%' }]}>
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Giao việc · Đơn #{selectedOrder.id || selectedOrder._id}</Text>
                  <Text style={styles.modalSub}>{branchName}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAssignModal(false)} style={styles.closeBtn}>
                  <Ionicons name="close-circle" size={28} color="#aaa" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* 1. CHỌN NHÂN VIÊN */}
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>1. Chọn nhân viên soạn hàng:</Text>
                {loadingStaff ? (
                  <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: 12 }} />
                ) : staffList.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {staffList.map(staff => {
                      const isSelected = selectedStaff === staff.id;
                      const activeTasks = staff.activePickingTasksCount || 0;
                      const isFree = activeTasks === 0;
                      
                      return (
                        <TouchableOpacity
                          key={staff.id}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 10,
                            borderWidth: 1.5,
                            borderColor: isSelected ? COLORS.primary : '#eee',
                            backgroundColor: isSelected ? COLORS.warningBg : '#fff',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6
                          }}
                          onPress={() => setSelectedStaff(staff.id)}
                        >
                          <Ionicons name="person" size={14} color={isSelected ? COLORS.primary : '#888'} />
                          <Text style={{ fontSize: 13, fontWeight: isSelected ? '700' : '500', color: isSelected ? COLORS.primary : '#444' }}>
                            {staff.name || staff.username}
                          </Text>
                          
                          {/* Availability Tag */}
                          <Text style={{ 
                            fontSize: 10, 
                            fontWeight: '700', 
                            color: isFree ? COLORS.success : COLORS.error, 
                            backgroundColor: isFree ? COLORS.successBg : COLORS.errorBg, 
                            paddingHorizontal: 5, 
                            borderRadius: 4,
                            paddingVertical: 2
                          }}>
                            {isFree ? '🟢 Rảnh' : `🔴 Bận (${activeTasks})`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={{ color: '#888', fontStyle: 'italic', marginBottom: 20 }}>Không tìm thấy nhân viên nào trong hệ thống</Text>
                )}

                {/* 2. CHỌN SẢN PHẨM & SỐ LƯỢNG */}
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>2. Chọn sản phẩm & Số lượng giao:</Text>
                {selectedOrder.orderDetails?.map((detail, idx) => {
                  const p = detail.product;
                  if (!p) return null;
                  const isChecked = selectedProducts[p.id] ?? false;
                  const qty = assignQuantities[p.id] ?? detail.quantity;

                  return (
                    <View key={idx} style={[styles.productRow, { opacity: isChecked ? 1 : 0.5, paddingVertical: 10 }]}>
                      {/* Checkbox toggle */}
                      <TouchableOpacity
                        onPress={() => setSelectedProducts(prev => ({ ...prev, [p.id]: !isChecked }))}
                        style={{ padding: 4 }}
                      >
                        <Ionicons
                          name={isChecked ? "checkbox" : "square-outline"}
                          size={22}
                          color={isChecked ? COLORS.primary : '#aaa'}
                        />
                      </TouchableOpacity>

                      <View style={{ flex: 1, marginLeft: 4 }}>
                        <Text style={[styles.productName, { fontSize: 13 }]}>{p.name}</Text>
                        <Text style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Cần soạn: {detail.quantity} {p.unit || 'cái'}</Text>
                      </View>

                      {/* Quantity Selector */}
                      {isChecked && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <TouchableOpacity
                            onPress={() => setAssignQuantities(prev => ({ ...prev, [p.id]: Math.max(1, qty - 1) }))}
                            style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Text style={{ fontWeight: '700', fontSize: 16 }}>−</Text>
                          </TouchableOpacity>
                          <Text style={{ fontSize: 14, fontWeight: '700', minWidth: 20, textAlign: 'center' }}>{qty}</Text>
                          <TouchableOpacity
                            onPress={() => setAssignQuantities(prev => ({ ...prev, [p.id]: Math.min(detail.quantity, qty + 1) }))}
                            style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Text style={{ fontWeight: '700', fontSize: 16 }}>+</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: COLORS.primary,
                      width: '100%',
                      opacity: assigning ? 0.7 : 1
                    }
                  ]}
                  onPress={handleAssignTask}
                  disabled={assigning}
                >
                  {assigning ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done" size={20} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.btnText}>Xác nhận giao việc</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f1' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { fontSize: 28, color: COLORS.primary, marginRight: 12 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerSub: { fontSize: 15, fontWeight: '800', color: '#111', marginTop: 2 },
  count: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  filterRow: {
    flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f5f5f5',
  },
  filterActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16 },
  orderCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  orderHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  orderId: { fontSize: 14, fontWeight: '700', color: '#222' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderItemCount: { fontSize: 12, color: '#666', marginBottom: 12 },
  orderFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 0.5, borderTopColor: '#eee', paddingTop: 8,
  },
  orderTotal: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  orderDate: { fontSize: 11, color: '#aaa' },
  separator: { height: 8 },
  emptyText: { fontSize: 14, color: '#888' },

  // Premium Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
  },
  modalSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  productIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
  },
  productPrice: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  productQtyCol: {
    alignItems: 'flex-end',
  },
  productQty: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444',
  },
  productSubtotal: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  emptyProducts: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
  detailCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    padding: 14,
    marginVertical: 20,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: '#777',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    maxWidth: '65%',
    textAlign: 'right',
  },

  // Modal Footer Styles
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  priceVal: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnReject: {
    backgroundColor: '#f44336',
  },
  btnConfirm: {
    backgroundColor: '#4caf50',
  },
  btnGoToTask: {
    backgroundColor: COLORS.primary,
  },
  btnCloseFooter: {
    backgroundColor: '#888',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
