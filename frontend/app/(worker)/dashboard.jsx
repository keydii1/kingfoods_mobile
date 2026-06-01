import { router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useState, useEffect, useCallback, useMemo } from 'react';
import StaffBottomNav from '../../components/StaffBottomNav';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { getAssignedTasks, getMyProfile, getCachedData } from '../../constants/services/api';

const cleanLocationName = (name) => {
    if (!name) return '';
    return name.replace(/^[🥦🥫🧴❄️\s]+/, '').replace(/^[^a-zA-Z0-9À-ỹđĐ\s]+/, '').trim();
};

const ZONE_MAP = {
    vi: {
        1: 'Thực phẩm tươi',
        2: 'Đồ khô & Gia vị',
        3: 'Hoá mỹ phẩm',
        4: 'Đồ đông lạnh'
    },
    en: {
        1: 'Fresh Food',
        2: 'Dry Goods & Spices',
        3: 'Cosmetics & Chemicals',
        4: 'Frozen Food'
    }
};

const TRANSLATIONS = {
    vi: {
        hello: 'Xin chào',
        staff: 'Nhân viên',
        unassignedZone: 'Chưa phân khu',
        shiftMorning: 'Ca Sáng',
        todayOrders: 'Đơn hôm nay',
        pendingProgress: 'Chờ & Đang làm',
        completed: 'Đã hoàn thành',
        todayList: 'Danh sách đơn hàng ngày hôm nay',
        emptyTasks: 'Hôm nay bạn chưa có đơn hàng nào được phân công',
        emptyTasksSub: 'Các đơn hàng được quản lý giao sẽ xuất hiện tại đây.',
        orderHash: 'Đơn hàng #',
        partner: 'Đối tác',
        sku: 'SKU',
        startPicking: 'Bắt đầu làm',
        loading: 'Đang tải dữ liệu...',
    },
    en: {
        hello: 'Hello',
        staff: 'Staff',
        unassignedZone: 'Unassigned Zone',
        shiftMorning: 'Morning Shift',
        todayOrders: "Today's Orders",
        pendingProgress: 'Pending & Picking',
        completed: 'Completed',
        todayList: "Today's Assigned Orders",
        emptyTasks: 'No tasks assigned to you today',
        emptyTasksSub: 'Assigned orders from managers will appear here.',
        orderHash: 'Order #',
        partner: 'Partner',
        sku: 'SKU',
        startPicking: 'Start Picking',
        loading: 'Loading data...',
    }
};

export default function DashboardScreen() {
    const navigation = useNavigation();
    const { userName, assignedZone } = useAuth();
    const { darkMode, language } = useAppPreferences();

    const activeBg = darkMode ? '#121212' : '#f6f9f6';
    const activeHeaderBg = darkMode ? '#1e1e1e' : COLORS.primary;
    const activeBorderColor = darkMode ? '#2d2d2d' : '#f0f2f0';
    const activeTextColor = darkMode ? '#f3f4f6' : '#222';
    const activeCardBg = darkMode ? '#1e1e1e' : '#fff';
    const activeTextGrayColor = darkMode ? '#9ca3af' : '#666';
    const activeBadgeBg = darkMode ? '#2d2d2d' : '#edf2f7';
    const activeTitleColor = darkMode ? '#cbd5e1' : '#2d3748';

    const t = TRANSLATIONS[language];
    
    const cachedProfile = getCachedData('/admin/users/me');
    const cachedTasks = getCachedData('/admin/picking/assigned');

    const initialTasks = useMemo(() => {
       const rawTasks = Array.isArray(cachedTasks) ? cachedTasks : [];
       const groups = {};
       rawTasks.forEach(task => {
           const orderId = task.orderDetail?.order?.id ?? task.orderId;
           if (!orderId) return;

           if (!groups[orderId]) {
               groups[orderId] = {
                   id: task.id,
                   orderId: orderId,
                   storeName: task.orderDetail?.order?.branch?.name || 'Kingfood Partner',
                   createdAt: task.createdAt,
                   tasks: []
               };
           }
           groups[orderId].tasks.push(task);
       });

       const mapped = Object.values(groups).map(group => {
           const orderTasks = group.tasks;
           const totalCount = orderTasks.length;
           const pickedCount = orderTasks.filter(t => t.status === 'completed').length;

           let status = 'pending';
           if (orderTasks.every(t => t.status === 'completed')) {
               status = 'completed';
           } else if (orderTasks.some(t => t.status === 'completed' || t.status === 'picking')) {
               status = 'in_progress';
           }

           return {
               id: group.id,
               orderId: group.orderId,
               storeName: group.storeName,
               totalCount,
               pickedCount,
               status,
               createdAt: group.createdAt
           };
       });

       const todayStr = new Date().toLocaleDateString('en-US');
       return mapped.filter(task => {
           if (!task.createdAt) return true;
           const taskDate = new Date(task.createdAt).toLocaleDateString('en-US');
           return taskDate === todayStr;
       });
    }, [cachedTasks]);

    const [tasks, setTasks] = useState(initialTasks);
    const [profile, setProfile] = useState(cachedProfile);
    const [loading, setLoading] = useState(!cachedProfile && initialTasks.length === 0);
    const [refreshing, setRefreshing] = useState(false);

    const loadTasks = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // 1. Fetch profile to get real assignedLocationId
            const profileRes = await getMyProfile().catch(() => null);
            if (profileRes) {
                setProfile(profileRes);
            }

            // 2. Fetch assigned tasks
            const res = await getAssignedTasks();
            const rawTasks = Array.isArray(res) ? res : [];

            // Group by Order ID to avoid duplicate order cards on dashboard!
            const groups = {};
            rawTasks.forEach(task => {
                const orderId = task.orderDetail?.order?.id ?? task.orderId;
                if (!orderId) return;

                if (!groups[orderId]) {
                     groups[orderId] = {
                         id: task.id, // pass first task ID so productlist.jsx can fetch the order group
                         orderId: orderId,
                         storeName: task.orderDetail?.order?.branch?.name || 'Kingfood Partner',
                         createdAt: task.createdAt,
                         tasks: []
                     };
                }
                groups[orderId].tasks.push(task);
            });

            // Map grouped orders to structure expected by UI
            const mapped = Object.values(groups).map(group => {
                const orderTasks = group.tasks;
                const totalCount = orderTasks.length; // total unique SKUs assigned to this picker for this order
                const pickedCount = orderTasks.filter(t => t.status === 'completed').length;

                // Determine consolidated order status
                let status = 'pending';
                if (orderTasks.every(t => t.status === 'completed')) {
                    status = 'completed';
                } else if (orderTasks.some(t => t.status === 'completed' || t.status === 'picking')) {
                    status = 'in_progress';
                }

                return {
                    id: group.id,
                    orderId: group.orderId,
                    storeName: group.storeName,
                    totalCount,
                    pickedCount,
                    status,
                    createdAt: group.createdAt
                };
            });

            // 3. Filter for TODAY's tasks only
            const todayStr = new Date().toLocaleDateString('en-US'); // e.g. "5/20/2026"
            const todayTasks = mapped.filter(task => {
                if (!task.createdAt) return true; // fallback
                const taskDate = new Date(task.createdAt).toLocaleDateString('en-US');
                return taskDate === todayStr;
            });

            setTasks(todayTasks);
        } catch (err) {
            if (!silent) {
                // Fallback / mock data for today if service fails
                setTasks([
                    { id: '1', orderId: 'MOCK-001', storeName: 'KingFood 91 Võ Văn Kiệt', totalCount: 7, pickedCount: 7, status: 'completed', createdAt: new Date() },
                    { id: '2', orderId: 'MOCK-002', storeName: 'KingFood 323 Huỳnh Tấn Phát', totalCount: 5, pickedCount: 2, status: 'in_progress', createdAt: new Date() },
                ]);
            }
        } finally {
            if (!silent) setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadTasks();
        const unsub = navigation.addListener('focus', () => loadTasks(true));
        return unsub;
    }, [navigation, loadTasks]);

    // Calculate % progress
    const getPct = (task) => {
        if (!task.totalCount) return 0;
        return Math.round((task.pickedCount / task.totalCount) * 100);
    };

    // Helper: status styles
    const getStatusTheme = (status) => {
        if (status === 'completed') {
            return {
                bg: darkMode ? 'rgba(46, 125, 50, 0.15)' : '#e8f5e9',
                text: darkMode ? '#81c784' : '#2e7d32',
                label: language === 'vi' ? 'Hoàn thành' : 'Completed'
            };
        }
        if (status === 'in_progress') {
            return {
                bg: darkMode ? 'rgba(239, 108, 0, 0.15)' : '#fff3e0',
                text: darkMode ? '#ffb74d' : '#ef6c00',
                label: language === 'vi' ? 'Đang làm' : 'In Progress'
            };
        }
        return {
            bg: darkMode ? 'rgba(97, 97, 97, 0.15)' : '#f5f5f5',
            text: darkMode ? '#cbd5e1' : '#616161',
            label: language === 'vi' ? 'Chờ xử lý' : 'Pending'
        };
    };

    // Progress color by percentage
    const getProgressColor = (pct) => {
        if (pct < 25) return '#e53935';
        if (pct < 50) return '#fb8c00';
        if (pct < 75) return '#fdd835';
        return '#43a047';
    };

    // Calculate KPIs
    const totalToday = tasks.length;
    const completedToday = tasks.filter(t => t.status === 'completed').length;
    const pendingToday = totalToday - completedToday;

    const displayZone = profile?.assignedLocationId ? ZONE_MAP[language][profile.assignedLocationId] : (assignedZone || t.unassignedZone);

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={COLORS.primary} size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg }]}>
            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTasks(true)} tintColor={COLORS.primary} />}
            >
                {/* Stunning Gradient-like Header Banner */}
                <View style={[styles.banner, darkMode && { backgroundColor: '#1e1e1e', shadowColor: '#000' }]}>
                    <View style={styles.bannerTop}>
                        <View style={styles.profileSection}>
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarInitial}>
                                    {(userName || 'NV').substring(0, 2).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.greeting}>{t.hello}</Text>
                                <Text style={styles.name}>{userName || t.staff}</Text>
                                <View style={styles.zoneBadge}>
                                    <Ionicons name="location-sharp" size={12} color="#fff" />
                                    <Text style={styles.zoneText}>{displayZone}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.shiftTime}>
                            <View style={[styles.shiftBadge, darkMode && { backgroundColor: '#2d2d2d' }]}>
                                <Ionicons name="time-outline" size={12} color={COLORS.primary} />
                                <Text style={[styles.shiftLabel, darkMode && { color: '#ffb74d' }]}>{t.shiftMorning}</Text>
                            </View>
                            <Text style={[styles.shiftValue, darkMode && { color: '#cbd5e1' }]}>08:00–16:00</Text>
                        </View>
                    </View>

                    {/* KPI Widget Cards */}
                    <View style={styles.kpiContainer}>
                        <View style={[styles.kpiCard, { backgroundColor: activeCardBg }]}>
                            <View style={[styles.kpiIconBg, { backgroundColor: darkMode ? '#1c2d42' : '#e3f2fd' }]}>
                                <Ionicons name="clipboard-outline" size={20} color="#1565c0" />
                            </View>
                            <Text style={[styles.kpiValue, { color: activeTextColor }]}>{totalToday}</Text>
                            <Text style={[styles.kpiLabel, { color: activeTextGrayColor }]}>{t.todayOrders}</Text>
                        </View>

                        <View style={[styles.kpiCard, { backgroundColor: activeCardBg }]}>
                            <View style={[styles.kpiIconBg, { backgroundColor: darkMode ? '#4a3219' : '#fff3e0' }]}>
                                <Ionicons name="hourglass-outline" size={20} color="#ef6c00" />
                            </View>
                            <Text style={[styles.kpiValue, { color: activeTextColor }]}>{pendingToday}</Text>
                            <Text style={[styles.kpiLabel, { color: activeTextGrayColor }]}>{t.pendingProgress}</Text>
                        </View>

                        <View style={[styles.kpiCard, { backgroundColor: activeCardBg }]}>
                            <View style={[styles.kpiIconBg, { backgroundColor: darkMode ? '#1d3e24' : '#e8f5e9' }]}>
                                <Ionicons name="checkmark-done-sharp" size={20} color="#2e7d32" />
                            </View>
                            <Text style={[styles.kpiValue, { color: activeTextColor }]}>{completedToday}</Text>
                            <Text style={[styles.kpiLabel, { color: activeTextGrayColor }]}>{t.completed}</Text>
                        </View>
                    </View>
                </View>

                {/* Main List Section */}
                <View style={styles.mainContent}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: activeTitleColor }]}>{t.todayList}</Text>
                        <View style={[styles.dateTag, { backgroundColor: activeBadgeBg }]}>
                            <Text style={[styles.dateTagText, { color: activeTextColor }]}>
                                {new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' })}
                            </Text>
                        </View>
                    </View>

                    {tasks.length === 0 ? (
                        <View style={[styles.emptyCard, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]}>
                            <Ionicons name="sparkles-outline" size={48} color={darkMode ? '#444' : '#ccc'} style={{ marginBottom: 12 }} />
                            <Text style={[styles.emptyText, { color: activeTextColor }]}>{t.emptyTasks}</Text>
                            <Text style={[styles.emptySub, { color: activeTextGrayColor }]}>{t.emptyTasksSub}</Text>
                        </View>
                    ) : (
                        tasks.map((task, index) => {
                            const statusTheme = getStatusTheme(task.status);
                            const progressPercent = getPct(task);
                            return (
                                <TouchableOpacity
                                    key={task.id || index}
                                    style={[styles.orderCard, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]}
                                    activeOpacity={0.9}
                                    onPress={() => router.push({
                                        pathname: '/(worker)/productlist',
                                        params: { taskId: task.id || task.orderId }
                                    })}
                                >
                                    <View style={styles.orderHead}>
                                        <View style={styles.orderTitleRow}>
                                            <View style={[styles.orderIconBg, darkMode && { backgroundColor: '#2d2d2d' }]}>
                                                <Ionicons name="receipt" size={18} color={COLORS.primary} />
                                            </View>
                                            <View>
                                                <Text style={[styles.orderId, { color: activeTextColor }]}>{t.orderHash}{task.orderId}</Text>
                                                <View style={styles.storeRow}>
                                                    <Ionicons name="business" size={13} color={activeTextGrayColor} />
                                                    <Text style={[styles.orderStore, { color: activeTextGrayColor }]}>{task.storeName}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={[styles.statusTag, { backgroundColor: statusTheme.bg }]}>
                                            <Text style={[styles.statusText, { color: statusTheme.text }]}>
                                                {statusTheme.label}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.orderDivider, { backgroundColor: activeBorderColor }]} />

                                    <View style={styles.orderFooter}>
                                        <View style={[styles.skuBadge, { backgroundColor: activeBadgeBg }]}>
                                            <Text style={[styles.skuText, { color: activeTextColor }]}>
                                                {task.pickedCount}/{task.totalCount} {t.sku}
                                            </Text>
                                        </View>
                                        <View style={styles.progressBarContainer}>
                                            <View style={[styles.progressBar, { backgroundColor: activeBadgeBg }]}>
                                                <View style={[
                                                    styles.progressFill,
                                                    {
                                                        width: `${progressPercent}%`,
                                                        backgroundColor: getProgressColor(progressPercent)
                                                    }
                                                ]} />
                                            </View>
                                            <Text style={[styles.pctText, { color: getProgressColor(progressPercent) }]}>
                                                {progressPercent}%
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Action indicator */}
                                    <View style={[styles.actionArrow, { borderTopColor: activeBorderColor }]}>
                                        <Text style={styles.actionText}>{t.startPicking}</Text>
                                        <Ionicons name="chevron-forward-outline" size={14} color={COLORS.primary} />
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>
            <StaffBottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f6f9f6',
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    banner: {
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        padding: 24,
        paddingBottom: 32,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
    },
    bannerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarInitial: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    profileInfo: {
        justifyContent: 'center',
    },
    greeting: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '500',
    },
    name: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        marginTop: 1,
    },
    zoneBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        marginTop: 6,
        alignSelf: 'flex-start',
    },
    zoneText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    shiftTime: {
        alignItems: 'flex-end',
    },
    shiftBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        marginBottom: 4,
    },
    shiftLabel: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: '700',
    },
    shiftValue: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '600',
    },
    kpiContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    kpiCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    kpiIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    kpiValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#222',
    },
    kpiLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: '#888',
        marginTop: 2,
        textAlign: 'center',
    },
    mainContent: {
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
        fontWeight: '800',
        color: '#2d3748',
    },
    dateTag: {
        backgroundColor: '#edf2f7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    dateTagText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4a5568',
    },
    loadingBox: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 13,
    },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
        marginTop: 10,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4a5568',
        textAlign: 'center',
        marginBottom: 6,
    },
    emptySub: {
        fontSize: 12,
        color: '#a0aec0',
        textAlign: 'center',
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f2f0',
    },
    orderHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    orderTitleRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    orderIconBg: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#e8f5e9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    orderId: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1a202c',
    },
    storeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 3,
    },
    orderStore: {
        fontSize: 12,
        color: '#718096',
        fontWeight: '500',
    },
    statusTag: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    orderDivider: {
        height: 1,
        backgroundColor: '#f7fafc',
        marginVertical: 14,
    },
    orderFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    skuBadge: {
        backgroundColor: '#edf2f7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    skuText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4a5568',
    },
    progressBarContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 12,
    },
    progressBar: {
        flex: 1,
        height: 7,
        backgroundColor: '#edf2f7',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    pctText: {
        fontSize: 11,
        fontWeight: '800',
        width: 40,
        textAlign: 'right',
    },
    actionArrow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 2,
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f7fafc',
        paddingTop: 8,
    },
    actionText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.primary,
    },
});