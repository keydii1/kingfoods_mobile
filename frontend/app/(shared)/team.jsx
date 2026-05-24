import {Text, View, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput} from 'react-native';
import { Alert } from '../../utils/appAlert';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {useState, useEffect} from 'react';
import {Ionicons} from '@expo/vector-icons';
import {getUsers, updateUser, deleteUser, getLocations, getDashboardStatus} from '../../constants/services/api'
import {COLORS} from '../../constants/colors';

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

// Component dành cho 1 thành viên 
function MemberRow({member, onEdit, onDelete}){
    return(
    <View style = {styles.memberRow}>
        {/* Avatar chữ viết tắt */}
        <View style = {[styles.avatar, {backgroundColor: member.avatarColor}]}>
            <Text style = {[styles.avatarText, {color: member.avatarText}]}>{member.initials}</Text>
        </View>
        {/* Tên và đơn hàng */}
        <View style = {styles.memberInfo}>
            <Text style = {styles.memberName}>{member.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                {member.status === 'warn' && <Ionicons name="warning" size={12} color="#e65100" />}
                {member.status === 'good' && <Ionicons name="checkmark-circle" size={12} color={COLORS.primary} />}
                <Text style = {styles.memberOrder}>{member.order}</Text>
            </View>
        </View>
        {/* SKU/h */}
        <View style = {styles.memberSku}>
            <Text style= {[styles.skuValue, {color: member.skuColor}]}>{member.sku ?? '-'}</Text>
            <Text style = {styles.skuUnit}>{member.status === 'break' ? 'Nghỉ': 'sp/giờ'}</Text>
        </View>
        {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.memberAction}>
                <Ionicons name="create-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
        )}
        {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.memberAction}>
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
        )}
    </View>
    );
}

export default function TeamScreen(){
    const [users, setUsers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [editName, setEditName] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'working', 'idle'

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
            Alert.alert('Thành công', 'Cập nhật thông tin thành công');
        } catch {
            Alert.alert('Lỗi', 'Không thể cập nhật thông tin');
        }
    };

    const handleDeleteUser = (user) => {
        Alert.alert(
            'Xoá nhân viên',
            `Xoá "${user.name || user.fullName || user.username}"?`,
            [
                { text: 'Huỷ', style: 'cancel' },
                { text: 'Xoá', style: 'destructive', onPress: async () => {
                    try {
                        await deleteUser(user._id || user.id);
                        setUsers(prev => prev.filter(u => (u._id || u.id) !== (user._id || user.id)));
                    } catch {
                        Alert.alert('Lỗi', 'Không thể xoá nhân viên');
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
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={COLORS.primary} size="large" />
            </SafeAreaView>
        );
    }

    return(
        <SafeAreaView style = {styles.safeArea}>
            {/* Headder */}
            <View style = {styles.header}>
                <TouchableOpacity onPress = {() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style = {styles.headerTitle}>Team Overview</Text>
                <View style = {styles.badge}>
                    <Text style = {styles.badgeText}>Trưởng nhóm</Text>
                </View>
            </View>
            {/* Body */}
            <ScrollView style = {styles.scroll}>
                {/* Alert tổng quan */}
                <View style = {styles.alert}>
                    <Ionicons name="people-outline" size={24} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <View style = {styles.alertBody}>
                        <Text style = {styles.alertTitle}>{activeStats.totalActive} nhân viên vẫn còn đang hoạt động</Text>
                        <Text style = {styles.alertSub}>{activeStats.zoneDetails}Tổng năng suất: {activeStats.totalSKU} sp/giờ</Text>
                    </View>
                </View>
                {/* Filter Row */}
                {users.length > 0 && (
                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={[styles.filterBtn, activeFilter === 'all' && styles.filterBtnActive]}
                            onPress={() => setActiveFilter('all')}
                        >
                            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
                                Tất cả ({users.length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterBtn, activeFilter === 'working' && styles.filterBtnActive]}
                            onPress={() => setActiveFilter('working')}
                        >
                            <Text style={[styles.filterText, activeFilter === 'working' && styles.filterTextActive]}>
                                Đang làm ({users.filter(u => (u.activePickingTasksCount || 0) > 0).length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterBtn, activeFilter === 'idle' && styles.filterBtnActive]}
                            onPress={() => setActiveFilter('idle')}
                        >
                            <Text style={[styles.filterText, activeFilter === 'idle' && styles.filterTextActive]}>
                                Đang rảnh ({users.filter(u => (u.activePickingTasksCount || 0) === 0).length})
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
                        const locName = locMap[user.assignedLocationId] || 'Chưa phân công';
                        return (
                            <MemberRow
                                key = {user._id || user.id}
                                member = {{
                                    id: user._id || user.id,
                                    initials : (user.name || user.fullName || user.username || 'NV').split(' ').map(w =>w[0]).slice(-2).join('').toUpperCase(),
                                    avatarColor: '#e8f5e9',
                                    avatarText: COLORS.primary,
                                    name: user.name || user.fullName || user.username,
                                    order: user.role === 'staff' 
                                        ? `${(user.activePickingTasksCount || 0) > 0 ? `🔴 Đang làm (${user.activePickingTasksCount} task)` : '🟢 Đang rảnh'} · Phân công: ${locName}`
                                        : `Quản lý · Phân công: ${locName}`,
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
                        <Text style = {styles.cardTitle}>{team.zone}</Text>
                    </View>
                    {team.members.map((member) => (
                        <MemberRow key = {member.id || member._id} member ={member}/>
                    ))}
                </View>
            ))}
            </ScrollView>

            {editingUser && (
                <View style={styles.overlay}>
                    <View style={styles.editModal}>
                        <Text style={styles.editModalTitle}>Sửa tên nhân viên</Text>
                        <TextInput
                            style={styles.editInput}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Nhập tên mới"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <View style={styles.editActions}>
                            <TouchableOpacity style={styles.editCancelBtn} onPress={() => setEditingUser(null)}>
                                <Text style={styles.editCancelText}>Huỷ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.editSaveBtn} onPress={confirmEditUser}>
                                <Text style={styles.editSaveText}>Lưu</Text>
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

    // Member Row
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        gap: 12,
    },

    // Avatar
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '800',
    },

    // Thông tin thành viên
    memberInfo: { flex: 1 },
    memberName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#222',
    },
    memberOrder: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },

    memberAction: {
        padding: 4,
        marginLeft: 4,
    },
    memberActionText: { fontSize: 16 },

    // SKU/h
    memberSku: { alignItems: 'flex-end' },
    skuValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    skuUnit: {
        fontSize: 10,
        color: '#aaa',
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