import {Text, TextInput, View, TouchableOpacity, StyleSheet, ScrollView, Switch, Linking} from 'react-native'
import { Alert } from '../../utils/appAlert';
import {useState, useEffect} from 'react'
import {router} from 'expo-router'
import {Ionicons} from '@expo/vector-icons'
import {COLORS} from '../../constants/colors'
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context'
import { useAuth } from '../../contexts/AuthContext'
import { useStoreCart } from '../../contexts/StoreCartContext'
import {logout as apiLogout, changeUserPassword, changeCustomerPassword} from '../../constants/services/api'
import { validateNewPassword, PASSWORD_HINT } from '../../constants/passwordPolicy';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tạo 1 component chung cho tất cả các card
function SettingRow({icon, iconBg, iconColor, name, sub, value, onValueChange}){
    return(
        <View style = {styles.settingRow}>
            <View style ={[styles.setIcon, {backgroundColor: iconBg}]}>
                <Ionicons name={icon} size={18} color={iconColor || COLORS.primary} />
            </View>
            <View style = {styles.setLabel}>
                <Text style = {styles.setName}>{name}</Text>
                <Text style ={styles.setSub}>{sub}</Text>
            </View>
            <Switch 
            value = {value}
            onValueChange = {onValueChange}
            trackColor={{ false: '#ddd', true: COLORS.accent }}
            thumbColor={'#fff'} />
        </View>
    );
}

function InfoRow({label, value}){
    return(
        <View style = {styles.infoRow}>
            <Text style = {styles.infoLabel}>{label}</Text>
            <Text style = {styles.infoValue}>{value}</Text>
        </View>
    )
}

function CartPersistSetting() {
    const { persistCart, setPersistCart } = useStoreCart();
    return (
        <SettingRow
            icon="cart-outline"
            iconBg="#e8f5e9"
            iconColor={COLORS.primary}
            name="Lưu giỏ hàng tự động"
            sub="Giữ sản phẩm đã chọn khi thoát app"
            value={persistCart}
            onValueChange={setPersistCart}
        />
    );
}

function LinkRow({icon, iconBg, iconColor, name, sub, onPress}){
    return(
        <TouchableOpacity style={styles.linkRow} onPress={onPress} activeOpacity={0.75}>
            <View style={[styles.setIcon, {backgroundColor: iconBg}]}>
                <Ionicons name={icon} size={18} color={iconColor || COLORS.primary} />
            </View>
            <View style={styles.setLabel}>
                <Text style={styles.setName}>{name}</Text>
                {sub ? <Text style={styles.setSub}>{sub}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>
    );
}

export default function SettingScreen(){
    const { userRole, logout, userName } = useAuth();
    const insets = useSafeAreaInsets();
    const isCustomer = userRole === 'store_manager';

    const [beepSound, setBeepSound] = useState(true);
    const [vibrate, setVibrate] = useState(true);
    const [lowAlert, setLowAlert] = useState(true);
    const [offlineMode, setOfflineMode] = useState(true);
    const [autoSync, setAutoSync] = useState(true);

    const [orderStatusNotify, setOrderStatusNotify] = useState(true);
    const [orderReminder, setOrderReminder] = useState(true);
    const [notifySound, setNotifySound] = useState(true);
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
                    'setting_autoSync',
                    'setting_orderStatusNotify',
                    'setting_orderReminder',
                    'setting_notifySound'
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
                        if (key === 'setting_orderStatusNotify') setOrderStatusNotify(bool);
                        if (key === 'setting_orderReminder') setOrderReminder(bool);
                        if (key === 'setting_notifySound') setNotifySound(bool);
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
        try {
            if (userRole === 'store_manager') {
                await changeCustomerPassword({ oldPassword, newPassword });
            } else {
                await changeUserPassword({ oldPassword, newPassword });
            }
            Alert.alert('Thành công', 'Đổi mật khẩu thành công');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const msg = err?.message || 'Không thể đổi mật khẩu';
            const friendly =
              msg.toLowerCase().includes('old password')
                ? 'Mật khẩu cũ không đúng'
                : msg;
            Alert.alert('Lỗi', friendly);
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
        <SafeAreaView style = {styles.safeArea}>
            {/* Header */}
            <View style = {styles.header}>
                <TouchableOpacity onPress = {() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style = {styles.headerTitle}>{isCustomer ? 'Cài đặt' : 'Cài đặt app'}</Text>
                <View style = {{width: 28}} />
            </View>

            <ScrollView style = {styles.scroll} contentContainerStyle={{ paddingBottom: 16 }}>
                {isCustomer ? (
                    <>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Thông báo đơn hàng</Text>
                            <SettingRow
                                icon="volume-medium-outline" iconBg="#e3f2fd" iconColor="#1565c0"
                                name="Âm thanh đặt hàng thành công"
                                sub="Phát âm thanh khi đặt hàng thành công"
                                value={notifySound}
                                onValueChange={(val) => {
                                    setNotifySound(val);
                                    saveSetting('notifySound', val);
                                }}
                            />
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Đặt hàng</Text>
                            <CartPersistSetting />
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Tài khoản & hỗ trợ</Text>
                            <LinkRow
                                icon="person-outline" iconBg="#e8f5e9" iconColor={COLORS.primary}
                                name="Hồ sơ cửa hàng"
                                sub={userName || 'Xem và chỉnh sửa thông tin'}
                                onPress={() => router.push('/customerprofile')}
                            />
                            <LinkRow
                                icon="stats-chart-outline" iconBg="#e3f2fd" iconColor="#1565c0"
                                name="Thống kê đơn hàng"
                                sub="Theo dõi đơn đã đặt và trạng thái"
                                onPress={() => router.push('/storestatistics')}
                            />
                            <LinkRow
                                icon="call-outline" iconBg="#fff3e0" iconColor="#e65100"
                                name="Hotline kho Kingfood"
                                sub="1900 1234 · 8:00 – 21:00"
                                onPress={() => Linking.openURL('tel:19001234')}
                            />
                        </View>
                    </>
                ) : (
                    userRole === 'staff' ? (
                        <>
                            <View style = {styles.card}>
                                <Text style = {styles.cardTitle}>Thông báo & cảnh báo</Text>
                                <SettingRow
                                icon="notifications-outline" iconBg="#e8f5e9" iconColor={COLORS.primary}
                                name='Âm Thanh khi quét mã'
                                sub='Phát tiếng beep khi quét thành công'
                                value ={beepSound}
                                onValueChange={(val) => {
                                    setBeepSound(val);
                                    saveSetting('beepSound', val);
                                }} />
                                <SettingRow 
                                icon="alert-circle-outline" iconBg="#ffebee" iconColor={COLORS.error}
                                name ='Rung khi quét sai'
                                sub='Rung mạnh khi phát hiện sai sản phẩm'
                                value = {vibrate}
                                onValueChange ={(val) => {
                                    setVibrate(val);
                                    saveSetting('vibrate', val);
                                }} />
                                <SettingRow
                                icon="warning-outline" iconBg="#fff3e0" iconColor="#e65100"
                                name ='Cảnh báo khi năng suất thấp'
                                sub ='Dưới 50 SKU/h sẽ thông báo'
                                value = {lowAlert}
                                onValueChange ={(val) => {
                                    setLowAlert(val);
                                    saveSetting('lowAlert', val);
                                }} />
                            </View>

                            <View style = {styles.card}>
                                <Text style = {styles.cardTitle}>Kết nối & dữ liệu</Text>
                                <SettingRow 
                                icon="wifi-outline" iconBg="#e3f2fd" iconColor="#1565c0"
                                name ='Chế độ Offline'
                                sub='Offline Mode'
                                value = {offlineMode}
                                onValueChange = {(val) => {
                                    setOfflineMode(val);
                                    saveSetting('offlineMode', val);
                                }} />
                                <SettingRow 
                                icon="sync-outline" iconBg="#fff3e0" iconColor="#e65100"
                                name = 'Tự đồng bộ khi có mạng'
                                sub = 'Gửi dữ liệu offline khi kết nối lại'
                                value = {autoSync}
                                onValueChange = {(val) => {
                                    setAutoSync(val);
                                    saveSetting('autoSync', val);
                                }} />
                            </View>
                        </>
                    ) : null
                )}

                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Đổi mật khẩu</Text>
                    <Text style={styles.passwordHint}>{PASSWORD_HINT}</Text>
                    <TextInput 
                        style={styles.passwordInput} 
                        placeholder="Mật khẩu cũ" 
                        placeholderTextColor="#aaa"
                        secureTextEntry 
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={oldPassword} 
                        onChangeText={setOldPassword} 
                    />
                    <TextInput 
                        style={styles.passwordInput} 
                        placeholder="Mật khẩu mới" 
                        placeholderTextColor="#aaa"
                        secureTextEntry 
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={newPassword} 
                        onChangeText={setNewPassword} 
                    />
                    <TextInput 
                        style={styles.passwordInput} 
                        placeholder="Xác nhận mật khẩu mới" 
                        placeholderTextColor="#aaa"
                        secureTextEntry 
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={confirmPassword} 
                        onChangeText={setConfirmPassword} 
                    />
                    <TouchableOpacity style={styles.changePasswordBtn} onPress={handleChangePassword}>
                        <Text style={styles.changePasswordText}>Đổi mật khẩu</Text>
                    </TouchableOpacity>
                </View>

                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Thông tin App</Text>
                    <InfoRow label ='Phiên bản' value ='v2.5.0 (Build 450)'/>
                    <InfoRow
                        label = 'Ứng dụng'
                        value = {isCustomer ? 'Kingfood · Đặt hàng cửa hàng' : 'Production · Kingfood WMS'}
                    />
                </View>

                 {/* Nút tạo tài khoản — chỉ quản lý kho mới thấy */}
                {userRole === 'admin' && (
                    <TouchableOpacity 
                        style={styles.createAccountBtn}
                        onPress={() => router.push('/createaccount')}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.createAccountText}>Tạo tài khoản nhân viên</Text>
                        </View>
                    </TouchableOpacity>
                )}

                 {/* Nút đăng xuất */}
                <TouchableOpacity 
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="log-out-outline" size={18} color="#e53935" />
                        <Text style={styles.logoutText}>Đăng xuất</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>

            {/* Bottom Nav for customer */}
            {isCustomer && (
                <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/storeorder')}>
                        <Ionicons name="cart-outline" size={22} color="#aaa" style={{ marginBottom: 2 }} />
                        <Text style={styles.navLabel}>Đặt hàng</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/storestatistics')}>
                        <Ionicons name="stats-chart-outline" size={22} color="#aaa" style={{ marginBottom: 2 }} />
                        <Text style={styles.navLabel}>Thống kê</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Ionicons name="settings" size={22} color={COLORS.primary} style={{ marginBottom: 2 }} />
                        <Text style={[styles.navLabel, styles.navActive]}>Cài đặt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/customerprofile')}>
                        <Ionicons name="person-outline" size={22} color="#aaa" style={{ marginBottom: 2 }} />
                        <Text style={styles.navLabel}>Cá nhân</Text>
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
        backgroundColor: '#fff',
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
        backgroundColor: '#fff',
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
        backgroundColor: '#fff',
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
        flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10,
        borderTopWidth: 1, borderTopColor: '#eee',
    },
    navItem: { flex: 1, alignItems: 'center' },
    navLabel: { fontSize: 10, color: '#aaa', marginTop: 2 },
    navActive: { color: COLORS.primary, fontWeight: '600' },
});