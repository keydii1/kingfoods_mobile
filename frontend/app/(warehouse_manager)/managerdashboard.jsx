import { View, Text, StyleSheet,
         ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getDashboardStatus, getIncidents, getOrders, getUsers, assignPickingTask, getCachedData } from '../../constants/services/api';
import { COLORS } from '../../constants/colors';
import { Alert } from '../../utils/appAlert';
import ManagerBottomNav from '../../components/ManagerBottomNav';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

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

// component KPI card
function KpiCard ({item}){
    const { darkMode } = useAppPreferences();
    return (
        <View style = {[styles.kpiCard, {backgroundColor: item.color}]} >
            <Ionicons name={item.icon} size={28} color={item.textColor} />
            <Text style = {[styles.kpiValue, {color: item.textColor}]}>{item.value}</Text>
            <Text style = {[styles.kpiLabel, {color: darkMode ? '#cbd5e1' : '#888'}]}>{item.label}</Text>
        </View>
    );
}

// Component cho 1 dòng tiến độ khu vực
function ZoneRow({zone}){
    const { darkMode } = useAppPreferences();
    return(
        <View style = {styles.zoneRow}>
            <Ionicons name={zone.icon} size={18} color={zone.color} style={{ marginRight: 6 }} />
            <Text style = {[styles.zoneName, {color: darkMode ? '#cbd5e1' : '#444'}]}>{zone.name}</Text>
            <View style = {[styles.zoneBar, {backgroundColor: darkMode ? '#2d2d2d' : '#f0f0f0'}]}>
                <View style = {[styles.zoneBarFill, {width: `${zone.pct}%`, backgroundColor: zone.color}]}/> 
            </View>
            <Text style = {[styles.zonePct, {color: zone.color}]} >{zone.pct}%</Text>
        </View>
    );
}

// component cho sản phẩm bị Thiếu
function ShortageItem({item}){
    const { darkMode } = useAppPreferences();
    return(
        <View style={[styles.shortageRow, {borderBottomColor: darkMode ? '#2d2d2d' : '#f0f0f0'}]}>
            <View style={[styles.shortageIconContainer, {backgroundColor: darkMode ? '#451a1a' : '#ffebee'}]}>
                <Ionicons name="alert-circle" size={18} color="#e53935" />
            </View>
            <View style={styles.shortageInfo}>
                <Text style={[styles.shortageName, {color: darkMode ? '#cbd5e1' : '#222'}]}>{item.name}</Text>
                <View style={styles.shortageMeta}>
                    <View style={[styles.shortageLocBadge, {backgroundColor: darkMode ? '#2d2d2d' : '#f5f5f5', borderColor: darkMode ? '#444' : '#e0e0e0'}]}>
                        <Ionicons name="location-outline" size={10} color={darkMode ? '#9ca3af' : '#666'} style={{ marginRight: 2 }} />
                        <Text style={[styles.shortageLocText, {color: darkMode ? '#cbd5e1' : '#555'}]}>{item.loc}</Text>
                    </View>
                    <Text style={[styles.shortageWhoText, {color: darkMode ? '#9ca3af' : '#888'}]}>{item.who}</Text>
                </View>
            </View>
        </View>
    );
}

export default function ManagerDashboardScreen(){
    const cachedStats = getCachedData('/admin/dashboard/stats');
    const cachedIncidents = getCachedData('/admin/picking/incidents');

    const { language, darkMode } = useAppPreferences();
    const isEn = language === 'en';

    const activeBg = darkMode ? '#121212' : '#f0f4f1';
    const activeHeaderBg = darkMode ? '#1e1e1e' : '#fff';
    const activeBorderColor = darkMode ? '#2d2d2d' : '#eee';
    const activeTextColor = darkMode ? '#f3f4f6' : '#222';
    const activeCardBg = darkMode ? '#1e1e1e' : '#fff';
    const activeTextGrayColor = darkMode ? '#9ca3af' : '#888';
    const activeInputBg = darkMode ? '#2d2d2d' : '#f8f9fa';

    const [stats, setStats] = useState(cachedStats);
    const [incidents, setIncidents] = useState(cachedIncidents || []);
    const [loading, setLoading] = useState(!cachedStats);

    // Picking dispatch states
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [ordersList, setOrdersList] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [selectedPickingOrderId, setSelectedPickingOrderId] = useState('');
    const [pickingAssignments, setPickingAssignments] = useState({}); // mapping: productId -> { checked: boolean, staffId: number, quantity: number }
    const [loadingDispatchData, setLoadingDispatchData] = useState(false);
    const [dispatching, setDispatching] = useState(false);
    const [staffSearchQuery, setStaffSearchQuery] = useState('');
    const [modalOrderFilter, setModalOrderFilter] = useState('all');

    const openDispatchModal = async () => {
        setShowDispatchModal(true);
        setModalOrderFilter('all');
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
            const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
            setOrdersList(activeOrders);

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
            Alert.alert(isEn ? 'Error' : 'Lỗi', isEn ? 'Please select an order to assign' : 'Vui lòng chọn một đơn hàng để giao việc');
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
                Alert.alert(
                    isEn ? 'Assignment Error' : 'Lỗi phân công',
                    isEn ? `Please select a picker for product: ${item.product?.name || 'Product'}` : `Vui lòng chọn Nhân viên soạn sản phẩm: ${item.product?.name || 'Sản phẩm'}`
                );
                return;
            }

            const quantity = parseInt(assign?.quantity || item.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                Alert.alert(
                    isEn ? 'Assignment Error' : 'Lỗi phân công',
                    isEn ? `Picking quantity for product "${item.product?.name}" must be greater than 0` : `Số lượng soạn sản phẩm "${item.product?.name}" phải lớn hơn 0`
                );
                return;
            }

            if (quantity > item.quantity) {
                Alert.alert(
                    isEn ? 'Assignment Error' : 'Lỗi phân công',
                    isEn ? `Picking quantity for product "${item.product?.name}" cannot exceed the requested quantity (${item.quantity})` : `Số lượng soạn sản phẩm "${item.product?.name}" không thể lớn hơn số lượng khách đặt (${item.quantity})`
                );
                return;
            }

            tasks.push({
                productId,
                staffId: parseInt(staffId),
                quantity
            });
        }

        if (tasks.length === 0) {
            Alert.alert(
                isEn ? 'Assignment Error' : 'Lỗi phân công',
                isEn ? 'Please select at least one product to assign' : 'Vui lòng chọn ít nhất một sản phẩm để giao việc'
            );
            return;
        }

        setDispatching(true);
        try {
            await assignPickingTask({
                orderId: order.id,
                tasks
            });
            
            setShowDispatchModal(false);
            setSelectedPickingOrderId('');
            setPickingAssignments({});
            setDispatching(false);
            
            Alert.alert(
                isEn ? 'Assignment Successful' : 'Phân công thành công',
                isEn ? `Successfully split and created ${tasks.length} picking tasks sent directly to the selected staff's devices!` : `Đã chia nhỏ và tạo thành công ${tasks.length} lệnh nhặt hàng (Picking Tasks) trực tiếp gửi đến thiết bị của các nhân viên được chọn!`
            );
            
            Promise.all([
                getDashboardStatus().then(res => setStats(res)).catch(e => console.log('Bg stats error:', e.message)),
                getIncidents().then(res => setIncidents(Array.isArray(res) ? res : [])).catch(e => console.log('Bg incidents error:', e.message)),
                getOrders().then(res => {
                    const orders = Array.isArray(res) ? res : (res?.data || []);
                    setOrdersList(orders.filter(o => o.status === 'pending' || o.status === 'processing'));
                }).catch(e => console.log('Bg orders error:', e.message)),
                getUsers().then(res => {
                    const users = Array.isArray(res) ? res : (res?.data || []);
                    setStaffList(users.filter(u => u.role === 'staff'));
                }).catch(e => console.log('Bg users error:', e.message))
            ]);
        } catch (err) {
            setDispatching(false);
            Alert.alert(
                isEn ? 'Assignment Error' : 'Lỗi phân công',
                err.message || (isEn ? 'Failed to create picking task assignments' : 'Không thể tạo phân công nhiệm vụ')
            );
        }
    };

    const s = stats || {};
    const totals = s.totals || {};
    
    const totalPickedItems = totals.itemsPicked ?? 0;
    const activeWorkers  = s.staffPerformance?.filter(p => p.totalItemsPicked > 0).length ?? 0;
    const totalWorkers   = s.staffPerformance?.length ?? 0;
    const pendingOrders  = totals.pendingOrders ?? 0;
    const pendingIncidentsCount = incidents.filter(inc => inc.status === 'pending').length;

    const displayKpis = [
        { icon: 'checkmark-circle-outline', value: String(totalPickedItems),
          label: isEn ? 'SKUs Picked' : 'Sản phẩm đã pick', color: darkMode ? '#14532d' : COLORS.successBg, textColor: darkMode ? '#4ade80' : COLORS.primary },
        { icon: 'people-outline', value: `${activeWorkers}/${totalWorkers}`,
          label: isEn ? 'Active Staff' : 'NV hoạt động', color: darkMode ? '#1e3a8a' : '#e3f2fd', textColor: darkMode ? '#60a5fa' : '#1565c0' },
        { icon: 'warning-outline', value: String(pendingIncidentsCount),
          label: isEn ? 'Shortages' : 'Báo thiếu', color: darkMode ? '#7c2d12' : COLORS.warningBg, textColor: darkMode ? '#fb923c' : '#e65100' },
        { icon: 'cube-outline', value: String(pendingOrders),
          label: isEn ? 'Pending Orders' : 'Đơn tồn', color: darkMode ? '#581c87' : '#f3e5f5', textColor: darkMode ? '#c084fc' : '#7b1fa2' },
    ];

    const maxHourPicked = Math.max(...(s.hourlyProductivity?.map(h => h.totalItemsPicked) || [1]));

    const topStaff = [...(s.staffPerformance || [])]
        .sort((a, b) => b.pickingSpeed - a.pickingSpeed)
        .slice(0, 3);

    const underperformingStaff = s.staffPerformance?.filter(p => p.warning && p.totalItemsPicked > 0) || [];

    const displayShortages = incidents.filter(inc => inc.status === 'pending').slice(0, 3).map(inc => {
        let productName = isEn ? 'Product' : 'Sản phẩm';
        let locationName = isEn ? 'Unassigned' : 'Chưa định vị';

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

        const reporterName = inc.reporter?.name || inc.reporter?.fullName || inc.reporter?.username || inc.reportedBy || (isEn ? 'Staff' : 'Nhân viên');

        return {
            id: inc.id || inc._id,
            icon: 'warning',
            name: productName,
            loc: locationName,
            who: `${reporterName} · ${inc.createdAt ? new Date(inc.createdAt).toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}`,
        };
    });

    useEffect(() => {
        async function fetchAll(){
            try{
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
                    const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
                    setOrdersList(activeOrders);
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
            <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={COLORS.primary} size="large" />
            </SafeAreaView>
        );
    }

    return(
        <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg }]}>

            {/* Header */}
            <View style={[styles.header, { backgroundColor: activeHeaderBg, borderBottomColor: activeBorderColor }]}>
                <Text style={[styles.headerTitle, { color: activeTextColor }]}>Manager Dashboard</Text>
                <View style={[styles.liveBadge, darkMode && { backgroundColor: '#451a1a' }]}>
                    <View style={styles.liveDot} />
                    <Text style={[styles.liveText, darkMode && { color: '#f87171' }]}>LIVE</Text>
                </View>
            </View>

            {/* Body */}
            <ScrollView style = {[styles.scroll, { backgroundColor: activeBg }]}>
                <View style = {styles.kpiGrid}>
                    {displayKpis.map((item, index) => (
                        <KpiCard key = {index}  item = {item} />
                    ))}
                </View>

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
                            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{isEn ? 'Dispatch Desk & Tasks' : 'Bàn Điều Phối & Chia Lệnh'}</Text>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, marginTop: 2 }}>{isEn ? 'Split wholesale & assign tasks directly to Pickers' : 'Phân tách sỉ & giao việc trực tiếp cho Picker'}</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={{
                        backgroundColor: darkMode ? '#3b181a' : '#ffebee',
                        borderWidth: 1.5,
                        borderColor: darkMode ? '#7f1d1d' : '#ffcdd2',
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        shadowColor: '#e53935',
                        shadowOpacity: 0.1,
                        shadowRadius: 6,
                        elevation: 2,
                    }}
                    onPress={() => router.push('/(warehouse_manager)/returns')}
                >
                    <View style={{ backgroundColor: darkMode ? '#7f1d1d' : '#ffcdd2', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Ionicons name="alert-circle-outline" size={22} color={darkMode ? '#f87171' : '#d32f2f'} />
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ color: darkMode ? '#f87171' : '#c62828', fontSize: 15, fontWeight: '800' }}>{isEn ? 'QA Lookup & Discipline' : 'Truy xuất QA & Kỷ luật'}</Text>
                        <Text style={{ color: darkMode ? '#cbd5e1' : '#555', fontSize: 11, marginTop: 2 }} numberOfLines={2}>
                            {isEn ? 'Scan packing history & penalize violating staff' : 'Truy quét lịch sử đóng thùng & Xử phạt nhân viên vi phạm'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={darkMode ? '#f87171' : '#d32f2f'} />
                </TouchableOpacity>

                {/* Phân tích trạng thái đơn hàng */}
                <View style = {[styles.card, { backgroundColor: activeCardBg }]}>
                    <Text style = {[styles.cardTitle, { color: activeTextColor }]}>{isEn ? 'Order Status Analysis' : 'Phân tích trạng thái đơn hàng'}</Text>
                    <View style = {styles.orderStatsGrid}>
                        <View style = {[styles.orderStatBox, { backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa' }]}>
                            <View style = {[styles.orderStatIconContainer, { backgroundColor: darkMode ? '#1e3a8a' : '#e3f2fd' }]}>
                                <Ionicons name="time-outline" size={20} color={darkMode ? '#60a5fa' : "#2196f3"} />
                            </View>
                            <View style = {styles.orderStatInfo}>
                                <Text style = {[styles.orderStatValue, { color: activeTextColor }]}>{s.ordersByStatus?.pending ?? 0}</Text>
                                <Text style = {[styles.orderStatLabel, { color: activeTextGrayColor }]}>{isEn ? 'Pending / New' : 'Chờ xử lý / Đơn mới'}</Text>
                            </View>
                        </View>
                        <View style = {[styles.orderStatBox, { backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa' }]}>
                            <View style = {[styles.orderStatIconContainer, { backgroundColor: darkMode ? '#7c2d12' : '#fff3e0' }]}>
                                <Ionicons name="cube-outline" size={20} color={darkMode ? '#fb923c' : "#ff9800"} />
                            </View>
                            <View style = {styles.orderStatInfo}>
                                <Text style = {[styles.orderStatValue, { color: activeTextColor }]}>{s.ordersByStatus?.processing ?? 0}</Text>
                                <Text style = {[styles.orderStatLabel, { color: activeTextGrayColor }]}>{isEn ? 'Picking' : 'Đang soạn hàng'}</Text>
                            </View>
                        </View>
                        <View style = {[styles.orderStatBox, { backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa' }]}>
                            <View style = {[styles.orderStatIconContainer, { backgroundColor: darkMode ? '#14532d' : '#e8f5e9' }]}>
                                <Ionicons name="checkmark-circle-outline" size={20} color={darkMode ? '#4ade80' : "#4caf50"} />
                            </View>
                            <View style = {styles.orderStatInfo}>
                                <Text style = {[styles.orderStatValue, { color: activeTextColor }]}>{(s.ordersByStatus?.delivered ?? 0) + (s.ordersByStatus?.shipped ?? 0)}</Text>
                                <Text style = {[styles.orderStatLabel, { color: activeTextGrayColor }]}>{isEn ? 'Completed' : 'Thành công'}</Text>
                            </View>
                        </View>
                        <View style = {[styles.orderStatBox, { backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa' }]}>
                            <View style = {[styles.orderStatIconContainer, { backgroundColor: darkMode ? '#7f1d1d' : '#ffebee' }]}>
                                <Ionicons name="close-circle-outline" size={20} color={darkMode ? '#f87171' : "#f44336"} />
                            </View>
                            <View style = {styles.orderStatInfo}>
                                <Text style = {[styles.orderStatValue, { color: activeTextColor }]}>{s.ordersByStatus?.cancelled ?? 0}</Text>
                                <Text style = {[styles.orderStatLabel, { color: activeTextGrayColor }]}>{isEn ? 'Cancelled' : 'Đã huỷ'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Live Hourly Productivity Chart */}
                <View style = {[styles.card, { backgroundColor: activeCardBg }]}>
                    <Text style = {[styles.cardTitle, { color: activeTextColor }]}>{isEn ? 'Hourly Picking Productivity' : 'Năng suất soạn hàng theo giờ'}</Text>
                    {s.hourlyProductivity && s.hourlyProductivity.length > 0 ? (
                        s.hourlyProductivity.slice(0, 4).map((h) => {
                            const pct = Math.round((h.totalItemsPicked / maxHourPicked) * 100) || 0;
                            return (
                                <View style = {styles.zoneRow} key={h.hour}>
                                    <Ionicons name="time-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                                    <Text style = {[styles.zoneName, { color: activeTextColor }]}>{h.label}</Text>
                                    <View style = {[styles.zoneBar, { backgroundColor: darkMode ? '#2d2d2d' : '#f0f0f0' }]}>
                                        <View style = {[styles.zoneBarFill, {width: `${pct}%`, backgroundColor: COLORS.primary}]}/> 
                                    </View>
                                    <Text style = {[styles.zonePct, {color: COLORS.primary, width: 70}]} >{h.totalItemsPicked} {isEn ? 'pcs' : 'sp'}</Text>
                                </View>
                            );
                        })
                    ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 15 }}>
                            <Text style={{ fontSize: 13, color: activeTextGrayColor }}>{isEn ? 'No hourly picking productivity recorded yet' : 'Chưa ghi nhận năng suất soạn hàng theo giờ'}</Text>
                        </View>
                    )}
                </View>

                {/* Top Picking Staff Leaderboard */}
                <View style = {[styles.card, { backgroundColor: activeCardBg }]}>
                    <Text style = {[styles.cardTitle, { color: activeTextColor }]}>{isEn ? "Today's Best Pickers" : 'Picker xuất sắc nhất hôm nay'}</Text>
                    {topStaff.length > 0 ? (
                        topStaff.map((staff, idx) => {
                            const rankIcons = ['trophy', 'medal', 'ribbon'];
                            const rankColors = ['#eab308', '#94a3b8', '#b45309'];
                            return (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: idx < topStaff.length - 1 ? 0.5 : 0, borderColor: activeBorderColor }} key={staff.staffId}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        {idx < 3 ? (
                                            <Ionicons name={rankIcons[idx]} size={18} color={rankColors[idx]} />
                                        ) : (
                                            <Ionicons name="person-circle-outline" size={18} color={activeTextGrayColor} />
                                        )}
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: activeTextColor }}>{staff.name}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary }}>{staff.pickingSpeed} {isEn ? 'pcs/hr' : 'sp/giờ'}</Text>
                                        <Text style={{ fontSize: 10, color: activeTextGrayColor }}>{isEn ? `Picked: ${staff.totalItemsPicked} pcs` : `Đã soạn: ${staff.totalItemsPicked} sp`}</Text>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                            <Text style={{ fontSize: 13, color: activeTextGrayColor }}>{isEn ? 'No picker data available' : 'Chưa có số liệu picker'}</Text>
                        </View>
                    )}
                </View>

                {/* Alert cảnh báo năng suất làm việc */}
                {underperformingStaff.length > 0 ? (
                    <View style = {[styles.alert, darkMode && { backgroundColor: '#7c2d12', borderLeftColor: '#fb923c' }]}>
                        <Ionicons name="warning-outline" size={24} color={darkMode ? '#fb923c' : "#e65100"} style={{ marginRight: 4 }} />
                        <View style = {styles.alertBody}>
                            <Text style = {[styles.alertTitle, { color: darkMode ? '#fb923c' : '#e65100' }]}>
                                {isEn ? `${underperformingStaff.length} underperforming staff` : `${underperformingStaff.length} nhân viên dưới mức năng suất`}
                            </Text>
                            <Text style={[styles.alertSub, { color: darkMode ? '#cbd5e1' : '#666' }]}>
                                {underperformingStaff.slice(0, 3).map(p => `${p.name} (${p.pickingSpeed} ${isEn ? 'pcs/hr' : 'sp/giờ'})`).join(', ')}
                                {underperformingStaff.length > 3 
                                    ? (isEn ? ` and ${underperformingStaff.length - 3} other staff` : ` và ${underperformingStaff.length - 3} nhân viên khác`) 
                                    : ''
                                } {isEn ? 'are below the minimum rate of 6.5 pcs/hr.' : 'đang dưới định mức tối thiểu 6.5 sp/giờ.'}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style = {[styles.alert, { backgroundColor: darkMode ? '#14532d' : '#e8f5e9', borderLeftColor: COLORS.success }]}>
                        <Ionicons name="checkmark-circle-outline" size={24} color={darkMode ? '#4ade80' : COLORS.primary} style={{ marginRight: 4 }} />
                        <View style = {styles.alertBody}>
                            <Text style = {[styles.alertTitle, { color: darkMode ? '#4ade80' : COLORS.primary }]}>
                                {isEn ? 'Perfect Picker Productivity!' : 'Năng suất Picker hoàn hảo!'}
                            </Text>
                            <Text style={[styles.alertSub, { color: darkMode ? '#cbd5e1' : '#666' }]}>
                                {isEn 
                                    ? 'All picking staff have met standard performance (over 6.5 pcs/hr).' 
                                    : 'Tất cả nhân viên soạn hàng đều đạt hiệu suất tiêu chuẩn (trên 6.5 sp/giờ).'
                                }
                            </Text>
                        </View>
                    </View>
                )}

                {/* Sản phẩm còn thiếu */}
                <View style = {[styles.card, { backgroundColor: activeCardBg }]}>
                    <Text style = {[styles.cardTitle, { color: activeTextColor }]}>{isEn ? 'Shortages Reported at Shelves' : 'Sản phẩm báo thiếu tại kệ'}</Text>
                    {displayShortages.length > 0 ? (
                        displayShortages.map((item) => (
                            <ShortageItem key = {item.id} item = {item} />
                        ))
                    ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                            <Ionicons name="checkmark-circle" size={40} color={COLORS.primary} />
                            <Text style={{ fontSize: 13, color: activeTextGrayColor, marginTop: 8, fontWeight: '500' }}>
                                {isEn ? 'No shortages to handle!' : 'Không có báo thiếu nào cần xử lý!'}
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
                        <View style={[styles.modalContent, { height: '90%', backgroundColor: activeCardBg }]}>
                            
                            {/* Modal Header */}
                            <View style={[styles.modalHeader, { borderBottomColor: activeBorderColor }]}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={[styles.modalTitle, { color: activeTextColor }]}>{isEn ? 'Dispatch Desk & Tasks' : 'Bàn Điều Phối & Chia Task'}</Text>
                                    <Text style={[styles.modalSub, { color: activeTextGrayColor }]}>{isEn ? 'Split wholesale orders & assign tasks to pickers' : 'Phân tách đơn sỉ & giao việc cho nhân viên kho'}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowDispatchModal(false)} style={styles.closeBtn}>
                                    <Ionicons name="close-circle" size={28} color={darkMode ? '#666' : "#aaa"} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                                {/* 1. LỰA CHỌN ĐƠN HÀNG */}
                                <Text style={[styles.sectionTitle, { color: activeTextColor }]}>
                                    {isEn ? '1. Select order to dispatch & process: *' : '1. Lựa chọn Đơn đặt hàng cần điều phối & xử lý: *'}
                                </Text>
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
                                                backgroundColor: darkMode ? '#2d2d2d' : COLORS.warningBg, 
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
                                                            {isEn ? `Order #${order.id}` : `Đơn hàng #${order.id}`}
                                                        </Text>
                                                    </View>
                                                    <Text style={{ fontSize: 12, fontWeight: '700', color: activeTextColor, marginTop: 4 }}>
                                                        {order.branch?.name || order.customer?.name || 'Kingfood Partner'}
                                                    </Text>
                                                    <Text style={{ fontSize: 11, color: activeTextGrayColor, marginTop: 2 }}>
                                                        {isEn ? 'Total: ' : 'Tổng tiền: '}<Text style={{ fontWeight: '750', color: activeTextColor }}>{order.totalPrice ? order.totalPrice.toLocaleString() : '0'}đ</Text> · <Text style={{ fontWeight: '750', color: COLORS.primary }}>{order.orderDetails?.length || 0} SKU</Text>
                                                    </Text>
                                                </View>
                                                <TouchableOpacity 
                                                    style={{ 
                                                        backgroundColor: darkMode ? '#1e1e1e' : '#fff', 
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
                                                    <Text style={{ fontSize: 12, fontWeight: '750', color: COLORS.primary }}>{isEn ? 'Change' : 'Thay đổi'}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })()
                                                                ) : (
                                     // List Mode with Status Filters
                                     (() => {
                                         const filteredOrdersList = ordersList.filter(o => {
                                             if (modalOrderFilter === 'all') return true;
                                             return o.status === modalOrderFilter;
                                         });

                                         return (
                                             <View style={{ marginVertical: 8 }}>
                                                 {/* Status Filters segmented control */}
                                                 <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                                                     {[
                                                         { key: 'all', label: isEn ? 'All' : 'Tất cả', icon: 'list' },
                                                         { key: 'pending', label: isEn ? 'New' : 'Đơn mới', icon: 'time-outline', color: COLORS.success },
                                                         { key: 'processing', label: isEn ? 'Picking' : 'Đang soạn', icon: 'cube-outline', color: '#1565c0' },
                                                     ].map(tab => {
                                                         const isSelected = modalOrderFilter === tab.key;
                                                         const isPending = tab.key === 'pending';
                                                         const isProcessing = tab.key === 'processing';
                                                         const tabColor = isPending ? COLORS.success : (isProcessing ? '#1565c0' : COLORS.primary);
                                                         
                                                         return (
                                                             <TouchableOpacity
                                                                 key={tab.key}
                                                                 style={{
                                                                     flexDirection: 'row',
                                                                     alignItems: 'center',
                                                                     gap: 4,
                                                                     paddingHorizontal: 10,
                                                                     paddingVertical: 6,
                                                                     borderRadius: 20,
                                                                     borderWidth: 1.5,
                                                                     borderColor: isSelected ? tabColor : activeBorderColor,
                                                                     backgroundColor: isSelected 
                                                                         ? (darkMode ? (isPending ? '#14532d' : (isProcessing ? '#1e3a8a' : '#2d2d2d')) : (isPending ? '#e8f5e9' : (isProcessing ? '#e3f2fd' : COLORS.warningBg)))
                                                                         : activeCardBg,
                                                                 }}
                                                                 onPress={() => setModalOrderFilter(tab.key)}
                                                             >
                                                                 <Ionicons 
                                                                     name={tab.icon} 
                                                                     size={13} 
                                                                     color={isSelected ? (darkMode ? '#fff' : tabColor) : activeTextGrayColor} 
                                                                 />
                                                                 <Text style={{ 
                                                                     fontSize: 11, 
                                                                     fontWeight: '750', 
                                                                     color: isSelected ? (darkMode ? '#fff' : tabColor) : activeTextGrayColor 
                                                                 }}>
                                                                     {tab.label} ({ordersList.filter(o => tab.key === 'all' ? true : o.status === tab.key).length})
                                                                 </Text>
                                                             </TouchableOpacity>
                                                         );
                                                     })}
                                                 </View>

                                                 {filteredOrdersList.length > 0 ? (
                                                     <View style={{ borderWidth: 1.5, borderColor: activeBorderColor, borderRadius: 12, overflow: 'hidden', backgroundColor: activeCardBg }}>
                                                         {filteredOrdersList.map(order => (
                                                             <TouchableOpacity
                                                                 key={order.id}
                                                                 style={{
                                                                     padding: 14,
                                                                     borderBottomWidth: 1,
                                                                     borderBottomColor: activeBorderColor,
                                                                     backgroundColor: activeCardBg,
                                                                 }}
                                                                 onPress={() => handleSelectOrder(order.id)}
                                                             >
                                                                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                                         <Text style={{ fontWeight: '750', fontSize: 13, color: activeTextColor }}>
                                                                             {isEn ? `Order #${order.id}` : `Đơn hàng #${order.id}`}
                                                                         </Text>
                                                                         {order.status === 'pending' ? (
                                                                             <View style={{ backgroundColor: darkMode ? '#14532d' : '#e8f5e9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                                                                                 <Text style={{ fontSize: 9, fontWeight: '800', color: darkMode ? '#4ade80' : COLORS.success }}>{isEn ? 'New' : 'Đơn mới'}</Text>
                                                                             </View>
                                                                         ) : (
                                                                             <View style={{ backgroundColor: darkMode ? '#1e3a8a' : '#e3f2fd', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                                                                                 <Text style={{ fontSize: 9, fontWeight: '800', color: darkMode ? '#60a5fa' : '#1565c0' }}>{isEn ? 'Picking' : 'Đang soạn'}</Text>
                                                                             </View>
                                                                         )}
                                                                     </View>
                                                                     <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.primary }}>
                                                                         {order.totalPrice ? order.totalPrice.toLocaleString() : '0'}đ
                                                                     </Text>
                                                                 </View>
                                                                 <Text style={{ fontSize: 11, color: activeTextGrayColor, marginTop: 4 }}>
                                                                     {isEn ? 'Branch: ' : 'Chi nhánh: '}{order.branch?.name || order.customer?.name || 'Kingfood Partner'} · {order.orderDetails?.length || 0} SKU
                                                                 </Text>
                                                             </TouchableOpacity>
                                                         ))}
                                                     </View>
                                                 ) : (
                                                     <Text style={{ color: activeTextGrayColor, fontStyle: 'italic', marginVertical: 12 }}>
                                                         {modalOrderFilter === 'pending' 
                                                             ? (isEn ? 'No pending orders found.' : 'Không có đơn đặt hàng nào đang chờ xử lý.') 
                                                             : modalOrderFilter === 'processing' 
                                                                 ? (isEn ? 'No picking orders found.' : 'Không có đơn đặt hàng nào đang soạn hàng.') 
                                                                 : (isEn ? 'No pending or picking orders found.' : 'Không có đơn đặt hàng nào đang chờ xử lý hoặc đang soạn hàng.')
                                                         }
                                                     </Text>
                                                 )}
                                             </View>
                                         );
                                     })()
                                 )}

                                {/* 2. PHÂN TÁCH SẢN PHẨM & CHỌN PICKER */}
                                {selectedPickingOrderId ? (
                                    <View style={{ marginTop: 16 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <Text style={[styles.sectionTitle, { color: activeTextColor }]}>
                                                {isEn ? '2. Split products & Choose staff:' : '2. Phân chia sản phẩm & Chọn nhân viên:'}
                                            </Text>
                                            <View style={{ backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{isEn ? `Order #${selectedPickingOrderId}` : `Đơn #${selectedPickingOrderId}`}</Text>
                                            </View>
                                        </View>

                                        {/* Global Staff Search Bar */}
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: activeInputBg,
                                            borderRadius: 12,
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            marginBottom: 14,
                                            borderWidth: 1.5,
                                            borderColor: activeBorderColor,
                                            gap: 8
                                        }}>
                                            <Ionicons name="search" size={16} color={activeTextGrayColor} />
                                            <TextInput
                                                placeholder={isEn ? "Search staff by name or username..." : "Tìm tên nhân viên hoặc username..."}
                                                placeholderTextColor={darkMode ? '#6b7280' : "#94a3b8"}
                                                value={staffSearchQuery}
                                                onChangeText={setStaffSearchQuery}
                                                style={{
                                                    flex: 1,
                                                    fontSize: 13,
                                                    color: activeTextColor,
                                                    padding: 0,
                                                    height: 22
                                                }}
                                            />
                                            {staffSearchQuery ? (
                                                <TouchableOpacity onPress={() => setStaffSearchQuery('')}>
                                                    <Ionicons name="close-circle" size={18} color={activeTextGrayColor} />
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
                                                        borderColor: isChecked ? activeBorderColor : (darkMode ? '#2d2d2d' : '#eee'),
                                                        borderRadius: 14,
                                                        padding: 12,
                                                        marginBottom: 8,
                                                        backgroundColor: isChecked ? activeCardBg : (darkMode ? '#151515' : '#f9f9f9'),
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
                                                                color={isChecked ? COLORS.primary : (darkMode ? '#555' : '#aaa')} 
                                                            />
                                                        </TouchableOpacity>

                                                        <View style={{ flex: 1 }}>
                                                            <Text style={{ fontWeight: '700', fontSize: 13, color: activeTextColor }}>{product.name}</Text>
                                                            <Text style={{ fontSize: 11, color: activeTextGrayColor, marginTop: 2 }}>
                                                                SKU: {product.sku || `SKU-${product.id}`} · <Text style={{ fontWeight: '700', color: COLORS.primary }}>{product.category?.name || (isEn ? 'Shelf Zone' : 'Khu vực kệ')}</Text>
                                                            </Text>
                                                        </View>

                                                        <View style={{ alignItems: 'flex-end' }}>
                                                            <Text style={{ fontSize: 11, color: activeTextGrayColor }}>{isEn ? 'Required' : 'Yêu cầu'}</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: '800', color: activeTextColor }}>{item.quantity} {isEn ? (product.unit === 'cái' ? 'pcs' : product.unit) : (product.unit || 'cái')}</Text>
                                                        </View>
                                                    </View>

                                                    {/* Assignment Picker Row */}
                                                    {isChecked && (
                                                        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: activeBorderColor, paddingTop: 10 }}>
                                                            <Text style={{ fontSize: 11, fontWeight: '700', color: activeTextColor, marginBottom: 6 }}>{isEn ? 'Assigned Picker:' : 'Nhân viên Picker phụ trách:'}</Text>
                                                            
                                                            {(() => {
                                                                const filteredStaff = staffList.filter(s => {
                                                                    const q = (staffSearchQuery || '').toLowerCase().trim();
                                                                    if (!q) return true;
                                                                    return (s.name || '').toLowerCase().includes(q) || (s.username || '').toLowerCase().includes(q);
                                                                });

                                                                if (staffList.length === 0) {
                                                                    return <Text style={{ fontStyle: 'italic', color: '#ff9800', fontSize: 11, marginVertical: 4 }}>{isEn ? 'No pickers available' : 'Chưa có nhân viên Picker nào'}</Text>;
                                                                }

                                                                if (filteredStaff.length === 0) {
                                                                    return <Text style={{ fontStyle: 'italic', color: activeTextGrayColor, fontSize: 11, marginVertical: 4 }}>{isEn ? 'No matching staff found' : 'Không tìm thấy nhân viên phù hợp'}</Text>;
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
                                                                                        borderColor: isSelected ? COLORS.primary : (darkMode ? '#444' : '#ddd'),
                                                                                        backgroundColor: isSelected ? (darkMode ? '#451a1a' : COLORS.warningBg) : activeCardBg,
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
                                                                                    <Ionicons name="person" size={11} color={isSelected ? COLORS.primary : activeTextGrayColor} />
                                                                                    <Text style={{ fontSize: 12, fontWeight: isSelected ? '700' : '500', color: isSelected ? COLORS.primary : activeTextColor }}>
                                                                                        {staff.name || staff.username}
                                                                                    </Text>
                                                                                    
                                                                                    <Text style={{ 
                                                                                        fontSize: 9, 
                                                                                        fontWeight: '700', 
                                                                                        color: isFree ? COLORS.success : COLORS.error, 
                                                                                        backgroundColor: isFree ? (darkMode ? '#14532d' : COLORS.successBg) : (darkMode ? '#7f1d1d' : COLORS.errorBg), 
                                                                                        paddingHorizontal: 4, 
                                                                                        borderRadius: 4 
                                                                                    }}>
                                                                                        {isFree ? (isEn ? '🟢 Idle' : '🟢 Rảnh') : (isEn ? `🔴 Busy (${activeTasks})` : `🔴 Bận (${activeTasks})`)}
                                                                                    </Text>

                                                                                    {isZoneMatch && (
                                                                                        <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.primary, backgroundColor: darkMode ? '#7c2d12' : '#ffe5db', paddingHorizontal: 4, borderRadius: 4 }}>
                                                                                            {isEn ? 'Shelf Zone' : 'Khu vực Kệ'}
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
                                                                <Text style={{ fontSize: 11, fontWeight: '700', color: activeTextColor }}>{isEn ? 'Quantity to pick:' : 'Số lượng giao nhặt:'}</Text>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            setPickingAssignments(prev => ({
                                                                                ...prev,
                                                                                [productId]: { ...prev[productId], quantity: Math.max(1, parseInt(assignedQty) - 1) }
                                                                            }));
                                                                        }}
                                                                        style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: darkMode ? '#2d2d2d' : '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}
                                                                    >
                                                                        <Text style={{ fontWeight: '700', fontSize: 14, color: activeTextColor }}>−</Text>
                                                                    </TouchableOpacity>
                                                                    <Text style={{ fontSize: 13, fontWeight: '800', minWidth: 20, textAlign: 'center', color: activeTextColor }}>{assignedQty}</Text>
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            setPickingAssignments(prev => ({
                                                                                ...prev,
                                                                                [productId]: { ...prev[productId], quantity: Math.min(item.quantity, parseInt(assignedQty) + 1) }
                                                                            }));
                                                                        }}
                                                                        style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: darkMode ? '#2d2d2d' : '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}
                                                                    >
                                                                        <Text style={{ fontWeight: '700', fontSize: 14, color: activeTextColor }}>+</Text>
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
                                <View style={[styles.modalFooter, { backgroundColor: activeCardBg, borderTopColor: activeBorderColor }]}>
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
                                                <Text style={styles.btnText}>{isEn ? 'Activate & Send Wholesale Picking' : 'Kích hoạt & Gửi lệnh Picking sỉ'}</Text>
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
        width: 115,
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