import {Text, TextInput, View, TouchableOpacity, StyleSheet, ScrollView, Switch, Linking} from 'react-native'
import { Alert } from '../../utils/appAlert';
import {useState, useEffect, useCallback} from 'react'
import {router} from 'expo-router'
import {Ionicons} from '@expo/vector-icons'
import {COLORS} from '../../constants/colors'
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context'
import { useAuth } from '../../contexts/AuthContext'
import {logout as apiLogout, changeUserPassword, changeCustomerPassword} from '../../constants/services/api'
import { validateNewPassword, PASSWORD_HINT } from '../../constants/passwordPolicy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import * as LocalAuthentication from 'expo-local-authentication';

// Vietnamese/English translations dictionary
const TRANSLATIONS = {
    vi: {
        settings: 'Cài đặt',
        appSettings: 'Cài đặt app',
        appPreferences: 'Cài đặt ứng dụng',
        darkMode: 'Giao diện tối (Dark Mode)',
        darkModeSub: 'Chuyển đổi giao diện sáng/tối',
        language: 'Ngôn ngữ (Language)',
        languageSub: 'Chọn ngôn ngữ hiển thị',
        biometrics: 'Đăng nhập sinh trắc học',
        biometricsSub: 'Sử dụng FaceID hoặc Vân tay',
        notifications: 'Thông báo đẩy',
        notificationsSub: 'Nhận thông báo đơn hàng & ưu đãi',
        accountSupport: 'Tài khoản & Hỗ trợ',
        storeProfile: 'Hồ sơ cửa hàng',
        storeProfileSub: 'Xem và chỉnh sửa thông tin',
        orderStats: 'Thống kê đơn hàng',
        orderStatsSub: 'Theo dõi đơn đã đặt và trạng thái',
        hotline: 'Hotline kho Kingfood',
        changePassword: 'Đổi mật khẩu',
        oldPassword: 'Mật khẩu cũ',
        newPassword: 'Mật khẩu mới',
        confirmNewPassword: 'Xác nhận mật khẩu mới',
        appInfo: 'Thông tin App',
        version: 'Phiên bản',
        appType: 'Ứng dụng',
        customerApp: 'Kingfood · Đặt hàng cửa hàng',
        staffApp: 'Production · Kingfood WMS',
        logout: 'Đăng xuất',
        createStaffAccount: 'Tạo tài khoản nhân viên',
        success: 'Thành công',
        error: 'Lỗi',
        passwordChanged: 'Đổi mật khẩu thành công',
        pleaseFillAll: 'Vui lòng nhập đầy đủ thông tin',
        passwordsNotMatch: 'Mật khẩu mới không khớp',
        invalidPassword: 'Mật khẩu không hợp lệ',
        cannotChangePassword: 'Không thể đổi mật khẩu',
        oldPasswordIncorrect: 'Mật khẩu cũ không đúng',
        selectLanguage: 'Chọn ngôn ngữ',
        biometricNotSupported: 'Thiết bị không hỗ trợ sinh trắc học (FaceID/Vân tay)',
        biometricNotEnrolled: 'Bạn chưa đăng ký FaceID/Vân tay trên thiết bị. Vui lòng vào Cài đặt > FaceID để thiết lập.',
        biometricAuthFailed: 'Xác thực sinh trắc học thất bại. Vui lòng thử lại.',
        biometricEnabledNote: 'Đã bật! Khi đăng nhập lần tiếp theo bằng mật khẩu, thông tin sẽ được lưu để đăng nhập bằng FaceID/Vân tay.',
        biometricDisabled: 'Đã tắt đăng nhập sinh trắc học. Thông tin đã lưu sẽ bị xoá.',
        notice: 'Thông báo',
        cancel: 'Huỷ',
    },
    en: {
        settings: 'Settings',
        appSettings: 'App Settings',
        appPreferences: 'Application Preferences',
        darkMode: 'Dark Mode',
        darkModeSub: 'Toggle light/dark appearance',
        language: 'Language',
        languageSub: 'Select application language',
        biometrics: 'Biometric Login',
        biometricsSub: 'Use FaceID or Fingerprint',
        notifications: 'Push Notifications',
        notificationsSub: 'Receive order updates & offers',
        accountSupport: 'Account & Support',
        storeProfile: 'Store Profile',
        storeProfileSub: 'View and edit profile info',
        orderStats: 'Order Statistics',
        orderStatsSub: 'Track placed orders and status',
        hotline: 'Kingfood Warehouse Hotline',
        changePassword: 'Change Password',
        oldPassword: 'Old Password',
        newPassword: 'New Password',
        confirmNewPassword: 'Confirm New Password',
        appInfo: 'App Information',
        version: 'Version',
        appType: 'Application',
        customerApp: 'Kingfood · Store Ordering',
        staffApp: 'Production · Kingfood WMS',
        logout: 'Log Out',
        createStaffAccount: 'Create Staff Account',
        success: 'Success',
        error: 'Error',
        passwordChanged: 'Password changed successfully',
        pleaseFillAll: 'Please fill in all fields',
        passwordsNotMatch: 'New passwords do not match',
        invalidPassword: 'Invalid password',
        cannotChangePassword: 'Cannot change password',
        oldPasswordIncorrect: 'Old password is incorrect',
        selectLanguage: 'Select Language',
        biometricNotSupported: 'This device does not support biometrics (FaceID/Fingerprint)',
        biometricNotEnrolled: 'No FaceID/Fingerprint enrolled on this device. Please go to Settings > FaceID to set up.',
        biometricAuthFailed: 'Biometric authentication failed. Please try again.',
        biometricEnabledNote: 'Enabled! Next time you log in with your password, your credentials will be saved for biometric login.',
        biometricDisabled: 'Biometric login disabled. Saved credentials have been removed.',
        notice: 'Notice',
        cancel: 'Cancel',
    }
};

function SettingRow({icon, iconBg, iconColor, name, sub, value, onValueChange, textColor, subColor, borderColor}){
    return(
        <View style = {[styles.settingRow, borderColor && { borderTopColor: borderColor }]}>
            <View style ={[styles.setIcon, {backgroundColor: iconBg}]}>
                <Ionicons name={icon} size={18} color={iconColor || COLORS.primary} />
            </View>
            <View style = {styles.setLabel}>
                <Text style = {[styles.setName, textColor && { color: textColor }]}>{name}</Text>
                <Text style ={[styles.setSub, subColor && { color: subColor }]}>{sub}</Text>
            </View>
            <Switch 
            value = {value}
            onValueChange = {onValueChange}
            trackColor={{ false: '#ddd', true: COLORS.accent }}
            thumbColor={'#fff'} />
        </View>
    );
}

function InfoRow({label, value, textColor, subColor, borderColor}){
    return(
        <View style = {[styles.infoRow, borderColor && { borderTopColor: borderColor }]}>
            <Text style = {[styles.infoLabel, subColor && { color: subColor }]}>{label}</Text>
            <Text style = {[styles.infoValue, textColor && { color: textColor }]}>{value}</Text>
        </View>
    )
}

function LinkRow({icon, iconBg, iconColor, name, sub, onPress, textColor, subColor, borderColor}){
    return(
        <TouchableOpacity style={[styles.linkRow, borderColor && { borderTopColor: borderColor }]} onPress={onPress} activeOpacity={0.75}>
            <View style={[styles.setIcon, {backgroundColor: iconBg}]}>
                <Ionicons name={icon} size={18} color={iconColor || COLORS.primary} />
            </View>
            <View style={styles.setLabel}>
                <Text style={[styles.setName, textColor && { color: textColor }]}>{name}</Text>
                {sub ? <Text style={[styles.setSub, subColor && { color: subColor }]}>{sub}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>
    );
}

export default function SettingScreen(){
    const { userRole, logout, userName } = useAuth();
    const insets = useSafeAreaInsets();
    const isCustomer = userRole === 'store_manager';

    const {
        darkMode,
        language,
        biometric,
        pushNotify,
        setDarkMode,
        setLanguage,
        setBiometric,
        setPushNotify,
    } = useAppPreferences();

    // Legacy / Staff settings
    const [beepSound, setBeepSound] = useState(true);
    const [vibrate, setVibrate] = useState(true);
    const [lowAlert, setLowAlert] = useState(true);
    const [offlineMode, setOfflineMode] = useState(false);
    const [autoSync, setAutoSync] = useState(true);

    // Password input fields
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        async function loadSettings() {
            try {
                const keys = [
                    'setting_beepSound',
                    'setting_vibrate',
                    'setting_lowAlert',
                    'setting_offlineMode',
                    'setting_autoSync'
                ];
                const stores = await AsyncStorage.multiGet(keys);
                stores.forEach(([key, val]) => {
                    if (val !== null) {
                        const bool = val === 'true';
                        if (key === 'setting_beepSound') setBeepSound(bool);
                        if (key === 'setting_vibrate') setVibrate(bool);
                        if (key === 'setting_lowAlert') setLowAlert(bool);
                        if (key === 'setting_offlineMode') setOfflineMode(bool);
                        if (key === 'setting_autoSync') setAutoSync(bool);
                    }
                });
            } catch (err) {
                console.log('Error loading settings', err);
            }
        }
        loadSettings();
    }, []);

    const saveSetting = async (key, val) => {
        try {
            await AsyncStorage.setItem(`setting_${key}`, String(val));
        } catch (err) {
            console.log('Error saving setting', err);
        }
    };

    const t = TRANSLATIONS[language] || TRANSLATIONS.vi;

    // Dark theme dynamic colors
    const activeBg = darkMode ? '#121212' : '#f0f4f1';
    const activeCardBg = darkMode ? '#1e1e1e' : '#fff';
    const activeTextColor = darkMode ? '#f3f4f6' : '#222';
    const activeTextGrayColor = darkMode ? '#9ca3af' : '#888';
    const activeBorderColor = darkMode ? '#2d2d2d' : '#eee';
    const activeInputBg = darkMode ? '#2d2d2d' : '#fff';

    const showLanguagePicker = () => {
        Alert.alert(
            t.selectLanguage,
            '',
            [
                {
                    text: 'Tiếng Việt',
                    onPress: () => {
                        setLanguage('vi');
                    }
                },
                {
                    text: 'English',
                    onPress: () => {
                        setLanguage('en');
                    }
                },
                {
                    text: t.cancel,
                    style: 'cancel'
                }
            ]
        );
    };

    const handleBiometricToggle = async (val) => {
        if (val) {
            // Turning ON: check hardware + enrollment + authenticate
            try {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                if (!hasHardware) {
                    Alert.alert(t.error, t.biometricNotSupported);
                    return;
                }
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                if (!isEnrolled) {
                    Alert.alert(t.error, t.biometricNotEnrolled);
                    return;
                }
                // Require a live biometric scan to confirm identity
                const authResult = await LocalAuthentication.authenticateAsync({
                    promptMessage: language === 'en'
                        ? 'Verify your identity to enable biometric login'
                        : 'Xác thực để bật đăng nhập sinh trắc học',
                    fallbackLabel: language === 'en' ? 'Use Passcode' : 'Dùng mã PIN',
                    disableDeviceFallback: false,
                });
                if (!authResult.success) {
                    Alert.alert(t.error, t.biometricAuthFailed);
                    return;
                }
                // Success — enable
                setBiometric(true);
                Alert.alert(t.notice, t.biometricEnabledNote);
            } catch (err) {
                console.log('Biometric toggle error:', err);
                Alert.alert(t.error, t.biometricAuthFailed);
            }
        } else {
            // Turning OFF
            setBiometric(false);
            Alert.alert(t.notice, t.biometricDisabled);
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert(t.error, t.pleaseFillAll);
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert(t.error, t.passwordsNotMatch);
            return;
        }
        const passwordError = validateNewPassword(newPassword);
        if (passwordError) {
            Alert.alert(t.invalidPassword, passwordError);
            return;
        }
        try {
            if (userRole === 'store_manager') {
                await changeCustomerPassword({ oldPassword, newPassword });
            } else {
                await changeUserPassword({ oldPassword, newPassword });
            }
            Alert.alert(t.success, t.passwordChanged);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const msg = err?.message || t.cannotChangePassword;
            const friendly =
              msg.toLowerCase().includes('old password')
                ? t.oldPasswordIncorrect
                : msg;
            Alert.alert(t.error, friendly);
        }
    };

    const handleLogout = async () => {
        try {
            await apiLogout();
        } catch (err) {
            // fallback
        } finally {
            logout();
        }
    };

    return(
        <SafeAreaView style = {[styles.safeArea, { backgroundColor: activeBg }]}>
            {/* Header */}
            <View style = {[styles.header, { backgroundColor: activeCardBg, borderBottomColor: activeBorderColor }]}>
                <TouchableOpacity onPress = {() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style = {[styles.headerTitle, { color: activeTextColor }]}>{isCustomer ? t.settings : t.appSettings}</Text>
                <View style = {{width: 28}} />
            </View>

            <ScrollView style = {styles.scroll} contentContainerStyle={{ paddingBottom: 16 }}>
                {isCustomer ? (
                    <>
                        {/* App Preferences */}
                        <View style={[styles.card, { backgroundColor: activeCardBg }]}>
                            <Text style={[styles.cardTitle, { color: activeTextGrayColor }]}>{t.appPreferences}</Text>
                            <SettingRow
                                icon="moon-outline" iconBg="#3f51b5" iconColor="#fff"
                                name={t.darkMode}
                                sub={t.darkModeSub}
                                value={darkMode}
                                onValueChange={(val) => {
                                    setDarkMode(val);
                                    saveSetting('darkMode', val);
                                }}
                                textColor={activeTextColor}
                                subColor={activeTextGrayColor}
                                borderColor={activeBorderColor}
                            />
                            <LinkRow
                                icon="language-outline" iconBg="#4caf50" iconColor="#fff"
                                name={t.language}
                                sub={language === 'vi' ? 'Tiếng Việt' : 'English'}
                                onPress={showLanguagePicker}
                                textColor={activeTextColor}
                                subColor={activeTextGrayColor}
                                borderColor={activeBorderColor}
                            />
                            <SettingRow
                                icon="finger-print-outline" iconBg="#00bcd4" iconColor="#fff"
                                name={t.biometrics}
                                sub={t.biometricsSub}
                                value={biometric}
                                onValueChange={handleBiometricToggle}
                                textColor={activeTextColor}
                                subColor={activeTextGrayColor}
                                borderColor={activeBorderColor}
                            />
                            <SettingRow
                                icon="notifications-outline" iconBg="#ff9800" iconColor="#fff"
                                name={t.notifications}
                                sub={t.notificationsSub}
                                value={pushNotify}
                                onValueChange={(val) => {
                                    setPushNotify(val);
                                    saveSetting('pushNotify', val);
                                }}
                                textColor={activeTextColor}
                                subColor={activeTextGrayColor}
                                borderColor={activeBorderColor}
                            />
                        </View>

                        {/* Account & Support */}
                        <View style={[styles.card, { backgroundColor: activeCardBg }]}>
                            <Text style={[styles.cardTitle, { color: activeTextGrayColor }]}>{t.accountSupport}</Text>
                            <LinkRow
                                icon="person-outline" iconBg="#e8f5e9" iconColor={COLORS.primary}
                                name={t.storeProfile}
                                sub={userName || t.storeProfileSub}
                                onPress={() => router.push('/customerprofile')}
                                textColor={activeTextColor}
                                subColor={activeTextGrayColor}
                                borderColor={activeBorderColor}
                            />
                            <LinkRow
                                icon="stats-chart-outline" iconBg="#e3f2fd" iconColor="#1565c0"
                                name={t.orderStats}
                                sub={t.orderStatsSub}
                                onPress={() => router.push('/storestatistics')}
                                textColor={activeTextColor}
                                subColor={activeTextGrayColor}
                                borderColor={activeBorderColor}
                            />
                            <LinkRow
                                icon="call-outline" iconBg="#fff3e0" iconColor="#e65100"
                                name={t.hotline}
                                sub="1900 1234 · 8:00 – 21:00"
                                onPress={() => Linking.openURL('tel:19001234')}
                                textColor={activeTextColor}
                                subColor={activeTextGrayColor}
                                borderColor={activeBorderColor}
                            />
                        </View>
                    </>
                ) : (
                    userRole === 'staff' ? (
                        <>
                            {/* App Preferences */}
                            <View style={[styles.card, { backgroundColor: activeCardBg }]}>
                                <Text style={[styles.cardTitle, { color: activeTextGrayColor }]}>{t.appPreferences}</Text>
                                <SettingRow
                                    icon="moon-outline" iconBg="#3f51b5" iconColor="#fff"
                                    name={t.darkMode}
                                    sub={t.darkModeSub}
                                    value={darkMode}
                                    onValueChange={(val) => {
                                        setDarkMode(val);
                                        saveSetting('darkMode', val);
                                    }}
                                    textColor={activeTextColor}
                                    subColor={activeTextGrayColor}
                                    borderColor={activeBorderColor}
                                />
                                <LinkRow
                                    icon="language-outline" iconBg="#4caf50" iconColor="#fff"
                                    name={t.language}
                                    sub={language === 'vi' ? 'Tiếng Việt' : 'English'}
                                    onPress={showLanguagePicker}
                                    textColor={activeTextColor}
                                    subColor={activeTextGrayColor}
                                    borderColor={activeBorderColor}
                                />
                                <SettingRow
                                    icon="finger-print-outline" iconBg="#00bcd4" iconColor="#fff"
                                    name={t.biometrics}
                                    sub={t.biometricsSub}
                                    value={biometric}
                                    onValueChange={handleBiometricToggle}
                                    textColor={activeTextColor}
                                    subColor={activeTextGrayColor}
                                    borderColor={activeBorderColor}
                                />
                            </View>

                            {/* Notifications & staff specific alerts */}
                            <View style = {[styles.card, { backgroundColor: activeCardBg }]}>
                                <Text style = {[styles.cardTitle, { color: activeTextGrayColor }]}>Thông báo & cảnh báo</Text>
                                <SettingRow
                                icon="notifications-outline" iconBg="#e8f5e9" iconColor={COLORS.primary}
                                name='Âm Thanh khi quét mã'
                                sub='Phát tiếng beep khi quét thành công'
                                value ={beepSound}
                                onValueChange={(val) => {
                                    setBeepSound(val);
                                    saveSetting('beepSound', val);
                                }}
                                textColor={activeTextColor}
                                subColor={activeTextGrayColor}
                                borderColor={activeBorderColor}
                                />
                                <SettingRow 
                                icon="alert-circle-outline" iconBg="#ffebee" iconColor={COLORS.error}
                                name ='Rung khi quét sai'
                                sub='Rung mạnh khi phát hiện sai sản phẩm'
                                value = {vibrate}
                                onValueChange ={(val) => {
                                    setVibrate(val);
                                    saveSetting('vibrate', val);
                                }}
                                textColor={activeTextColor}
                                subColor={activeTextGrayColor}
                                borderColor={activeBorderColor}
                                />
                                <SettingRow
                                icon="warning-outline" iconBg="#fff3e0" iconColor="#e65100"
                                name ='Cảnh báo khi năng suất thấp'
                                sub ='Dưới 50 SKU/h sẽ thông báo'
                                value = {lowAlert}
                                onValueChange ={(val) => {
                                    setLowAlert(val);
                                    saveSetting('lowAlert', val);
                                }}
                                textColor={activeTextColor}
                                subColor={activeTextGrayColor}
                                borderColor={activeBorderColor}
                                />
                            </View>

                            <View style = {[styles.card, { backgroundColor: activeCardBg }]}>
                                <Text style = {[styles.cardTitle, { color: activeTextGrayColor }]}>Kết nối & dữ liệu</Text>
                                <SettingRow 
                                icon="wifi-outline" iconBg="#e3f2fd" iconColor="#1565c0"
                                name ='Chế độ Offline'
                                sub='Offline Mode'
                                value = {offlineMode}
                                onValueChange = {(val) => {
                                    setOfflineMode(val);
                                    saveSetting('offlineMode', val);
                                }}
                                textColor={activeTextColor}
                                subColor={activeTextGrayColor}
                                borderColor={activeBorderColor}
                                />
                                <SettingRow 
                                icon="sync-outline" iconBg="#fff3e0" iconColor="#e65100"
                                name = 'Tự đồng bộ khi có mạng'
                                sub = 'Gửi dữ liệu offline khi kết nối lại'
                                value = {autoSync}
                                onValueChange = {(val) => {
                                    setAutoSync(val);
                                    saveSetting('autoSync', val);
                                }}
                                textColor={activeTextColor}
                                subColor={activeTextGrayColor}
                                borderColor={activeBorderColor}
                                />
                            </View>
                        </>
                    ) : null
                )}

                {/* Password card */}
                <View style = {[styles.card, { backgroundColor: activeCardBg }]}>
                    <Text style = {[styles.cardTitle, { color: activeTextGrayColor }]}>{t.changePassword}</Text>
                    <Text style={[styles.passwordHint, { color: activeTextGrayColor }]}>{PASSWORD_HINT}</Text>
                    <TextInput 
                        style={[styles.passwordInput, { backgroundColor: activeInputBg, color: activeTextColor, borderColor: activeBorderColor }]} 
                        placeholder={t.oldPassword} 
                        placeholderTextColor={activeTextGrayColor}
                        secureTextEntry 
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={oldPassword} 
                        onChangeText={setOldPassword} 
                    />
                    <TextInput 
                        style={[styles.passwordInput, { backgroundColor: activeInputBg, color: activeTextColor, borderColor: activeBorderColor }]} 
                        placeholder={t.newPassword} 
                        placeholderTextColor={activeTextGrayColor}
                        secureTextEntry 
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={newPassword} 
                        onChangeText={setNewPassword} 
                    />
                    <TextInput 
                        style={[styles.passwordInput, { backgroundColor: activeInputBg, color: activeTextColor, borderColor: activeBorderColor }]} 
                        placeholder={t.confirmNewPassword} 
                        placeholderTextColor={activeTextGrayColor}
                        secureTextEntry 
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={confirmPassword} 
                        onChangeText={setConfirmPassword} 
                    />
                    <TouchableOpacity style={styles.changePasswordBtn} onPress={handleChangePassword}>
                        <Text style={styles.changePasswordText}>{t.changePassword}</Text>
                    </TouchableOpacity>
                </View>

                {/* App Info card */}
                <View style = {[styles.card, { backgroundColor: activeCardBg }]}>
                    <Text style = {[styles.cardTitle, { color: activeTextGrayColor }]}>{t.appInfo}</Text>
                    <InfoRow label={t.version} value='v2.5.0 (Build 450)' textColor={activeTextColor} subColor={activeTextGrayColor} borderColor={activeBorderColor} />
                    <InfoRow
                        label={t.appType}
                        value={isCustomer ? t.customerApp : t.staffApp}
                        textColor={activeTextColor}
                        subColor={activeTextGrayColor}
                        borderColor={activeBorderColor}
                    />
                </View>

                 {/* Staff Account creation button — Admin only */}
                {userRole === 'admin' && (
                    <TouchableOpacity 
                        style={[styles.createAccountBtn, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]}
                        onPress={() => router.push('/createaccount')}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.createAccountText}>{t.createStaffAccount}</Text>
                        </View>
                    </TouchableOpacity>
                )}

                 {/* Logout button */}
                <TouchableOpacity 
                    style={[styles.logoutBtn, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]}
                    onPress={handleLogout}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="log-out-outline" size={18} color="#e53935" />
                        <Text style={styles.logoutText}>{t.logout}</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>

            {/* Bottom Nav for customer */}
            {isCustomer && (
                <View style={[styles.bottomNav, { backgroundColor: activeCardBg, borderTopColor: activeBorderColor, paddingBottom: Math.max(insets.bottom, 8) }]}>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/storeorder')}>
                        <Ionicons name="cart-outline" size={22} color={activeTextGrayColor} style={{ marginBottom: 2 }} />
                        <Text style={[styles.navLabel, { color: activeTextGrayColor }]}>Đặt hàng</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/storestatistics')}>
                        <Ionicons name="stats-chart-outline" size={22} color={activeTextGrayColor} style={{ marginBottom: 2 }} />
                        <Text style={[styles.navLabel, { color: activeTextGrayColor }]}>Thống kê</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Ionicons name="settings" size={22} color={COLORS.primary} style={{ marginBottom: 2 }} />
                        <Text style={[styles.navLabel, styles.navActive]}>Cài đặt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/customerprofile')}>
                        <Ionicons name="person-outline" size={22} color={activeTextGrayColor} style={{ marginBottom: 2 }} />
                        <Text style={[styles.navLabel, { color: activeTextGrayColor }]}>Cá nhân</Text>
                    </TouchableOpacity>
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
    scroll: { flex: 1 },

    // Card
    card: {
        borderRadius: 16,
        margin: 12,
        marginBottom: 0,
        overflow: 'hidden',
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#888',
        padding: 16,
        paddingBottom: 8,
    },

    // Setting Row
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
        borderTopWidth: 0.5,
        borderTopColor: '#eee',
    },
    setIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    setIconText: { fontSize: 18 },
    setLabel: { flex: 1 },
    setName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#222',
    },
    setSub: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
        borderTopWidth: 0.5,
        borderTopColor: '#eee',
    },

    // Info Row
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 14,
        borderTopWidth: 0.5,
        borderTopColor: '#eee',
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

    passwordHint: {
        fontSize: 11,
        color: '#888',
        lineHeight: 16,
        marginHorizontal: 14,
        marginBottom: 10,
    },
    passwordInput: {
        borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
        padding: 12, fontSize: 14, marginHorizontal: 14, marginBottom: 10,
    },
    changePasswordBtn: {
        margin: 14, marginTop: 0, padding: 12,
        backgroundColor: COLORS.primary, borderRadius: 10, alignItems: 'center',
    },
    changePasswordText: {
        fontSize: 14, fontWeight: '600', color: '#fff',
    },

    // Nút tạo tài khoản
    createAccountBtn: {
        margin: 12,
        marginBottom: 0,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.accent,
    },
    createAccountText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    // Nút đăng xuất
    logoutBtn: {
        margin: 12,
        marginBottom: 24,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#ffcdd2',
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e53935',
    },
    bottomNav: {
        flexDirection: 'row', paddingVertical: 10,
        borderTopWidth: 1,
    },
    navItem: { flex: 1, alignItems: 'center' },
    navLabel: { fontSize: 10, marginTop: 2 },
    navActive: { color: COLORS.primary, fontWeight: '600' },
});