import {Text, View, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {COLORS} from '../../constants/colors'
import StaffBottomNav from '../../components/StaffBottomNav'

// Data đã cache sẵn
const cacheData = [
    {
        id: '1', 
        icon: '📋',
        name: 'Danh sách đơn hàng',
        sub: 'Cache lúc 10h05 - 12 đơn'
    },
    {
        id: '2',
        icon: '🗺️',
        name: 'Bản đồ kho',
        sub: 'Cache lúc 9h30 - Khu A, B, C'
    },
    {
        id: '3',
        icon: '📦',
        name: 'Thông tin SKU',
        sub: 'Cache lúc 9h30 - 1240 SKU',
    },
];

const pendingSync = [
    {
        id: '1',
        icon: '✅',
        name: 'Quét container BIN-401',
        sub: 'SKU: KF-00123 · 15:42',
    },
    {
        id: '2',
        icon: '⚠️',
        name: 'Báo thiếu hàng',
        sub: 'Kệ 14.07.B · 15:28'
    },
];
// Component 1 dòng chờ đồng bộ
function PendingRow({item}){
    return (
        <View style = {styles.itemRow}>
            <Text style = {styles.pendingIcon}>{item.icon}</Text>
            <View style = {styles.pendingInfo}>
                <Text style = {styles.pendingName}>{item.name}</Text>
                <Text style = {styles.pendingSub}>{item.sub}</Text>
            </View>
            <Text style = {styles.pendingStatus}>{item.pendingStatus}</Text>
        </View>
    );
}

export default function OfflineScreen(){
    return(
        <SafeAreaView style = {styles.safeArea}>
            {/* Header */}
            <View style = {styles.header}>
                <TouchableOpacity onPress = {() => router.back()}>
                    <Text style = {styles.backBtn}>‹</Text>
                </TouchableOpacity>
                <Text style = {styles.headerTitle}>Chế độ offline</Text>
                <View style = {styles.badge}>
                    <Text style = {styles.badgeText}>Mất mạng</Text>
                </View>
            </View>
            {/* Body */}
            <ScrollView style = {styles.scroll}>
                {/* Alert */}
            <View style = {styles.alert}>
                <Text style = {styles.alertIcon}>📵</Text>
                <View style = {styles.alertBody}>
                    <Text style = {styles.alertTitle}>Đang hoạt động offline</Text>
                    <Text style = {styles.alertSub}>App vẫn đang chạy bình thường, dữ liệu sẽ tự động đồng bộ khi có mạng trờ lại</Text>
                </View>
            </View>
            {/* Dữ liệu đã cache */}
            <View style = {styles.card}>    
                <Text style = {styles.cardTitle}>Dữ liệu đã cache</Text>
                {cacheData.map((item) =>(
                    <CacheRow key = {item.id} item = {item} />
                ))}
            </View>
            {/* Chờ đồng bộ */}
            <View style = {styles.card}>
                <Text style = {styles.cardTitle}>Chờ đồng bộ ({pendingSync.lenght} thao tác)</Text>
                {pendingSync.map((item) => (
                    <PendingRow key = {item.id} item={item} />
                ))}
            </View>
            {/* Nút thử kết nối lại */}
            <TouchableOpacity 
            style = {styles.btnReconnect}>
                <Text style = {styles.btnReconnectText}>Thử kết nối lại ngay</Text>
            </TouchableOpacity>
            </ScrollView>
        <StaffBottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#eceff1',
    },

    // Header tối
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#263238',
    },
    backBtn: {
        fontSize: 28,
        color: '#fff',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    badge: {
        backgroundColor: COLORS.errorBg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        color: COLORS.error,
        fontSize: 12,
        fontWeight: '600',
    },

    scroll: { flex: 1, padding: 16 },

    // Alert
    alert: {
        flexDirection: 'row',
        backgroundColor: COLORS.warningBg,
        borderRadius: 14,
        padding: 14,
        gap: 10,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.warning,
    },
    alertIcon: { fontSize: 24 },
    alertBody: { flex: 1 },
    alertTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#e65100',
        marginBottom: 4,
    },
    alertSub: {
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },

    // Card
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

    // Cache Row
    cacheRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f5f5f5',
        gap: 12,
    },
    cacheIcon: { fontSize: 22 },
    cacheInfo: { flex: 1 },
    cacheName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#222',
    },
    cacheSub: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    cacheStatus: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.primary,
    },

    // Pending Row
    pendingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f5f5f5',
        gap: 12,
    },
    pendingIcon: { fontSize: 22 },
    pendingInfo: { flex: 1 },
    pendingName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#222',
    },
    pendingSub: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    pendingStatus: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.warning,
    },

    // Nút reconnect
    btnReconnect: {
        backgroundColor: '#263238',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginBottom: 24,
    },
    btnReconnectText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
