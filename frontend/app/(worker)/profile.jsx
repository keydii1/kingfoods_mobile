import { Text, View, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';
import { useEffect, useState } from 'react';
import { Alert } from '../../utils/appAlert';
import { getMyProfile, updateUser, changeUserPassword, logout as apiLogout } from '../../constants/services/api';
import { useAuth } from '../../contexts/AuthContext';
import { validateNewPassword, PASSWORD_HINT } from '../../constants/passwordPolicy';

const ZONE_MAP = {
    1: 'Thực phẩm tươi',
    2: 'Đồ khô & Gia vị',
    3: 'Hoá mỹ phẩm',
    4: 'Đồ đông lạnh'
};

function InfoRow({ label, value, valueColor }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
        </View>
    );
}

export default function ProfileScreen() {
    const { logout, updateName } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    // Change Password Form states
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await getMyProfile();
                setUser(res);
            } catch (err) {
                // Fallback hardcoded if failed to load
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const startEdit = () => {
        setEditForm({
            name: user?.name || user?.fullName || '',
            username: user?.username || '',
            email: user?.email || '',
            phoneNumber: user?.phoneNumber || '',
        });
        setEditing(true);
    };

    const cancelEdit = () => setEditing(false);

    const saveEdit = async () => {
        if (!editForm.name?.trim()) {
            Alert.alert('Lỗi', 'Họ và tên không được để trống');
            return;
        }
        if (!editForm.username?.trim()) {
            Alert.alert('Lỗi', 'Tên đăng nhập không được để trống');
            return;
        }
        try {
            const updatePayload = {
                name: editForm.name.trim(),
                username: editForm.username.trim(),
                email: editForm.email?.trim() || '',
                phoneNumber: editForm.phoneNumber?.trim() || '',
            };
            await updateUser(user.id, updatePayload);
            setUser(prev => ({
                ...prev,
                ...updatePayload,
                fullName: updatePayload.name,
            }));
            updateName(updatePayload.name);
            setEditing(false);
            Alert.alert('Thành công', 'Cập nhật hồ sơ thành công');
        } catch (err) {
            Alert.alert('Lỗi', err.message || 'Không thể cập nhật hồ sơ');
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
            return;
        }
        const passwordError = validateNewPassword(newPassword);
        if (passwordError) {
            Alert.alert('Mật khẩu không hợp lệ', passwordError);
            return;
        }

        setChangingPassword(true);
        try {
            await changeUserPassword({ oldPassword, newPassword });
            Alert.alert('Thành công', 'Đổi mật khẩu thành công');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const msg = err?.message || 'Không thể đổi mật khẩu';
            const friendly = msg.toLowerCase().includes('old password')
                ? 'Mật khẩu cũ không đúng'
                : msg;
            Alert.alert('Lỗi', friendly);
        } finally {
            setChangingPassword(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiLogout().catch(() => {});
                        } finally {
                            await logout();
                            router.replace('/Login');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={COLORS.primary} size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ width: 40 }} />
                <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
                <TouchableOpacity onPress={editing ? cancelEdit : startEdit} activeOpacity={0.7}>
                    <Text style={styles.editBtn}>{editing ? 'Hủy' : 'Sửa'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                    <>
                        {/* Banner */}
                        <View style={styles.banner}>
                            {editing ? (
                                <TextInput
                                    style={[styles.name, styles.editInput, { color: '#fff', borderBottomColor: 'rgba(255,255,255,0.5)' }]}
                                    value={editForm.name}
                                    onChangeText={t => setEditForm(f => ({ ...f, name: t }))}
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                />
                            ) : (
                                <Text style={styles.name}>{user?.name || 'Nhân viên kho'}</Text>
                            )}
                            <Text style={styles.idText}>
                                Mã NV: {user?.username || `KF-NV-${user?.id}`} · Ca làm: Ca Sáng
                            </Text>
                            <View style={styles.badgeRow}>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {user?.assignedLocationId ? ZONE_MAP[user.assignedLocationId] : (user?.zone || 'Chưa phân khu')}
                                    </Text>
                                </View>
                            </View>
                            {editing && (
                                <TouchableOpacity style={[styles.badge, { backgroundColor: '#fff', marginTop: 14 }]} onPress={saveEdit} activeOpacity={0.9}>
                                    <Text style={[styles.badgeText, { color: COLORS.primary, fontWeight: '700' }]}>Lưu thay đổi</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Thông tin cá nhân */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Thông tin tài khoản</Text>
                            {editing ? (
                                <>
                                    <Text style={styles.fieldLabel}>Họ và Tên</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.name}
                                        onChangeText={t => setEditForm(f => ({ ...f, name: t }))}
                                        placeholder="Nhập họ và tên..."
                                        placeholderTextColor="#aaa"
                                    />

                                    <Text style={styles.fieldLabel}>Tên đăng nhập</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.username}
                                        onChangeText={t => setEditForm(f => ({ ...f, username: t }))}
                                        placeholder="Nhập tên đăng nhập..."
                                        placeholderTextColor="#aaa"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />

                                    <Text style={styles.fieldLabel}>Email liên hệ</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.email}
                                        onChangeText={t => setEditForm(f => ({ ...f, email: t }))}
                                        placeholder="Nhập email liên hệ..."
                                        placeholderTextColor="#aaa"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />

                                    <Text style={styles.fieldLabel}>Số điện thoại</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.phoneNumber}
                                        onChangeText={t => setEditForm(f => ({ ...f, phoneNumber: t }))}
                                        placeholder="Nhập số điện thoại..."
                                        placeholderTextColor="#aaa"
                                        keyboardType="phone-pad"
                                    />
                                </>
                            ) : (
                                <>
                                    <InfoRow label='Họ và Tên' value={user?.name || 'Nhân viên kho'} />
                                    <InfoRow label='Tên đăng nhập' value={user?.username || ''} />
                                    <InfoRow label='Email liên hệ' value={user?.email || 'Chưa cập nhật'} />
                                    <InfoRow label='Số điện thoại' value={user?.phoneNumber || 'Chưa cập nhật'} />
                                    <InfoRow label='Khu vực kho' value={user?.assignedLocationId ? ZONE_MAP[user.assignedLocationId] : (user?.zone || 'Chưa phân khu')} />
                                </>
                            )}
                        </View>

                        {/* Đổi mật khẩu trực tiếp */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Đổi mật khẩu</Text>
                            <Text style={styles.hintText}>{PASSWORD_HINT}</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Mật khẩu cũ"
                                placeholderTextColor="#aaa"
                                secureTextEntry
                                value={oldPassword}
                                onChangeText={setOldPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Mật khẩu mới"
                                placeholderTextColor="#aaa"
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Xác nhận mật khẩu mới"
                                placeholderTextColor="#aaa"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <TouchableOpacity
                                style={[styles.submitBtn, changingPassword && { opacity: 0.7 }]}
                                onPress={handleChangePassword}
                                disabled={changingPassword}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.submitBtnText}>
                                    {changingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Nút Đăng xuất */}
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                            <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
                        </TouchableOpacity>
                    </>
            </ScrollView>
            <StaffBottomNav active="profile" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    editBtn: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
        width: 40,
        textAlign: 'right',
    },
    scroll: { flex: 1 },
    banner: {
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 16,
    },
    name: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    idText: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 6,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    editInput: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.5)',
        paddingVertical: 2,
        paddingHorizontal: 8,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginHorizontal: 12,
        marginTop: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 14,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    infoLabel: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 6,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
        fontSize: 13,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        color: '#0f172a',
        fontWeight: '500',
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginTop: 6,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    hintText: {
        fontSize: 11,
        color: '#64748b',
        lineHeight: 16,
        marginBottom: 14,
        fontWeight: '500',
    },
    logoutBtn: {
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginHorizontal: 12,
        marginTop: 16,
        marginBottom: 48,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    logoutBtnText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '700',
    },
});
// Metro cache reload trigger