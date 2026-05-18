import {Text, View, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, TextInput} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {useState, useEffect} from 'react';
import {getUsers, updateUser, deleteUser} from '../../constants/services/api'
import {COLORS} from '../../constants/colors';

// MockData 2 khu vực
const teams = [
    {
        zone: '🍬 Khu Bánh & Kẹo',
        members: [
            {
                id: '1', initials: 'LN', avatarColor: '#e8f5e9',
                avatarText: COLORS.primary,
                name: 'Trần Thị Lan',
                order: 'Đang làm #KF-12345 · 45/52 SKU',
                sku: 72, skuColor: COLORS.primary, status: 'good',
            },
            {
                id: '2', initials: 'TM', avatarColor: '#fff3e0',
                avatarText: '#e65100',
                name: 'Phạm Thị Mai',
                order: '⚠️ Đang làm #KF-12346 · 20/38 SKU',
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
        zone: '🥤 Khu Đồ Uống',
        members: [
            {
                id: '4', initials: 'VS', avatarColor: '#e3f2fd',
                avatarText: '#1565c0',
                name: 'Nguyễn Văn Sơn',
                order: 'Đang làm #KF-12347 · 38/40 SKU',
                sku: 61, skuColor: COLORS.primary, status: 'good',
            },
            {
                id: '5', initials: 'MT', avatarColor: '#e8f5e9',
                avatarText: COLORS.primary,
                name: 'Lê Minh Tùng',
                order: 'Hoàn thành #KF-12348 ✅',
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
            <Text style = {styles.memberOrder}>{member.order}</Text>
        </View>
        {/* SKU/h */}
        <View style = {styles.memberSku}>
            <Text style= {[styles.skuValue, {color: member.skuColor}]}>{member.sku ?? '-'}</Text>
            <Text style = {styles.skuUnit}>{member.status === 'break' ? 'Nghỉ': 'SKU/h'}</Text>
        </View>
        {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.memberAction}>
                <Text style={styles.memberActionText}>✏️</Text>
            </TouchableOpacity>
        )}
        {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.memberAction}>
                <Text style={styles.memberActionText}>🗑️</Text>
            </TouchableOpacity>
        )}
    </View>
    );
}

export default function TeamScreen(){
        const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [editName, setEditName] = useState('');
    useEffect(() => {
        async function fetchUsers(){
            try{
                const res = await getUsers();
                setUsers(Array.isArray(res) ? res : []);
            }
            catch(err){
                // giữ mockdata nêu lõi
            }
            finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);
    const handleEditUser = (user) => {
        setEditingUser(user);
        setEditName(user.fullName || user.username || '');
    };

    const confirmEditUser = async () => {
        if (!editingUser) return;
        try {
            const updated = await updateUser(editingUser._id || editingUser.id, { fullName: editName });
            setUsers(prev => prev.map(u => (u._id || u.id) === (editingUser._id || editingUser.id) ? { ...u, fullName: editName } : u));
            setEditingUser(null);
            Alert.alert('Thành công', 'Cập nhật thông tin thành công');
        } catch {
            Alert.alert('Lỗi', 'Không thể cập nhật thông tin');
        }
    };

    const handleDeleteUser = (user) => {
        Alert.alert(
            'Xoá nhân viên',
            `Xoá "${user.fullName || user.username}"?`,
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

    const activeStats = users.length > 0
      ? {
          totalActive: users.filter(u => u.isActive).length,
          totalSKU: users.reduce((s, u) => s + (u.todaySku || 0), 0),
          zoneDetails: '',
        }
      : teams.reduce((acc, t) => {
          const active = t.members.filter(m => m.status !== 'break');
          acc.totalActive += active.length;
          acc.totalSKU += active.reduce((s, m) => s + (m.sku || 0), 0);
          acc.zoneDetails += `${t.zone.split(' ').slice(1).join(' ')}: ${active.length} · `;
          return acc;
        }, { totalActive: 0, totalSKU: 0, zoneDetails: '' });
    return(
        <SafeAreaView style = {styles.safeArea}>
            {/* Headder */}
            <View style = {styles.header}>
                <TouchableOpacity onPress = {() => router.back()}>
                    <Text style = {styles.backBtn}>‹</Text>
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
                    <Text style = {styles.alertIcon}>👥</Text>
                    <View style = {styles.alertBody}>
                        <Text style = {styles.alertTitle}>{activeStats.totalActive} nhân viên vẫn còn đang hoạt động</Text>
                        <Text style = {styles.alertSub}>{activeStats.zoneDetails}Tổng năng suất: {activeStats.totalSKU} SKU/h</Text>
                    </View>
                </View>
                {/* Danh sách từng khu vực */}
                {loading ? (
                    <ActivityIndicator color={COLORS.primary} size = 'large' style = {{marginTop : 40}} />
                ): 
                users.length > 0 ? (
                    users.map(user =>(
                        <MemberRow
                        key = {user._id || user.id}
                        member = {{
                            id: user._id,
                            initials : (user.fullName || user.username || 'NV').split(' ').map(w =>w[0]).slice(-2).join('').toUpperCase(),
                            avatarColor: '#e8f5e9',
                            avatarText: COLORS.primary,
                            name: user.fullName || user.username,
                            order: user.currentTask || 'Không có nhiệm vụ',
                            sku: user.todaySku || null,
                            skuColor: COLORS.primary,
                            status: user.isActive ? 'good' : 'offline',
                        }}
                        onEdit={() => handleEditUser(user)}
                        onDelete={() => handleDeleteUser(user)}
                    />
                    ))
                ):
            teams.map((team) => (
                <View key = {team.zone} style = {styles.card}>
                    <Text style = {styles.cardTitle}>{team.zone}</Text>
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
});