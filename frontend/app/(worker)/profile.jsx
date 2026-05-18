import {Text, View, TextInput, TouchableOpacity, ScrollView, StyleSheet} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {router} from 'expo-router'
import {COLORS} from '../../constants/colors'
import StaffBottomNav from '../../components/StaffBottomNav';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { getProfile, updateProfile } from '../../constants/services/api';
// componet tái sử dụng - tránh phải lặp đi lặp lại code vi phạm DRYƯ
function InfoRow({label, value, valueColor}){
    return(
        <View style = {styles.infoRow}>
            <Text style = {styles.infoLabel}>
                {label}
            </Text>
            <Text style = {[styles.infoValue, valueColor && {color: valueColor}]}>
                {value}
            </Text>
        </View>
    )
}
// Componet tái sử dung cho thành tích
function Achievement ({medal, title, when}){
    return (
        <View style = {styles.achievement}>
            <Text style = {styles.medal}>
                {medal}
            </Text>
            <Text style = {styles.achName}>
                {title}
            </Text>
            <Text style = {styles.achWhen}>
                {when}
            </Text>
        </View>
    )
}
export default function ProfileScreen (){
    const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
const [editing, setEditing] = useState(false);
const [editForm, setEditForm] = useState({});

useEffect(() => {
    async function fetchProfile() {
        try {
            const res = await getProfile();
            setUser(res);
        } catch (err) {
            // Giữ data cứng nếu lỗi
        } finally {
            setLoading(false);
        }
    }
    fetchProfile();
}, []);

const startEdit = () => {
  setEditForm({ fullName: user?.fullName || '', zone: user?.zone || '' });
  setEditing(true);
};

const cancelEdit = () => setEditing(false);

const saveEdit = async () => {
  try {
    await updateProfile(editForm);
    setUser(prev => ({ ...prev, ...editForm }));
    setEditing(false);
    Alert.alert('Thành công', 'Cập nhật hồ sơ thành công');
  } catch {
    Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ');
  }
};
    return (
        < SafeAreaView style = {styles.safeArea}>
            {/* phần header */}
            <View style = {styles.header}>
                {/* // đợi event chuyển về trang trước đó */}
                <TouchableOpacity onPress ={() => router.back()}>
                    <Text style = {styles.backBtn}>‹</Text>
                    </TouchableOpacity> 
                <Text style = {styles.headerTitle}>
                    Hồ sơ nhân viên
                </Text>
                <TouchableOpacity onPress={editing ? cancelEdit : startEdit}>
                  <Text style={styles.editBtn}>{editing ? '✕' : '✏️'}</Text>
                </TouchableOpacity>
            </View>
            {/*Ava + tên của nhân viên  */}
             <ScrollView style={styles.scroll}>
      {loading ? (
    <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
) : (
    <>
        {/* Banner */}
        <View style={styles.banner}>
            <Text style={styles.avatarEmoji}>👷</Text>
            {editing ? (
              <TextInput
                style={[styles.name, styles.editInput, { color: '#fff', borderBottomColor: 'rgba(255,255,255,0.5)' }]}
                value={editForm.fullName}
                onChangeText={t => setEditForm(f => ({ ...f, fullName: t }))}
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            ) : (
              <Text style={styles.name}>{user?.fullName || 'Phạm Thị Mai'}</Text>
            )}
            <Text style={styles.idText}>
                Mã NV: {user?.employeeId || 'KF-NV-042'} Ca Sáng
            </Text>
            <View style={styles.badgeRow}>
                <View style={styles.badge}>
                    {editing ? (
                      <TextInput
                        style={[styles.badgeText, styles.editInput, { color: '#fff', borderBottomColor: 'rgba(255,255,255,0.5)', fontSize: 12 }]}
                        value={editForm.zone}
                        onChangeText={t => setEditForm(f => ({ ...f, zone: t }))}
                        placeholderTextColor="rgba(255,255,255,0.5)"
                      />
                    ) : (
                      <Text style={styles.badgeText}>
                          {user?.zone || '🍬 Bánh & Kẹo'}
                      </Text>
                    )}
                </View>
            </View>
            {editing && (
              <TouchableOpacity style={[styles.badge, { backgroundColor: '#fff', marginTop: 12 }]} onPress={saveEdit}>
                <Text style={[styles.badgeText, { color: COLORS.primary }]}>Lưu thay đổi</Text>
              </TouchableOpacity>
            )}
        </View>

        {/* Thông tin */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
            <InfoRow label='Họ và Tên' value={user?.fullName || 'Phạm Thị Mai'} />
            <InfoRow label='Khu vực' value={user?.zone || '🍬 Bánh & Kẹo'} />
            <InfoRow label='Ngày vào làm'
                value={user?.startDate
                    ? new Date(user.startDate).toLocaleDateString('vi-VN')
                    : '12/03/2023'} />
            <InfoRow label='Tổng SKU đã chọn'
                value={user?.totalSku ? String(user.totalSku) : '12,840'}
                valueColor={COLORS.primary} />
            <InfoRow label='Trung bình năng suất'
                value={user?.avgSku ? `${user.avgSku} SKU/h` : '52 SKU/h'} />
            <InfoRow label='Số ca đã làm'
                value={user?.totalShifts ? `${user.totalShifts} ca` : '186 ca'} />
        </View>

        {/* Ca làm — giữ mock vì backend chưa có */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Ca làm Sắp tới</Text>
            <InfoRow label="Hôm nay (22/04)" value="☀️ Ca Sáng 08:00–16:00" />
            <InfoRow label="Ngày mai (23/04)" value="🌙 Ca Chiều 16:00–00:00" />
            <InfoRow label="24/04" value="🏖️ Nghỉ" />
        </View>
    </>
)}
             </ScrollView>
             <StaffBottomNav />
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
    editBtn: {
        fontSize: 20,
        color: '#aed6b5',
    },

    scroll: { flex: 1 },

    // Banner
    banner: {
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        paddingVertical: 28,
        paddingHorizontal: 16,
    },
    avatarEmoji: {
        fontSize: 60,
        marginBottom: 10,
    },
    name: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    idText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginTop: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    editInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 2,
        paddingHorizontal: 4,
        textAlign: 'center',
    },

    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        margin: 12,
        marginBottom: 0,
        padding: 16,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#222',
        marginBottom: 12,
    },

    // Info Row
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    },
    infoLabel: {
        fontSize: 13,
        color: '#888',
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#222',
    },

    // Achievement
    achievement: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    },
    medal: { fontSize: 28 },
    achName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#222',
    },
    achWhen: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },

    // Nút đổi PIN
    pinBtn: {
        margin: 12,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#eee',
        marginBottom: 24,
    },
    pinBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    shiftBtn: {
    margin: 12,
    marginBottom: 0,
    padding: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: 'center',
},
shiftBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
},
handoverBtn: {
    marginHorizontal: 12,
    marginTop: 12,

    padding: 16,

    backgroundColor: '#fff',

    borderRadius: 16,

    alignItems: 'center',

    borderWidth: 1.5,
    borderColor: '#dfe7df',
},

handoverBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
},
historyBtn: {
    marginHorizontal: 12,
    marginTop: 12,

    padding: 16,

    backgroundColor: '#fff',

    borderRadius: 16,

    alignItems: 'center',

    borderWidth: 1.5,
    borderColor: '#e5e7eb',
},

historyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
},
productivityBtn: {
    marginHorizontal: 12,
    marginTop: 12,

    padding: 16,

    backgroundColor: '#fff',

    borderRadius: 16,

    alignItems: 'center',

    borderWidth: 1.5,
    borderColor: '#d6e4ff',
},

productivityBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
},
});