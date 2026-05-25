import { Text, View, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';
import { useEffect, useState } from 'react';
import { Alert } from '../../utils/appAlert';
import { getMyProfile, updateUser, changeUserPassword, logout as apiLogout, getCachedData } from '../../constants/services/api';
import { useAuth } from '../../contexts/AuthContext';
import { validateNewPassword, PASSWORD_HINT } from '../../constants/passwordPolicy';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

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
    headerTitle: 'Hồ sơ cá nhân',
    cancel: 'Hủy',
    edit: 'Sửa',
    save: 'Lưu thay đổi',
    accountInfo: 'Thông tin tài khoản',
    fullName: 'Họ và Tên',
    username: 'Tên đăng nhập',
    email: 'Email liên hệ',
    phone: 'Số điện thoại',
    warehouseZone: 'Khu vực kho',
    changePassword: 'Đổi mật khẩu',
    oldPassword: 'Mật khẩu cũ',
    newPassword: 'Mật khẩu mới',
    confirmNewPassword: 'Xác nhận mật khẩu mới',
    updateBtn: 'Đổi mật khẩu',
    updatingBtn: 'Đang cập nhật...',
    logoutBtn: 'Đăng xuất tài khoản',
    errorTitle: 'Lỗi',
    successTitle: 'Thành công',
    emptyNameErr: 'Họ và tên không được để trống',
    emptyUsernameErr: 'Tên đăng nhập không được để trống',
    updateSuccess: 'Cập nhật hồ sơ thành công',
    updateFailed: 'Không thể cập nhật hồ sơ',
    fillAllErr: 'Vui lòng nhập đầy đủ thông tin',
    passNotMatchErr: 'Mật khẩu mới không khớp',
    passInvalidTitle: 'Mật khẩu không hợp lệ',
    changePassSuccess: 'Đổi mật khẩu thành công',
    changePassFailed: 'Không thể đổi mật khẩu',
    oldPassIncorrect: 'Mật khẩu cũ không đúng',
    logoutTitle: 'Đăng xuất',
    logoutConfirm: 'Bạn có chắc chắn muốn đăng xuất?',
    unassignedZone: 'Chưa phân khu',
    shiftMorning: 'Ca Sáng',
    empCode: 'Mã NV',
    shiftLabel: 'Ca làm',
    staff: 'Nhân viên kho',
    notUpdated: 'Chưa cập nhật',
    namePlaceholder: 'Nhập họ và tên...',
    usernamePlaceholder: 'Nhập tên đăng nhập...',
    emailPlaceholder: 'Nhập email liên hệ...',
    phonePlaceholder: 'Nhập số điện thoại...',
  },
  en: {
    headerTitle: 'Personal Profile',
    cancel: 'Cancel',
    edit: 'Edit',
    save: 'Save Changes',
    accountInfo: 'Account Information',
    fullName: 'Full Name',
    username: 'Username',
    email: 'Contact Email',
    phone: 'Phone Number',
    warehouseZone: 'Warehouse Zone',
    changePassword: 'Change Password',
    oldPassword: 'Old Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    updateBtn: 'Change Password',
    updatingBtn: 'Updating...',
    logoutBtn: 'Logout Account',
    errorTitle: 'Error',
    successTitle: 'Success',
    emptyNameErr: 'Full name cannot be empty',
    emptyUsernameErr: 'Username cannot be empty',
    updateSuccess: 'Profile updated successfully',
    updateFailed: 'Unable to update profile',
    fillAllErr: 'Please fill in all fields',
    passNotMatchErr: 'New password does not match',
    passInvalidTitle: 'Invalid Password',
    changePassSuccess: 'Password changed successfully',
    changePassFailed: 'Unable to change password',
    oldPassIncorrect: 'Old password is incorrect',
    logoutTitle: 'Logout',
    logoutConfirm: 'Are you sure you want to logout?',
    unassignedZone: 'Unassigned Zone',
    shiftMorning: 'Morning Shift',
    empCode: 'Staff ID',
    shiftLabel: 'Shift',
    staff: 'Warehouse Picker',
    notUpdated: 'Not updated',
    namePlaceholder: 'Enter full name...',
    usernamePlaceholder: 'Enter username...',
    emailPlaceholder: 'Enter contact email...',
    phonePlaceholder: 'Enter phone number...',
  }
};

function InfoRow({ label, value, valueColor, activeTextColor, activeTextGrayColor, activeBorderColor }) {
    return (
        <View style={[styles.infoRow, { borderBottomColor: activeBorderColor }]}>
            <Text style={[styles.infoLabel, { color: activeTextGrayColor }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: activeTextColor }, valueColor && { color: valueColor }]}>{value}</Text>
        </View>
    );
}


export default function ProfileScreen() {
    const { logout, updateName } = useAuth();
    const { darkMode, language } = useAppPreferences();

    const activeBg = darkMode ? '#121212' : '#f8fafc';
    const activeHeaderBg = darkMode ? '#1e1e1e' : '#fff';
    const activeBorderColor = darkMode ? '#2d2d2d' : '#f1f5f9';
    const activeTextColor = darkMode ? '#f3f4f6' : '#0f172a';
    const activeCardBg = darkMode ? '#1e1e1e' : '#fff';
    const activeTextGrayColor = darkMode ? '#9ca3af' : '#64748b';
    const activeInputBg = darkMode ? '#2d2d2d' : '#f8fafc';
    const activeInputText = darkMode ? '#f3f4f6' : '#0f172a';
    const activeInputBorder = darkMode ? '#3d3d3d' : '#e2e8f0';

    const t = TRANSLATIONS[language];

    const cachedProfile = getCachedData('/admin/users/me');
    
    const [user, setUser] = useState(cachedProfile);
    const [loading, setLoading] = useState(!cachedProfile);
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
            Alert.alert(t.errorTitle, t.emptyNameErr);
            return;
        }
        if (!editForm.username?.trim()) {
            Alert.alert(t.errorTitle, t.emptyUsernameErr);
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
            Alert.alert(t.successTitle, t.updateSuccess);
        } catch (err) {
            Alert.alert(t.errorTitle, err.message || t.updateFailed);
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert(t.errorTitle, t.fillAllErr);
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert(t.errorTitle, t.passNotMatchErr);
            return;
        }
        const passwordError = validateNewPassword(newPassword);
        if (passwordError) {
            Alert.alert(t.passInvalidTitle, passwordError);
            return;
        }

        setChangingPassword(true);
        try {
            await changeUserPassword({ oldPassword, newPassword });
            Alert.alert(t.successTitle, t.changePassSuccess);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const msg = err?.message || t.changePassFailed;
            const friendly = msg.toLowerCase().includes('old password')
                ? t.oldPassIncorrect
                : msg;
            Alert.alert(t.errorTitle, friendly);
        } finally {
            setChangingPassword(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            t.logoutTitle,
            t.logoutConfirm,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.logoutTitle,
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
            <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={COLORS.primary} size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: activeHeaderBg, borderBottomColor: activeBorderColor }]}>
                <View style={{ width: 40 }} />
                <Text style={[styles.headerTitle, { color: activeTextColor }]}>{t.headerTitle}</Text>
                <TouchableOpacity onPress={editing ? cancelEdit : startEdit} activeOpacity={0.7}>
                    <Text style={styles.editBtn}>{editing ? t.cancel : t.edit}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                    <>
                        {/* Banner */}
                        <View style={[styles.banner, darkMode && { backgroundColor: '#1e1e1e' }]}>
                            {editing ? (
                                <TextInput
                                    style={[styles.name, styles.editInput, { color: '#fff', borderBottomColor: 'rgba(255,255,255,0.5)' }]}
                                    value={editForm.name}
                                    onChangeText={t => setEditForm(f => ({ ...f, name: t }))}
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                />
                            ) : (
                                <Text style={styles.name}>{user?.name || t.staff}</Text>
                            )}
                            <Text style={styles.idText}>
                                {t.empCode}: {user?.username || `KF-NV-${user?.id}`} · {t.shiftLabel}: {t.shiftMorning}
                            </Text>
                            <View style={styles.badgeRow}>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {user?.assignedLocationId ? ZONE_MAP[language][user.assignedLocationId] : (user?.zone || t.unassignedZone)}
                                    </Text>
                                </View>
                            </View>
                            {editing && (
                                <TouchableOpacity style={[styles.badge, { backgroundColor: '#fff', marginTop: 14 }]} onPress={saveEdit} activeOpacity={0.9}>
                                    <Text style={[styles.badgeText, { color: COLORS.primary, fontWeight: '700' }]}>{t.save}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Thông tin cá nhân */}
                        <View style={[styles.card, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]}>
                            <Text style={[styles.cardTitle, { color: activeTextColor }]}>{t.accountInfo}</Text>
                            {editing ? (
                                <>
                                    <Text style={[styles.fieldLabel, { color: activeTextGrayColor }]}>{t.fullName}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: activeInputBg, color: activeInputText, borderColor: activeInputBorder }]}
                                        value={editForm.name}
                                        onChangeText={t => setEditForm(f => ({ ...f, name: t }))}
                                        placeholder={t.namePlaceholder}
                                        placeholderTextColor={darkMode ? '#64748b' : '#aaa'}
                                    />

                                    <Text style={[styles.fieldLabel, { color: activeTextGrayColor }]}>{t.username}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: activeInputBg, color: activeInputText, borderColor: activeInputBorder }]}
                                        value={editForm.username}
                                        onChangeText={t => setEditForm(f => ({ ...f, username: t }))}
                                        placeholder={t.usernamePlaceholder}
                                        placeholderTextColor={darkMode ? '#64748b' : '#aaa'}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />

                                    <Text style={[styles.fieldLabel, { color: activeTextGrayColor }]}>{t.email}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: activeInputBg, color: activeInputText, borderColor: activeInputBorder }]}
                                        value={editForm.email}
                                        onChangeText={t => setEditForm(f => ({ ...f, email: t }))}
                                        placeholder={t.emailPlaceholder}
                                        placeholderTextColor={darkMode ? '#64748b' : '#aaa'}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />

                                    <Text style={[styles.fieldLabel, { color: activeTextGrayColor }]}>{t.phone}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: activeInputBg, color: activeInputText, borderColor: activeInputBorder }]}
                                        value={editForm.phoneNumber}
                                        onChangeText={t => setEditForm(f => ({ ...f, phoneNumber: t }))}
                                        placeholder={t.phonePlaceholder}
                                        placeholderTextColor={darkMode ? '#64748b' : '#aaa'}
                                        keyboardType="phone-pad"
                                    />
                                </>
                            ) : (
                                <>
                                    <InfoRow label={t.fullName} value={user?.name || t.staff} activeTextColor={activeTextColor} activeTextGrayColor={activeTextGrayColor} activeBorderColor={activeBorderColor} />
                                    <InfoRow label={t.username} value={user?.username || ''} activeTextColor={activeTextColor} activeTextGrayColor={activeTextGrayColor} activeBorderColor={activeBorderColor} />
                                    <InfoRow label={t.email} value={user?.email || t.notUpdated} activeTextColor={activeTextColor} activeTextGrayColor={activeTextGrayColor} activeBorderColor={activeBorderColor} />
                                    <InfoRow label={t.phone} value={user?.phoneNumber || t.notUpdated} activeTextColor={activeTextColor} activeTextGrayColor={activeTextGrayColor} activeBorderColor={activeBorderColor} />
                                    <InfoRow label={t.warehouseZone} value={user?.assignedLocationId ? ZONE_MAP[language][user.assignedLocationId] : (user?.zone || t.unassignedZone)} activeTextColor={activeTextColor} activeTextGrayColor={activeTextGrayColor} activeBorderColor={activeBorderColor} />
                                </>
                            )}
                        </View>

                        {/* Đổi mật khẩu trực tiếp */}
                        <View style={[styles.card, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]}>
                            <Text style={[styles.cardTitle, { color: activeTextColor }]}>{t.changePassword}</Text>
                            <Text style={[styles.hintText, { color: activeTextGrayColor }]}>{PASSWORD_HINT}</Text>

                            <TextInput
                                style={[styles.input, { backgroundColor: activeInputBg, color: activeInputText, borderColor: activeInputBorder }]}
                                placeholder={t.oldPassword}
                                placeholderTextColor={darkMode ? '#64748b' : '#aaa'}
                                secureTextEntry
                                value={oldPassword}
                                onChangeText={setOldPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <TextInput
                                style={[styles.input, { backgroundColor: activeInputBg, color: activeInputText, borderColor: activeInputBorder }]}
                                placeholder={t.newPassword}
                                placeholderTextColor={darkMode ? '#64748b' : '#aaa'}
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <TextInput
                                style={[styles.input, { backgroundColor: activeInputBg, color: activeInputText, borderColor: activeInputBorder }]}
                                placeholder={t.confirmNewPassword}
                                placeholderTextColor={darkMode ? '#64748b' : '#aaa'}
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
                                    {changingPassword ? t.updatingBtn : t.updateBtn}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Nút Đăng xuất */}
                        <TouchableOpacity style={[styles.logoutBtn, darkMode && { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]} onPress={handleLogout} activeOpacity={0.8}>
                            <Text style={styles.logoutBtnText}>{t.logoutBtn}</Text>
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