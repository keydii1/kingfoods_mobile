import { View, Text, StyleSheet,
         ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getDashboardStatus, getIncidents, getOrders, getUsers, assignPickingTask } from '../../constants/services/api';
import { COLORS } from '../../constants/colors';
import { Alert } from '../../utils/appAlert';
import ManagerBottomNav from '../../components/ManagerBottomNav';

// 4 KPI cards initial config (Ionicons name)
const kpis = [
    { icon: 'checkmark-circle-outline', value: '1,284', label: 'SKU đã pick', color: COLORS.successBg, textColor: COLORS.primary },
    { icon: 'people-outline', value: '8/10',  label: 'NV đang làm', color: '#e3f2fd',        textColor: '#1565c0' },
    { icon: 'warning-outline', value: '5',     label: 'Báo thiếu',   color: COLORS.warningBg, textColor: '#e65100' },
    { icon: 'cube-outline', value: '3',     label: 'Đơn tồn',     color: '#f3e5f5',        textColor: '#7b1fa2' },
];

// Hoàn thành theo khu vực (Ionicons name)
const zones = [
    { icon: 'nutrition-outline', name: 'Bánh kẹo',  pct: 87, color: COLORS.primary },
    { icon: 'cafe-outline', name: 'Đồ uống',   pct: 95, color: COLORS.primary },
    { icon: 'flask-outline', name: 'Hóa phẩm',  pct: 64, color: COLORS.error   },
    { icon: 'gift-outline', name: 'KM',        pct: 78, color: '#1976d2'},
];

// Sản phẩm thiếu (Ionicons name)
const shortages = [
    { id: '1', icon: 'cube-outline',
      name: 'Nước tương Chinsu 500ml',
      loc: 'Kệ 14.07.B · Khu Bánh kẹo',
      who: 'mai · 15:28' },
    { id: '2', icon: 'fast-food-outline',
      name: 'Snack Oishi Tôm 68g',
      loc: 'Kệ 22.08.A · Khu Bánh kẹo',
      who: 'đức · 14:12' },
];

// component KPI card
function KpiCard ({item}){
    return (
        <View style = {[styles.kpiCard, {backgroundColor: item.color}]} >
            <Ionicons name={item.icon} size={28} color={item.textColor} />
            <Text style = {[styles.kpiValue, {color: item.textColor}]}>{item.value}</Text>
            <Text style = {styles.kpiLabel}>{item.label}</Text>
        </View>
    );
}

// Component cho 1 dòng tiến độ khu vực
function ZoneRow({zone}){
    return(
        <View style = {styles.zoneRow}>
            <Ionicons name={zone.icon} size={18} color={zone.color} style={{ marginRight: 6 }} />
            <Text style = {styles.zoneName}>{zone.name}</Text>
            <View style = {styles.zoneBar}>
                <View style = {[styles.zoneBarFill, {width: `${zone.pct}%`, backgroundColor: zone.color}]}/> 
            </View>
            <Text style = {[styles.zonePct, {color: zone.color}]} >{zone.pct}%</Text>
        </View>
    );
}

// component cho sản phẩm bị Thiếu
function ShortageItem({item}){
    return(
        <View style={styles.shortageRow}>
            <View style={styles.shortageIconContainer}>
                <Ionicons name="alert-circle" size={18} color="#e53935" />
            </View>
            <View style={styles.shortageInfo}>
                <Text style={styles.shortageName}>{item.name}</Text>
                <View style={styles.shortageMeta}>
                    <View style={styles.shortageLocBadge}>
                        <Ionicons name="location-outline" size={10} color="#666" style={{ marginRight: 2 }} />
                        <Text style={styles.shortageLocText}>{item.loc}</Text>
                    </View>
                    <Text style={styles.shortageWhoText}>{item.who}</Text>
                </View>
            </View>
        </View>
    );
}

export default function ManagerDashboardScreen(){
    const [stats, setStats] = useState(null);
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Picking dispatch states
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [ordersList, setOrdersList] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [selectedPickingOrderId, setSelectedPickingOrderId] = useState('');
    const [pickingAssignments, setPickingAssignments] = useState({}); // mapping: productId -> { checked: boolean, staffId: number, quantity: number }
    const [loadingDispatchData, setLoadingDispatchData] = useState(false);
    const [dispatching, setDispatching] = useState(false);
    const [staffSearchQuery, setStaffSearchQuery] = useState('');

    const openDispatchModal = async () => {
        setShowDispatchModal(true);
        // If we don't have orders/staff loaded yet, show the activity indicator
        if (ordersList.length === 0 || staffList.length === 0) {
            setLoadingDispatchData(true);
        }
        setStaffSearchQuery('');
        try {
            const [ordersRes, usersRes] = await Promise.all([
                getOrders(),
                getUsers()
            ]);
            
            const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data || []);
            const processingOrders = orders.filter(o => o.status === 'processing');
            setOrdersList(processingOrders);

            const users = Array.isArray(usersRes) ? usersRes : (usersRes?.data || []);
            const staffOnly = users.filter(u => u.role === 'staff');
            setStaffList(staffOnly);
        } catch (err) {
            console.log('Error loading dispatch data:', err.message);
        } finally {
            setLoadingDispatchData(false);
        }
    };

    const handleSelectOrder = (orderId) => {
        setSelectedPickingOrderId(orderId);
        if (!orderId) {
            setPickingAssignments({});
            return;
        }
        
        const order = ordersList.find(o => String(o.id) === String(orderId));
        if (!order) return;

        const initialAssignments = {};
        order.orderDetails?.forEach(item => {
            if (item.productId) {
                const productZoneId = item.product?.category?.location?.id;
                
                // Sort staff specifically for this item: 1. Free first, 2. Zone match second, 3. Workload third
                const sortedStaff = [...staffList].sort((a, b) => {
                    const aTasks = a.activePickingTasksCount || 0;
                    const bTasks = b.activePickingTasksCount || 0;
                    
                    if (aTasks === 0 && bTasks > 0) return -1;
                    if (aTasks > 0 && bTasks === 0) return 1;
                    
                    const aZoneMatch = a.assignedLocationId && productZoneId && String(a.assignedLocationId) === String(productZoneId);
                    const bZoneMatch = b.assignedLocationId && productZoneId && String(b.assignedLocationId) === String(productZoneId);
                    
                    if (aZoneMatch && !bZoneMatch) return -1;
                    if (!aZoneMatch && bZoneMatch) return 1;
                    
                    return aTasks - bTasks;
                });
                
                const bestStaff = sortedStaff[0];
                initialAssignments[item.productId] = {
                    checked: true,
                    staffId: bestStaff ? bestStaff.id : '',
                    quantity: item.quantity
                };
            }
        });
        setPickingAssignments(initialAssignments);
    };

    const handleDispatchTasks = async () => {
        if (!selectedPickingOrderId) {
            Alert.alert('Lỗi', 'Vui lòng chọn một đơn hàng để giao việc');
            return;
        }

        const order = ordersList.find(o => String(o.id) === String(selectedPickingOrderId));
        if (!order) return;

        const tasks = [];
        const details = order.orderDetails || [];

        for (const item of details) {
            const productId = item.productId;
            const assign = pickingAssignments[productId];
            
            const isChecked = assign?.checked !== false;
            if (!isChecked) continue;

            const staffId = assign?.staffId;
            if (!staffId) {
                Alert.alert('Lỗi phân công', `Vui lòng chọn Nhân viên soạn sản phẩm: ${item.product?.name || 'Sản phẩm'}`);
                return;
            }

            const quantity = parseInt(assign?.quantity || item.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                Alert.alert('Lỗi phân công', `Số lượng soạn sản phẩm "${item.product?.name}" phải lớn hơn 0`);
                return;
            }

            if (quantity > item.quantity) {
                Alert.alert('Lỗi phân công', `Số lượng soạn sản phẩm "${item.product?.name}" không thể lớn hơn số lượng khách đặt (${item.quantity})`);
                return;
            }

            tasks.push({
                productId,
                staffId: parseInt(staffId),
                quantity
            });
        }

        if (tasks.length === 0) {
            Alert.alert('Lỗi phân công', 'Vui lòng chọn ít nhất một sản phẩm để giao việc');
            return;
        }

        setDispatching(true);
        try {
            await assignPickingTask({
                orderId: order.id,
                tasks
            });
            
            // Close modal and reset states instantly before running heavy refreshes
            setShowDispatchModal(false);
            setSelectedPickingOrderId('');
            setPickingAssignments({});
            setDispatching(false);
            
            Alert.alert('Phân công thành công', `Đã chia nhỏ và tạo thành công ${tasks.length} lệnh nhặt hàng (Picking Tasks) trực tiếp gửi đến thiết bị của các nhân viên được chọn!`);
            
            // Run background refreshes concurrently to avoid UI freezing
            Promise.all([
                getDashboardStatus().then(res => setStats(res)).catch(e => console.log('Bg stats error:', e.message)),
                getIncidents().then(res => setIncidents(Array.isArray(res) ? res : [])).catch(e => console.log('Bg incidents error:', e.message)),
                getOrders().then(res => {
                    const orders = Array.isArray(res) ? res : (res?.data || []);
                    setOrdersList(orders.filter(o => o.status === 'processing'));
                }).catch(e => console.log('Bg orders error:', e.message)),
                getUsers().then(res => {
                    const users = Array.isArray(res) ? res : (res?.data || []);
                    setStaffList(users.filter(u => u.role === 'staff'));
                }).catch(e => console.log('Bg users error:', e.message))
            ]);
        } catch (err) {
            setDispatching(false);
            Alert.alert('Lỗi phân công', err.message || 'Không thể tạo phân công nhiệm vụ');
        }
    };

    const s = stats || {};
    const totals = s.totals || {};
    
    // Dynamic KPI calculations
    const totalPickedItems = totals.itemsPicked ?? 0;
    const activeWorkers  = s.staffPerformance?.filter(p => p.totalItemsPicked > 0).length ?? 0;
    const totalWorkers   = s.staffPerformance?.length ?? 0;
    const pendingOrders  = totals.pendingOrders ?? 0;
    const pendingIncidentsCount = incidents.filter(inc => inc.status === 'pending').length;

    const displayKpis = [
        { icon: 'checkmark-circle-outline', value: String(totalPickedItems),
          label: 'Sản phẩm đã pick', color: COLORS.successBg, textColor: COLORS.primary },
        { icon: 'people-outline', value: `${activeWorkers}/${totalWorkers}`,
          label: 'NV hoạt động', color: '#e3f2fd', textColor: '#1565c0' },
        { icon: 'warning-outline', value: String(pendingIncidentsCount),
          label: 'Báo thiếu', color: COLORS.warningBg, textColor: '#e65100' },
        { icon: 'cube-outline', value: String(pendingOrders),
          label: 'Đơn tồn', color: '#f3e5f5', textColor: '#7b1fa2' },
    ];

    // Dynamic hourly productivity mapping
    const maxHourPicked = Math.max(...(s.hourlyProductivity?.map(h => h.totalItemsPicked) || [1]));

    // Dynamic Top picking staff sorted by speed
    const topStaff = [...(s.staffPerformance || [])]
        .sort((a, b) => b.pickingSpeed - a.pickingSpeed)
        .slice(0, 3);

    // Dynamic Underperforming staff below 60 sp/giờ
    const underperformingStaff = s.staffPerformance?.filter(p => p.warning && p.totalItemsPicked > 0) || [];

    // Dynamic pending shortages
    const displayShortages = incidents.filter(inc => inc.status === 'pending').slice(0, 3).map(inc => {
        let productName = 'Sản phẩm';
        let locationName = 'Chưa định vị';

        if (inc.task?.orderDetail?.product?.name) {
            productName = inc.task.orderDetail.product.name;
        } else if (inc.reason?.includes(':')) {
            const detailText = inc.reason.substring(inc.reason.indexOf(':') + 1).trim();
            productName = detailText.split('(')[0].trim();
        }

        if (inc.task?.location?.code) {
            locationName = inc.task.location.code;
        } else if (inc.reason?.includes('Tại vị trí:')) {
            const match = inc.reason.match(/Tại vị trí:\s*([^)]+)/);
            if (match && match[1]) {
                locationName = match[1].trim();
            }
        }

        const reporterName = inc.reporter?.name || inc.reporter?.fullName || inc.reporter?.username || inc.reportedBy || 'Nhân viên';

        return {
            id: inc.id || inc._id,
            icon: 'warning',
            name: productName,
            loc: locationName,
            who: `${reporterName} · ${inc.createdAt ? new Date(inc.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}`,
        };
    });

    useEffect(() => {
        async function fetchAll(){
            try{
                // Parallel prefetching of dashboard stats, incidents, orders, and users
                const [statsRes, incidentsRes, ordersRes, usersRes] = await Promise.allSettled([
                    getDashboardStatus(),
                    getIncidents(),
                    getOrders(),
                    getUsers()
                ]);

                if (statsRes.status === 'fulfilled') {
                    setStats(statsRes.value);
                } else {
                    console.log('Stats pre-fetch error:', statsRes.reason?.message);
                }
                
                if (incidentsRes.status === 'fulfilled') {
                    setIncidents(Array.isArray(incidentsRes.value) ? incidentsRes.value : []);
                } else {
                    console.log('Incidents pre-fetch error:', incidentsRes.reason?.message);
                }
                
                if (ordersRes.status === 'fulfilled') {
                    const orders = Array.isArray(ordersRes.value) ? ordersRes.value : (ordersRes.value?.data || []);
                    const processingOrders = orders.filter(o => o.status === 'processing');
                    setOrdersList(processingOrders);
                } else {
                    console.log('Orders pre-fetch error:', ordersRes.reason?.message);
                }
                
                if (usersRes.status === 'fulfilled') {
                    const users = Array.isArray(usersRes.value) ? usersRes.value : (usersRes.value?.data || []);
                    const staffOnly = users.filter(u => u.role === 'staff');
                    setStaffList(staffOnly);
                } else {
                    console.log('Users pre-fetch error:', usersRes.reason?.message);
                }
            } catch (err) {
                console.log('Initial pre-fetch error:', err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={COLORS.primary} size="large" />
            </SafeAreaView>
        );
    }

    return(
        <SafeAreaView style={styles.safeArea}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Manager Dashboard</Text>
                <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                </View>
            </View>

            {/* Body */}
            <ScrollView style = {styles.scroll}>
                {/* 4 thẻ card 2x2 */}
                <View style = {styles.kpiGrid}>
                    {displayKpis.map((item, index) => (
                        <KpiCard key = {index}  item = {item} />
                    ))}
                </View>

                {/* BÀN ĐIỀU PHỐI & CHIA TASK (NHƯ WEB) */}
                <TouchableOpacity 
                    style={{
                        backgroundColor: COLORS.primary,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        shadowColor: COLORS.primary,
                        shadowOpacity: 0.2,
                        shadowRadius: 6,
                        elevation: 3,
                    }}
                    onPress={openDispatchModal}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="git-pull-request" size={22} color="#fff" />
                        </View>
                        <View>
                            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Bàn Điều Phối & Chia Lệnh</Text>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, marginTop: 2 }}>Phân tách sỉ & giao việc trực tiếp cho Picker</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>

                {/* Phân tích trạng thái đơn hàng */}
                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Phân tích trạng thái đơn hàng</Text>
                    <View style = {styles.orderStatsGrid}>
                        <View style = {styles.orderStatBox}>
                            <View style = {[styles.orderStatIconContainer, { backgroundColor: '#e3f2fd' }]}>
                                <Ionicons name="time-outline" size={20} color="#2196f3" />
                            </View>
                            <View style = {styles.orderStatInfo}>
                                <Text style = {styles.orderStatValue}>{s.ordersByStatus?.pending ?? 0}</Text>
                                <Text style = {styles.orderStatLabel}>Chờ xử lý / Đơn mới</Text>
                            </View>
                        </View>
                        <View style = {styles.orderStatBox}>
                            <View style = {[styles.orderStatIconContainer, { backgroundColor: '#fff3e0' }]}>
                                <Ionicons name="cube-outline" size={20} color="#ff9800" />
                            </View>
                            <View style = {styles.orderStatInfo}>
                                <Text style = {styles.orderStatValue}>{s.ordersByStatus?.processing ?? 0}</Text>
                                <Text style = {styles.orderStatLabel}>Đang soạn hàng</Text>
                            </View>
                        </View>
                        <View style = {styles.orderStatBox}>
                            <View style = {[styles.orderStatIconContainer, { backgroundColor: '#e8f5e9' }]}>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#4caf50" />
                            </View>
                            <View style = {styles.orderStatInfo}>
                                <Text style = {styles.orderStatValue}>{(s.ordersByStatus?.delivered ?? 0) + (s.ordersByStatus?.shipped ?? 0)}</Text>
                                <Text style = {styles.orderStatLabel}>Thành công</Text>
                            </View>
                        </View>
                        <View style = {styles.orderStatBox}>
                            <View style = {[styles.orderStatIconContainer, { backgroundColor: '#ffebee' }]}>
                                <Ionicons name="close-circle-outline" size={20} color="#f44336" />
                            </View>
                            <View style = {styles.orderStatInfo}>
                                <Text style = {styles.orderStatValue}>{s.ordersByStatus?.cancelled ?? 0}</Text>
                                <Text style = {styles.orderStatLabel}>Đã huỷ</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Live Hourly Productivity Chart */}
                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Năng suất soạn hàng theo giờ</Text>
                    {s.hourlyProductivity && s.hourlyProductivity.length > 0 ? (
                        s.hourlyProductivity.slice(0, 4).map((h) => {
                            const pct = Math.round((h.totalItemsPicked / maxHourPicked) * 100) || 0;
                            return (
                                <View style = {styles.zoneRow} key={h.hour}>
                                    <Ionicons name="time-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                                    <Text style = {styles.zoneName}>{h.label}</Text>
                                    <View style = {styles.zoneBar}>
                                        <View style = {[styles.zoneBarFill, {width: `${pct}%`, backgroundColor: COLORS.primary}]}/> 
                                    </View>
                                    <Text style = {[styles.zonePct, {color: COLORS.primary, width: 70}]} >{h.totalItemsPicked} sp</Text>
                                </View>
                            );
                        })
                    ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 15 }}>
                            <Text style={{ fontSize: 13, color: '#888' }}>Chưa ghi nhận năng suất soạn hàng theo giờ</Text>
                        </View>
                    )}
                </View>

                {/* Top Picking Staff Leaderboard */}
                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Picker xuất sắc nhất hôm nay</Text>
                    {topStaff.length > 0 ? (
                        topStaff.map((staff, idx) => {
                            const icons = ['🥇', '🥈', '🥉'];
                            return (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: idx < topStaff.length - 1 ? 0.5 : 0, borderColor: '#eee' }} key={staff.staffId}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ fontSize: 16 }}>{icons[idx] || '👤'}</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>{staff.name}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary }}>{staff.pickingSpeed} sp/giờ</Text>
                                        <Text style={{ fontSize: 10, color: '#888' }}>Đã soạn: {staff.totalItemsPicked} sp</Text>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                            <Text style={{ fontSize: 13, color: '#888' }}>Chưa có số liệu picker</Text>
                        </View>
                    )}
                </View>

                {/* Alert cảnh báo năng suất làm việc */}
                {underperformingStaff.length > 0 ? (
                    <View style = {styles.alert}>
                        <Ionicons name="warning-outline" size={24} color="#e65100" style={{ marginRight: 4 }} />
                        <View style = {styles.alertBody}>
                            <Text style = {styles.alertTitle}>{underperformingStaff.length} nhân viên dưới mức năng suất</Text>
                            <Text style={styles.alertSub}>
                                {underperformingStaff.slice(0, 3).map(p => `${p.name} (${p.pickingSpeed} sp/giờ)`).join(', ')}
                                {underperformingStaff.length > 3 ? ` và ${underperformingStaff.length - 3} nhân viên khác` : ''} đang dưới định mức tối thiểu 6.5 sp/giờ.
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style = {[styles.alert, { backgroundColor: '#e8f5e9', borderLeftColor: COLORS.success }]}>
                        <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.primary} style={{ marginRight: 4 }} />
                        <View style = {styles.alertBody}>
                            <Text style = {[styles.alertTitle, { color: COLORS.primary }]}>Năng suất Picker hoàn hảo!</Text>
                            <Text style={styles.alertSub}>
                                Tất cả nhân viên soạn hàng đều đạt hiệu suất tiêu chuẩn (trên 6.5 sp/giờ).
                            </Text>
                        </View>
                    </View>
                )}

                {/* Sản phẩm còn thiếu */}
                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Sản phẩm báo thiếu tại kệ</Text>
                    {displayShortages.length > 0 ? (
                        displayShortages.map((item) => (
                            <ShortageItem key = {item.id} item = {item} />
                        ))
                    ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                            <Ionicons name="checkmark-circle" size={40} color={COLORS.primary} />
                            <Text style={{ fontSize: 13, color: '#888', marginTop: 8, fontWeight: '500' }}>
                                Không có báo thiếu nào cần xử lý!
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Navigation Manager */}
            <ManagerBottomNav active="dashboard" />

            {/* Modal Bàn Điều Phối & Chia Task */}
            {showDispatchModal && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showDispatchModal}
                    onRequestClose={() => setShowDispatchModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { height: '90%' }]}>
                            
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.modalTitle}>Bàn Điều Phối & Chia Task</Text>
                                    <Text style={styles.modalSub}>Phân tách đơn sỉ & giao việc cho nhân viên kho</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowDispatchModal(false)} style={styles.closeBtn}>
                                    <Ionicons name="close-circle" size={28} color="#aaa" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                                {/* 1. LỰA CHỌN ĐƠN HÀNG */}
                                <Text style={styles.sectionTitle}>1. Lựa chọn Đơn đặt hàng đang xử lý: *</Text>
                                {loadingDispatchData ? (
                                    <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: 12 }} />
                                ) : selectedPickingOrderId ? (
                                    // Premium Collapsed Order Card
                                    (() => {
                                        const order = ordersList.find(o => String(o.id) === String(selectedPickingOrderId));
                                        if (!order) return null;
                                        return (
                                            <View style={{ 
                                                borderWidth: 1.5, 
                                                borderColor: COLORS.primary, 
                                                borderRadius: 14, 
                                                backgroundColor: COLORS.warningBg, 
                                                padding: 14, 
                                                marginVertical: 8,
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <View style={{ flex: 1, marginRight: 10 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <Ionicons name="receipt" size={16} color={COLORS.primary} />
                                                        <Text style={{ fontWeight: '800', fontSize: 14, color: COLORS.primary }}>
                                                            Đơn hàng #{order.id}
                                                        </Text>
                                                    </View>
                                                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginTop: 4 }}>
                                                        {order.branch?.name || order.customer?.name || 'Kingfood Partner'}
                                                    </Text>
                                                    <Text style={{ fontSize: 11, color: COLORS.textGray, marginTop: 2 }}>
                                                        Tổng tiền: <Text style={{ fontWeight: '750', color: COLORS.text }}>{order.totalPrice ? order.totalPrice.toLocaleString() : '0'}đ</Text> · <Text style={{ fontWeight: '750', color: COLORS.primary }}>{order.orderDetails?.length || 0} SKU</Text>
                                                    </Text>
                                                </View>
                                                <TouchableOpacity 
                                                    style={{ 
                                                        backgroundColor: '#fff', 
                                                        borderWidth: 1.5, 
                                                        borderColor: COLORS.primary, 
                                                        paddingHorizontal: 12, 
                                                        paddingVertical: 6, 
                                                        borderRadius: 8 
                                                    }}
                                                    onPress={() => {
                                                        setSelectedPickingOrderId('');
                                                        setPickingAssignments({});
                                                    }}
                                                >
                                                    <Text style={{ fontSize: 12, fontWeight: '750', color: COLORS.primary }}>Thay đổi</Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })()
                                ) : ordersList.length > 0 ? (
                                    <View style={{ borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', marginVertical: 8 }}>
                                        {ordersList.map(order => (
                                            <TouchableOpacity
                                                key={order.id}
                                                style={{
                                                    padding: 14,
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: '#eee',
                                                    backgroundColor: '#fff',
                                                }}
                                                onPress={() => handleSelectOrder(order.id)}
                                            >
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text style={{ fontWeight: '700', fontSize: 13, color: COLORS.text }}>
                                                        Đơn hàng #{order.id}
                                                    </Text>
                                                    <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.primary }}>
                                                        {order.totalPrice ? order.totalPrice.toLocaleString() : '0'}đ
                                                    </Text>
                                                </View>
                                                <Text style={{ fontSize: 11, color: COLORS.textGray, marginTop: 4 }}>
                                                    Chi nhánh: {order.branch?.name || order.customer?.name || 'Kingfood Partner'} · {order.orderDetails?.length || 0} SKU
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : (
                                    <Text style={{ color: '#888', fontStyle: 'italic', marginVertical: 12 }}>Không có đơn đặt hàng nào đang ở trạng thái Đang Soạn Hàng.</Text>
                                )}

                                {/* 2. PHÂN TÁCH SẢN PHẨM & CHỌN PICKER */}
                                {selectedPickingOrderId ? (
                                    <View style={{ marginTop: 16 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <Text style={styles.sectionTitle}>2. Phân chia sản phẩm & Chọn nhân viên:</Text>
                                            <View style={{ backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>Đơn #{selectedPickingOrderId}</Text>
                                            </View>
                                        </View>

                                        {/* Global Staff Search Bar */}
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: '#f8fafc',
                                            borderRadius: 12,
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            marginBottom: 14,
                                            borderWidth: 1.5,
                                            borderColor: COLORS.border,
                                            gap: 8
                                        }}>
                                            <Ionicons name="search" size={16} color="#64748b" />
                                            <TextInput
                                                placeholder="Tìm tên nhân viên hoặc username..."
                                                placeholderTextColor="#94a3b8"
                                                value={staffSearchQuery}
                                                onChangeText={setStaffSearchQuery}
                                                style={{
                                                    flex: 1,
                                                    fontSize: 13,
                                                    color: COLORS.text,
                                                    padding: 0,
                                                    height: 22
                                                }}
                                            />
                                            {staffSearchQuery ? (
                                                <TouchableOpacity onPress={() => setStaffSearchQuery('')}>
                                                    <Ionicons name="close-circle" size={18} color="#94a3b8" />
                                                </TouchableOpacity>
                                            ) : null}
                                        </View>

                                        {/* Product Items List */}
                                        {(ordersList.find(o => String(o.id) === String(selectedPickingOrderId))?.orderDetails || []).map((item, idx) => {
                                            const productId = item.productId;
                                            const product = item.product;
                                            if (!productId || !product) return null;
                                            const currentAssign = pickingAssignments[productId] || { checked: true, staffId: '', quantity: item.quantity };
                                            const isChecked = currentAssign.checked !== false;
                                            const assignedStaffId = currentAssign.staffId;
                                            const assignedQty = currentAssign.quantity;

                                            return (
                                                <View 
                                                    key={idx} 
                                                    style={{
                                                        borderWidth: 1.5,
                                                        borderColor: isChecked ? COLORS.border : '#eee',
                                                        borderRadius: 14,
                                                        padding: 12,
                                                        marginBottom: 8,
                                                        backgroundColor: isChecked ? '#fff' : '#f9f9f9',
                                                        opacity: isChecked ? 1 : 0.6
                                                    }}
                                                >
                                                    {/* Top Row: Checkbox, Name, Qty */}
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                setPickingAssignments(prev => ({
                                                                    ...prev,
                                                                    [productId]: { ...prev[productId], checked: !isChecked }
                                                                }));
                                                            }}
                                                        >
                                                            <Ionicons 
                                                                name={isChecked ? "checkbox" : "square-outline"} 
                                                                size={22} 
                                                                color={isChecked ? COLORS.primary : '#aaa'} 
                                                            />
                                                        </TouchableOpacity>

                                                        <View style={{ flex: 1 }}>
                                                            <Text style={{ fontWeight: '700', fontSize: 13, color: COLORS.text }}>{product.name}</Text>
                                                            <Text style={{ fontSize: 11, color: COLORS.textGray, marginTop: 2 }}>
                                                                SKU: {product.sku || `SKU-${product.id}`} · <Text style={{ fontWeight: '700', color: COLORS.primary }}>{product.category?.name || 'Khu vực kệ'}</Text>
                                                            </Text>
                                                        </View>

                                                        <View style={{ alignItems: 'flex-end' }}>
                                                            <Text style={{ fontSize: 11, color: COLORS.textGray }}>Yêu cầu</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.text }}>{item.quantity} {product.unit || 'cái'}</Text>
                                                        </View>
                                                    </View>

                                                    {/* Assignment Picker Row */}
                                                    {isChecked && (
                                                        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 }}>
                                                            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Nhân viên Picker phụ trách:</Text>
                                                            
                                                            {(() => {
                                                                const filteredStaff = staffList.filter(s => {
                                                                    const q = (staffSearchQuery || '').toLowerCase().trim();
                                                                    if (!q) return true;
                                                                    return (s.name || '').toLowerCase().includes(q) || (s.username || '').toLowerCase().includes(q);
                                                                });

                                                                if (staffList.length === 0) {
                                                                    return <Text style={{ fontStyle: 'italic', color: '#ff9800', fontSize: 11, marginVertical: 4 }}>Chưa có nhân viên Picker nào</Text>;
                                                                }

                                                                if (filteredStaff.length === 0) {
                                                                    return <Text style={{ fontStyle: 'italic', color: '#64748b', fontSize: 11, marginVertical: 4 }}>Không tìm thấy nhân viên phù hợp</Text>;
                                                                }

                                                                return (
                                                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 4 }}>
                                                                        {[...filteredStaff].sort((a, b) => {
                                                                            const aTasks = a.activePickingTasksCount || 0;
                                                                            const bTasks = b.activePickingTasksCount || 0;
                                                                            
                                                                            if (aTasks === 0 && bTasks > 0) return -1;
                                                                            if (aTasks > 0 && bTasks === 0) return 1;
                                                                            
                                                                            const productZoneId = product?.category?.location?.id;
                                                                            const aZoneMatch = a.assignedLocationId && productZoneId && String(a.assignedLocationId) === String(productZoneId);
                                                                            const bZoneMatch = b.assignedLocationId && productZoneId && String(b.assignedLocationId) === String(productZoneId);
                                                                            
                                                                            if (aZoneMatch && !bZoneMatch) return -1;
                                                                            if (!aZoneMatch && bZoneMatch) return 1;
                                                                            
                                                                            return aTasks - bTasks;
                                                                        }).map(staff => {
                                                                            const isSelected = String(assignedStaffId) === String(staff.id);
                                                                            const productZoneId = product?.category?.location?.id;
                                                                            const isZoneMatch = staff.assignedLocationId && productZoneId && String(staff.assignedLocationId) === String(productZoneId);
                                                                            
                                                                            const activeTasks = staff.activePickingTasksCount || 0;
                                                                            const isFree = activeTasks === 0;

                                                                            return (
                                                                                <TouchableOpacity
                                                                                    key={staff.id}
                                                                                    style={{
                                                                                        paddingHorizontal: 10,
                                                                                        paddingVertical: 6,
                                                                                        borderRadius: 8,
                                                                                        borderWidth: 1,
                                                                                        borderColor: isSelected ? COLORS.primary : '#ddd',
                                                                                        backgroundColor: isSelected ? COLORS.warningBg : '#fff',
                                                                                        flexDirection: 'row',
                                                                                        alignItems: 'center',
                                                                                        gap: 6
                                                                                    }}
                                                                                    onPress={() => {
                                                                                        setPickingAssignments(prev => ({
                                                                                            ...prev,
                                                                                            [productId]: { ...prev[productId], staffId: staff.id }
                                                                                        }));
                                                                                    }}
                                                                                >
                                                                                    <Ionicons name="person" size={11} color={isSelected ? COLORS.primary : '#888'} />
                                                                                    <Text style={{ fontSize: 12, fontWeight: isSelected ? '700' : '500', color: isSelected ? COLORS.primary : '#444' }}>
                                                                                        {staff.name || staff.username}
                                                                                    </Text>
                                                                                    
                                                                                    <Text style={{ 
                                                                                        fontSize: 9, 
                                                                                        fontWeight: '700', 
                                                                                        color: isFree ? COLORS.success : COLORS.error, 
                                                                                        backgroundColor: isFree ? COLORS.successBg : COLORS.errorBg, 
                                                                                        paddingHorizontal: 4, 
                                                                                        borderRadius: 4 
                                                                                    }}>
                                                                                        {isFree ? '🟢 Rảnh' : `🔴 Bận (${activeTasks})`}
                                                                                    </Text>

                                                                                    {isZoneMatch && (
                                                                                        <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.primary, backgroundColor: '#ffe5db', paddingHorizontal: 4, borderRadius: 4 }}>
                                                                                            Khu vực Kệ
                                                                                        </Text>
                                                                                    )}
                                                                                </TouchableOpacity>
                                                                            );
                                                                        })}
                                                                    </ScrollView>
                                                                );
                                                            })()}

                                                            {/* Quantity adjustment */}
                                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                                                                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.text }}>Số lượng giao nhặt:</Text>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            setPickingAssignments(prev => ({
                                                                                ...prev,
                                                                                [productId]: { ...prev[productId], quantity: Math.max(1, parseInt(assignedQty) - 1) }
                                                                            }));
                                                                        }}
                                                                        style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}
                                                                    >
                                                                        <Text style={{ fontWeight: '700', fontSize: 14 }}>−</Text>
                                                                    </TouchableOpacity>
                                                                    <Text style={{ fontSize: 13, fontWeight: '800', minWidth: 20, textAlign: 'center' }}>{assignedQty}</Text>
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            setPickingAssignments(prev => ({
                                                                                ...prev,
                                                                                [productId]: { ...prev[productId], quantity: Math.min(item.quantity, parseInt(assignedQty) + 1) }
                                                                            }));
                                                                        }}
                                                                        style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}
                                                                    >
                                                                        <Text style={{ fontWeight: '700', fontSize: 14 }}>+</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                ) : null}
                            </ScrollView>

                            {/* Modal Footer */}
                            {selectedPickingOrderId && (
                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        style={[
                                            styles.actionBtn,
                                            {
                                                backgroundColor: COLORS.primary,
                                                width: '100%',
                                                opacity: dispatching ? 0.7 : 1
                                            }
                                        ]}
                                        onPress={handleDispatchTasks}
                                        disabled={dispatching}
                                    >
                                        {dispatching ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <Ionicons name="flash" size={18} color="#fff" style={{ marginRight: 6 }} />
                                                <Text style={styles.btnText}>Kích hoạt & Gửi lệnh Picking sỉ</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}

                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backBtn: {
        fontSize: 28,
        color: COLORS.text,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },

    // Live badge
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffebee',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 5,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: COLORS.error,
    },
    liveText: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.error,
    },

    scroll: { flex: 1, padding: 16, backgroundColor: '#f3f4f6' },

    // KPI Grid 2x2
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 12,
    },
    kpiCard: {
        width: '47%',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        gap: 4,
    },
    kpiIcon: { fontSize: 24 },
    kpiValue: {
        fontSize: 26,
        fontWeight: '900',
    },
    kpiLabel: {
        fontSize: 11,
        color: '#888',
        textAlign: 'center',
    },

    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 14,
    },

    // Zone Row
    zoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    zoneName: {
        fontSize: 13,
        color: '#444',
        width: 90,
    },
    zoneBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        overflow: 'hidden',
    },
    zoneBarFill: {
        height: '100%',
        borderRadius: 10,
    },
    zonePct: {
        fontSize: 13,
        fontWeight: '700',
        width: 36,
        textAlign: 'right',
    },

    // Alert
    alert: {
        flexDirection: 'row',
        backgroundColor: COLORS.warningBg,
        borderRadius: 14,
        padding: 14,
        gap: 10,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.warning,
        alignItems: 'center',
    },
    alertIcon: { fontSize: 22 },
    alertBody: { flex: 1 },
    alertTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#e65100',
        marginBottom: 4,
    },
    alertSub: {
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },

    // Shortage
    shortageRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f0f0f0',
    },
    shortageIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ffebee',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        marginTop: 2,
    },
    shortageInfo: {
        flex: 1,
    },
    shortageName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#222',
        lineHeight: 20,
    },
    shortageMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    shortageLocBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 0.5,
        borderColor: '#e0e0e0',
    },
    shortageLocText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#555',
    },
    shortageWhoText: {
        fontSize: 11,
        color: '#888',
    },

    // Bottom Nav
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    navItem: {
        alignItems: 'center',
    },
    navIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    navLabel: {
        fontSize: 12,
        color: '#666',
    },
    navActive: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    orderStatsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    orderStatBox: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    orderStatIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orderStatInfo: {
        flex: 1,
    },
    orderStatValue: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text,
    },
    orderStatLabel: {
        fontSize: 10,
        color: '#777',
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
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
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    actionBtn: {
        height: 48,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#444',
        marginBottom: 8,
    },
});