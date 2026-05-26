import {Text, View, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput} from 'react-native';
import { Alert } from '../../utils/appAlert';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {useState, useEffect} from 'react';
import {Ionicons} from '@expo/vector-icons';
import {getUsers, updateUser, deleteUser, getLocations, getDashboardStatus, getCachedData} from '../../constants/services/api'
import {COLORS} from '../../constants/colors';
import ManagerBottomNav from '../../components/ManagerBottomNav';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

// MockData 2 khu vực
const teams = [
    {
        zone: 'Khu Bánh & Kẹo',
        icon: 'rose-outline',
        members: [
            {
                id: '1', initials: 'LN', avatarColor: '#e8f5e9',
                avatarText: COLORS.primary,
                name: 'Trần Thị Lan',
                order: 'Đang làm #KF-12345 · 45/52 sp',
                sku: 72, skuColor: COLORS.primary, status: 'good',
            },
            {
                id: '2', initials: 'TM', avatarColor: '#fff3e0',
                avatarText: '#e65100',
                name: 'Phạm Thị Mai',
                order: 'Đang làm #KF-12346 · 20/38 sp',
                sku: 43, skuColor: COLORS.error, status: 'warn',
            },
            {
                id: '3', initials: 'ĐN', avatarColor: '#f3e5f5',
                avatarText: '#7b1fa2',
                name: 'Hoàng Văn Đức',
                order: 'Nghỉ giải lao · Trở lại 15:30',
                sku: null, skuColor: '#aaa', status: 'break',
            },
        ],
    },
    {
        zone: 'Khu Đồ Uống',
        icon: 'wine-outline',
        members: [
            {
                id: '4', initials: 'VS', avatarColor: '#e3f2fd',
                avatarText: '#1565c0',
                name: 'Nguyễn Văn Sơn',
                order: 'Đang làm #KF-12347 · 38/40 sp',
                sku: 61, skuColor: COLORS.primary, status: 'good',
            },
            {
                id: '5', initials: 'MT', avatarColor: '#e8f5e9',
                avatarText: COLORS.primary,
                name: 'Lê Minh Tùng',
                order: 'Hoàn thành #KF-12348',
                sku: 55, skuColor: COLORS.primary, status: 'good',
            },
        ],
    },
];

// Component dành cho 1 thành viên - Premium Card Redesign
function MemberRow({member, onEdit, onDelete}){
    const { language, darkMode } = useAppPreferences();
    const isEn = language === 'en';

    const activeCardBg = darkMode ? '#1e1e1e' : '#fff';
    const activeBorderColor = darkMode ? '#2d2d2d' : '#e2e8f0';
    const activeTextColor = darkMode ? '#f3f4f6' : '#1e293b';
    const activeTextGrayColor = darkMode ? '#9ca3af' : '#64748b';
    const activeBtnBg = darkMode ? '#2d2d2d' : '#f1f5f9';
    const activeDeleteBtnBg = darkMode ? '#451a1a' : '#fee2e2';

    // Phân tích trạng thái để hiển thị badge và màu sắc
    let statusLabel = '';
    let statusBg = darkMode ? '#1a202c' : '#f1f5f9';
    let statusColor = darkMode ? '#cbd5e1' : '#64748b';
    let dotColor = '#94a3b8';

    if (member.order) {
        // Dành cho Mock Data hoặc fallback
        statusLabel = member.order;
        if (member.status === 'good') {
            statusBg = darkMode ? '#14532d' : '#f0fdf4';
            statusColor = darkMode ? '#4ade80' : '#166534';
            dotColor = '#22c55e';
        } else if (member.status === 'warn') {
            statusBg = darkMode ? '#7c2d12' : '#fff7ed';
            statusColor = darkMode ? '#fb923c' : '#9a3412';
            dotColor = '#f97316';
        } else if (member.status === 'break') {
            statusBg = darkMode ? '#7f1d1d' : '#fef2f2';
            statusColor = darkMode ? '#f87171' : '#991b1b';
            dotColor = '#ef4444';
        }
    } else {
        // Dành cho dữ liệu thật từ API
        if (member.role !== 'staff') {
            statusLabel = isEn ? 'Manager' : 'Quản lý';
            statusBg = darkMode ? '#1e3a8a' : '#eff6ff';
            statusColor = darkMode ? '#60a5fa' : '#1d4ed8';
            dotColor = '#3b82f6';
        } else if (member.isActiveTask) {
            statusLabel = isEn ? `Working (${member.activeTasks} tasks)` : `Đang làm (${member.activeTasks} đơn)`;
            statusBg = darkMode ? '#7c2d12' : '#fff7ed';
            statusColor = darkMode ? '#fb923c' : '#c2410c';
            dotColor = '#f97316';
        } else {
            statusLabel = isEn ? 'Idle' : 'Đang rảnh';
            statusBg = darkMode ? '#14532d' : '#f0fdf4';
            statusColor = darkMode ? '#4ade80' : '#166534';
            dotColor = '#22c55e';
        }
    }

    return (
        <View style={[styles.memberCard, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]}>
            {/* Header của card: Avatar, Tên, Role & Nút hành động */}
            <View style={[styles.cardHeader, { borderBottomColor: darkMode ? '#2d2d2d' : '#f1f5f9' }]}>
                <View style={styles.headerLeft}>
                    <View style={[styles.avatar, { backgroundColor: member.avatarColor || (darkMode ? '#2d2d2d' : '#e2e8f0') }]}>
                        <Text style={[styles.avatarText, { color: member.avatarText || (darkMode ? '#3b82f6' : '#475569') }]}>
                            {member.initials}
                        </Text>
                    </View>
                    <View style={styles.nameContainer}>
                        <Text style={[styles.memberName, { color: activeTextColor }]} numberOfLines={1}>{member.name}</Text>
                        <Text style={[styles.roleBadge, { 
                            backgroundColor: member.role === 'staff' ? (darkMode ? '#14532d' : '#f0fdf4') : (darkMode ? '#1e3a8a' : '#eff6ff'),
                            color: member.role === 'staff' ? (darkMode ? '#4ade80' : COLORS.primary) : (darkMode ? '#60a5fa' : '#2563eb')
                        }]}>
                            {member.role === 'staff' ? (isEn ? 'Warehouse Picker' : 'Nhân viên kho') : (isEn ? 'Manager' : 'Quản lý')}
                        </Text>
                    </View>
                </View>

                {/* Các nút hành động góc trên bên phải rộng rãi */}
                <View style={styles.actionGroup}>
                    {onEdit && (
                        <TouchableOpacity onPress={onEdit} style={[styles.actionButton, { backgroundColor: activeBtnBg }]} activeOpacity={0.7}>
                            <Ionicons name="create" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity onPress={onDelete} style={[styles.actionButton, styles.deleteBtn, { backgroundColor: activeDeleteBtnBg }]} activeOpacity={0.7}>
                            <Ionicons name="trash" size={16} color={COLORS.error} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Body của card: Badge Trạng thái, Phân công & KPI */}
            <View style={styles.cardBody}>
                <View style={styles.bodyLeft}>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1}>
                            {statusLabel}
                        </Text>
                    </View>

                    {member.location ? (
                        <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={13} color={activeTextGrayColor} style={{ marginRight: 3 }} />
                            <Text style={[styles.locationText, { color: activeTextGrayColor }]} numberOfLines={1}>
                                {member.location}
                            </Text>
                        </View>
                    ) : null}
                </View>

                {/* Stats năng suất bên phải */}
                <View style={styles.kpiContainer}>
                    <Text style={[styles.kpiValue, { color: member.skuColor || COLORS.primary }]}>
                        {member.sku !== null && member.sku !== undefined ? member.sku : '-'}
                    </Text>
                    <Text style={[styles.kpiUnit, { color: activeTextGrayColor }]}>
                        {member.status === 'break' ? (isEn ? 'Break' : 'Nghỉ') : (isEn ? 'pcs/hr' : 'sp/giờ')}
                    </Text>
                </View>
            </View>
        </View>
    );
}

export default function TeamScreen(){
    const cachedUsers = getCachedData('/admin/users');
    const cachedLocations = getCachedData('/admin/locations?limit=1000');
    const cachedStats = getCachedData('/admin/dashboard/stats');

    const [users, setUsers] = useState(cachedUsers || []);
    const [locations, setLocations] = useState(cachedLocations?.data || cachedLocations?.items || cachedLocations || []);
    const [performance, setPerformance] = useState(cachedStats?.staffPerformance || []);
    const [loading, setLoading] = useState(!cachedUsers || !cachedLocations);
    const [editingUser, setEditingUser] = useState(null);
    const [editName, setEditName] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'working', 'idle'

    const { language, darkMode } = useAppPreferences();
    const isEn = language === 'en';

    const activeBg = darkMode ? '#121212' : '#f0f4f1';
    const activeHeaderBg = darkMode ? '#1e1e1e' : '#fff';
    const activeBorderColor = darkMode ? '#2d2d2d' : '#eee';
    const activeTextColor = darkMode ? '#f3f4f6' : '#222';

    useEffect(() => {
        async function fetchTeamData(){
            try{
                const [usersRes, locationsRes, statsRes] = await Promise.all([
                    getUsers(),
                    getLocations(),
                    getDashboardStatus()
                ]);
                console.log("[DEBUG TEAM] usersRes type/length:", Array.isArray(usersRes), usersRes?.length);
                console.log("[DEBUG TEAM] locationsRes keys:", Object.keys(locationsRes || {}));
                console.log("[DEBUG TEAM] statsRes performance count:", statsRes?.staffPerformance?.length);
                
                setUsers(Array.isArray(usersRes) ? usersRes : []);
                setLocations(locationsRes?.data || locationsRes?.items || locationsRes || []);
                setPerformance(statsRes?.staffPerformance || []);
            }
            catch(err){
                console.warn("[CRITICAL ERROR IN TEAM.JSX FETCH]:", err);
            }
            finally {
                setLoading(false);
            }
        }
        fetchTeamData();
    }, []);

    const handleEditUser = (user) => {
        setEditingUser(user);
        setEditName(user.name || user.fullName || user.username || '');
    };

    const confirmEditUser = async () => {
        if (!editingUser) return;
        try {
            const updated = await updateUser(editingUser._id || editingUser.id, { name: editName });
            setUsers(prev => prev.map(u => (u._id || u.id) === (editingUser._id || editingUser.id) ? { ...u, name: editName, fullName: editName } : u));
            setEditingUser(null);
            Alert.alert(isEn ? 'Success' : 'Thành công', isEn ? 'Information updated successfully' : 'Cập nhật thông tin thành công');
        } catch {
            Alert.alert(isEn ? 'Error' : 'Lỗi', isEn ? 'Failed to update information' : 'Không thể cập nhật thông tin');
        }
    };

    const handleDeleteUser = (user) => {
        Alert.alert(
            isEn ? 'Delete Staff' : 'Xoá nhân viên',
            isEn ? `Delete "${user.name || user.fullName || user.username}"?` : `Xoá "${user.name || user.fullName || user.username}"?`,
            [
                { text: isEn ? 'Cancel' : 'Huỷ', style: 'cancel' },
                { text: isEn ? 'Delete' : 'Xoá', style: 'destructive', onPress: async () => {
                    try {
                        await deleteUser(user._id || user.id);
                        setUsers(prev => prev.filter(u => (u._id || u.id) !== (user._id || user.id)));
                    } catch {
                        Alert.alert(isEn ? 'Error' : 'Lỗi', isEn ? 'Failed to delete staff' : 'Không thể xoá nhân viên');
                    }
                }},
            ]
        );
    };

    // Location mapping
    const locMap = {};
    locations.forEach(loc => {
        locMap[loc.id] = loc.name;
    });

    // Performance mapping
    const perfMap = {};
    performance.forEach(p => {
        perfMap[p.staffId] = p;
    });

    const activeStats = users.length > 0
      ? {
          totalActive: performance.filter(p => p.totalItemsPicked > 0).length,
          totalSKU: Math.round(performance.reduce((s, p) => s + (p.pickingSpeed || 0), 0) * 10) / 10,
          zoneDetails: '',
        }
      : teams.reduce((acc, t) => {
          const active = t.members.filter(m => m.status !== 'break');
          acc.totalActive += active.length;
          acc.totalSKU += active.reduce((s, m) => s + (m.sku || 0), 0);
          acc.zoneDetails += `${t.zone.split(' ').slice(1).join(' ')}: ${active.length} · `;
          return acc;
        }, { totalActive: 0, totalSKU: 0, zoneDetails: '' });

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={COLORS.primary} size="large" />
            </SafeAreaView>
        );
    }

    return(
        <SafeAreaView style = {[styles.safeArea, { backgroundColor: activeBg }]}>
            {/* Header */}
            <View style = {[styles.header, { backgroundColor: activeHeaderBg, borderBottomColor: activeBorderColor }]}>
                <View style = {{ width: 80 }} />
                <Text style = {[styles.headerTitle, { color: activeTextColor }]}>Team Overview</Text>
                <View style = {[styles.badge, { backgroundColor: darkMode ? '#1e293b' : '#e3f2fd' }]}>
                    <Text style = {[styles.badgeText, { color: darkMode ? '#60a5fa' : '#1565c0' }]}>{isEn ? 'Team Lead' : 'Trưởng nhóm'}</Text>
                </View>
            </View>
            {/* Body */}
            <ScrollView style = {styles.scroll}>
                {/* Alert tổng quan */}
                <View style = {[styles.alert, darkMode && { backgroundColor: '#1e293b', borderLeftColor: '#3b82f6', borderLeftWidth: 4 }]}>
                    <Ionicons name="people-outline" size={24} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <View style = {styles.alertBody}>
                        <Text style = {[styles.alertTitle, darkMode && { color: '#60a5fa' }]}>
                            {isEn ? `${activeStats.totalActive} staff active` : `${activeStats.totalActive} nhân viên vẫn còn đang hoạt động`}
                        </Text>
                        <Text style = {[styles.alertSub, { color: darkMode ? '#cbd5e1' : '#555' }]}>
                            {activeStats.zoneDetails}{isEn ? `Total productivity: ${activeStats.totalSKU} pcs/hr` : `Tổng năng suất: ${activeStats.totalSKU} sp/giờ`}
                        </Text>
                    </View>
                </View>
                {/* Filter Row */}
                {users.length > 0 && (
                    <View style={styles.filterRow}>
                        <TouchableOpacity
                             style={[
                                 styles.filterBtn, 
                                 { backgroundColor: darkMode ? '#1e1e1e' : '#fff', borderColor: darkMode ? '#2d2d2d' : '#e2e8f0' },
                                 activeFilter === 'all' && styles.filterBtnActive
                             ]}
                             onPress={() => setActiveFilter('all')}
                         >
                             <Text style={[styles.filterText, { color: darkMode ? '#9ca3af' : '#64748b' }, activeFilter === 'all' && styles.filterTextActive]}>
                                 {isEn ? 'All' : 'Tất cả'} ({users.length})
                             </Text>
                         </TouchableOpacity>
                         <TouchableOpacity
                             style={[
                                 styles.filterBtn, 
                                 { backgroundColor: darkMode ? '#1e1e1e' : '#fff', borderColor: darkMode ? '#2d2d2d' : '#e2e8f0' },
                                 activeFilter === 'working' && styles.filterBtnActive
                             ]}
                             onPress={() => setActiveFilter('working')}
                         >
                             <Text style={[styles.filterText, { color: darkMode ? '#9ca3af' : '#64748b' }, activeFilter === 'working' && styles.filterTextActive]}>
                                 {isEn ? 'Active' : 'Đang làm'} ({users.filter(u => (u.activePickingTasksCount || 0) > 0).length})
                             </Text>
                         </TouchableOpacity>
                         <TouchableOpacity
                             style={[
                                 styles.filterBtn, 
                                 { backgroundColor: darkMode ? '#1e1e1e' : '#fff', borderColor: darkMode ? '#2d2d2d' : '#e2e8f0' },
                                 activeFilter === 'idle' && styles.filterBtnActive
                             ]}
                             onPress={() => setActiveFilter('idle')}
                         >
                             <Text style={[styles.filterText, { color: darkMode ? '#9ca3af' : '#64748b' }, activeFilter === 'idle' && styles.filterTextActive]}>
                                 {isEn ? 'Idle' : 'Đang rảnh'} ({users.filter(u => (u.activePickingTasksCount || 0) === 0).length})
                             </Text>
                         </TouchableOpacity>
                     </View>
                 )}

                {/* Danh sách từng khu vực */}
                {
                users.length > 0 ? (
                    users.filter(user => {
                        if (activeFilter === 'working') return (user.activePickingTasksCount || 0) > 0;
                        if (activeFilter === 'idle') return (user.activePickingTasksCount || 0) === 0;
                        return true;
                    }).map(user =>{
                        const perf = perfMap[user.id] || {};
                        const locName = locMap[user.assignedLocationId] || (isEn ? 'Unassigned' : 'Chưa phân công');
                        return (
                            <MemberRow
                                key = {user._id || user.id}
                                member = {{
                                    id: user._id || user.id,
                                    initials: (user.name || user.fullName || user.username || 'NV').split(' ').map(w => w[0]).slice(-2).join('').toUpperCase(),
                                    avatarColor: user.role === 'staff' ? '#f0fdf4' : '#eff6ff',
                                    avatarText: user.role === 'staff' ? COLORS.primary : '#3b82f6',
                                    name: user.name || user.fullName || user.username,
                                    role: user.role,
                                    isActiveTask: user.role === 'staff' ? (user.activePickingTasksCount || 0) > 0 : false,
                                    activeTasks: user.activePickingTasksCount || 0,
                                    location: locName,
                                    sku: perf.pickingSpeed !== undefined ? perf.pickingSpeed : null,
                                    skuColor: perf.warning ? COLORS.error : COLORS.primary,
                                    status: perf.totalItemsPicked > 0 ? 'good' : (perf.pickingSpeed !== undefined ? 'warn' : 'offline'),
                                }}
                                onEdit={() => handleEditUser(user)}
                                onDelete={() => handleDeleteUser(user)}
                            />
                        );
                    })
                ):
            teams.map((team) => (
                <View key = {team.zone} style = {styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <Ionicons name={team.icon} size={18} color={COLORS.primary} />
                        <Text style = {styles.cardTitle}>
                            {isEn 
                                ? (team.zone === 'Khu Bánh & Kẹo' ? 'Bakery & Sweets Zone' : team.zone === 'Khu Đồ Uống' ? 'Beverages Zone' : team.zone) 
                                : team.zone
                            }
                        </Text>
                    </View>
                    {team.members.map((member) => (
                        <MemberRow 
                            key = {member.id || member._id} 
                            member ={{
                                ...member,
                                order: member.order ? (
                                    isEn 
                                        ? member.order
                                            .replace('Đang làm', 'Working')
                                            .replace('sp', 'pcs')
                                            .replace('Nghỉ giải lao · Trở lại', 'On break · Back at')
                                            .replace('Hoàn thành', 'Completed')
                                        : member.order
                                ) : undefined
                            }}
                        />
                    ))}
                </View>
            ))}
            </ScrollView>

            {/* Bottom navigation bar */}
            <ManagerBottomNav active="team" />

            {editingUser && (
                <View style={styles.overlay}>
                    <View style={styles.editModal}>
                        <Text style={styles.editModalTitle}>{isEn ? 'Edit Staff Name' : 'Sửa tên nhân viên'}</Text>
                        <TextInput
                            style={styles.editInput}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder={isEn ? "Enter new name" : "Nhập tên mới"}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <View style={styles.editActions}>
                            <TouchableOpacity style={styles.editCancelBtn} onPress={() => setEditingUser(null)}>
                                <Text style={styles.editCancelText}>{isEn ? 'Cancel' : 'Huỷ'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.editSaveBtn} onPress={confirmEditUser}>
                                <Text style={styles.editSaveText}>{isEn ? 'Save' : 'Lưu'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f4f1',
    },

    // Header
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
    badge: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        color: '#1565c0',
        fontSize: 12,
        fontWeight: '600',
    },

    scroll: { flex: 1, padding: 16 },

    // Alert
    alert: {
        flexDirection: 'row',
        backgroundColor: COLORS.successBg,
        borderRadius: 14,
        padding: 14,
        gap: 10,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.accent,
    },
    alertIcon: { fontSize: 24 },
    alertBody: { flex: 1 },
    alertTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 4,
    },
    alertSub: {
        fontSize: 12,
        color: '#555',
        lineHeight: 18,
    },

    // Card khu vực
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#222',
        marginBottom: 12,
    },

    // Premium Member Card Styles
    memberCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    avatarText: {
        fontSize: 15,
        fontWeight: '800',
    },
    nameContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    memberName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 2,
    },
    roleBadge: {
        fontSize: 10,
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    actionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteBtn: {
        backgroundColor: '#fee2e2',
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    bodyLeft: {
        flex: 1,
        gap: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    kpiContainer: {
        alignItems: 'flex-end',
    },
    kpiValue: {
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 26,
    },
    kpiUnit: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '600',
        marginTop: 1,
    },

    // Edit modal
    overlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center', alignItems: 'center',
    },
    editModal: {
        backgroundColor: '#fff', borderRadius: 16, padding: 24,
        width: '80%', maxWidth: 320,
    },
    editModalTitle: {
        fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 16,
    },
    editInput: {
        borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
        padding: 12, fontSize: 14, marginBottom: 16,
    },
    editActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
    editCancelBtn: {
        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
        backgroundColor: '#f5f5f5',
    },
    editCancelText: { fontSize: 14, fontWeight: '600', color: '#666' },
    editSaveBtn: {
        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
        backgroundColor: COLORS.primary,
    },
    editSaveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  filterRow: {
    flexDirection: 'row',
    paddingBottom: 14,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#fff',
  },
});