import {Text, TextInput, View, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert} from 'react-native'
import {useState, useEffect} from 'react'
import{router} from 'expo-router'
import {COLORS} from '../../constants/colors'
import  {SafeAreaView} from 'react-native-safe-area-context'
import { useAuth } from '../../contexts/AuthContext'
import {logout as apiLogout, updateProfile, changeUserPassword} from '../../constants/services/api'
// Tạo 1 component chung cho tất cả các card (tại vì cấu trúc cho từng dòng khá giống nhau)

function SettingRow({icon, iconBg, name, sub, value, onValueChange}){
    return(
        <View style = {styles.settingRow}>
            <View style ={[styles.setIcon, {backgroundColor: iconBg}]}>
                <Text style ={styles.setIconText}>{icon}</Text>
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
// component dùng chung 1 dòng thông tin
function InfoRow({label, value}){
    return(
        <View style = {styles.infoRow}>
            <Text style = {styles.infoLabel}>{label}</Text>
            <Text style = {styles.infoValue}>{value}</Text>
        </View>
    )
}
export default function SettingScreen(){
    const { isLoggedIn, userRole, logout } = useAuth();

    // Mỗi switch sẽ có 1 useState riêng
    const[beepSound, setBeepSound] = useState(true);
    const[vibrate, setVibrate] = useState(true);
    const[lowAlert, setLowAlert] = useState(true);
    const[keepScreen, setKeepScreen] = useState(true);
    const[offlineMode, setOfflineMode] = useState(true);
    const[autoSync, setAutoSync] = useState(true);
    const[oldPassword, setOldPassword] = useState('');
    const[newPassword, setNewPassword] = useState('');
    const[confirmPassword, setConfirmPassword] = useState('');
    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
            return;
        }
        try {
            await changeUserPassword({ oldPassword, newPassword });
            Alert.alert('Thành công', 'Đổi mật khẩu thành công');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch {
            Alert.alert('Lỗi', 'Không thể đổi mật khẩu');
        }
    };
const handleLogout = async () => {
    try {
        await apiLogout();
    } catch (err) {
        // kể cả có lỗi thì vẫn logout bth
    } finally {
        logout();
    }
};
    return(
        <SafeAreaView style = {styles.safeArea}>
            {/* Header */}
            <View style = {styles.header}>
            <TouchableOpacity onPress = {() => router.back()}>
                <Text style = {styles.backBtn}>‹</Text>
                </TouchableOpacity>
            <Text style = {styles.headerTitle}>Cài đặt app</Text>
            <View style = {{width: 28}} />
            </View>
            {/* Thông báo và cảnh báo */}

            <ScrollView style = {styles.scroll}>
                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Thông báo & cảnh báo</Text>
                    <SettingRow
                    icon="🔔" iconBg="#e8f5e9"
                    name='Âm Thanh khi quét mã'
                    sub='Phát tiếng beep khi quét thành công'
                    value ={beepSound}
                    onValueChange={setBeepSound} />
                    <SettingRow 
                    icon="🚨" iconBg="#ffebee"
                    name ='Rung khi quét sai'
                    sub='Rung mạnh khi phát hiện sai sản phẩm'
                    value = {vibrate}
                    onValueChange ={setVibrate} />
                    <SettingRow
                    icon="⚠️" iconBg="#fff3e0"
                    name ='Cảnh báo khi năng suất thấp'
                    sub ='Dưới 50 SKU/h sẽ thông báo'
                    value = {lowAlert}
                    onValueChange ={setLowAlert} />
                </View>
                {/* Hiển thị */}
                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Kết nối & dữ liệu</Text>
                    <SettingRow 
                    icon="📵" iconBg="#e3f2fd"
                    name ='Chế độ Offline'
                    sub='Offline Mode'
                    value = {offlineMode}
                    onValueChange = {setOfflineMode} />
                    <SettingRow 
                    icon="🔄" iconBg="#fff3e0"
                    name = 'Tự đồng bộ khi có mạng'
                    sub = 'Gửi dữ liệu offline khi kết nối lại'
                    value = {autoSync}
                    onValueChange = {setAutoSync} />
                </View>
                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Đổi mật khẩu</Text>
                    <TextInput style={styles.passwordInput} placeholder="Mật khẩu cũ" secureTextEntry value={oldPassword} onChangeText={setOldPassword} />
                    <TextInput style={styles.passwordInput} placeholder="Mật khẩu mới" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
                    <TextInput style={styles.passwordInput} placeholder="Xác nhận mật khẩu" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
                    <TouchableOpacity style={styles.changePasswordBtn} onPress={handleChangePassword}>
                        <Text style={styles.changePasswordText}>Đổi mật khẩu</Text>
                    </TouchableOpacity>
                </View>
                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Thông tin App</Text>
                    <InfoRow label ='Phiên bản' value ='v2.5.0 (Build 450)'/>
                    <InfoRow label = 'Môi Trường' value = 'Production · Kingfood' />
                </View>
                 {/* Nút tạo tài khoản — chỉ quản lý kho mới thấy */}
                {userRole === 'admin' && (
                    <TouchableOpacity 
                        style={styles.createAccountBtn}
                        onPress={() => router.push('/createaccount')}
                    >
                        <Text style={styles.createAccountText}>👤 Tạo tài khoản nhân viên</Text>
                    </TouchableOpacity>
                )}
                 {/* Nút đăng xuất */}
                <TouchableOpacity 
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutText}> Đăng xuất</Text>
                </TouchableOpacity>
            </ScrollView>
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
});