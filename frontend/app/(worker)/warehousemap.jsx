import {Text, View, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import {router} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS} from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';

const shelves = [
    {
        id: 'K10', label : 'KỆ 10 ', left :15, top: 20, isTarget : false
    },
    {
        id :'K11', label: 'KỆ 11', left:80, top :20, isTarget: false
    },
    {
        id :'K12', label :'KỆ 12', left: 145 , top:20, isTarget: false
    },
    {
        id: 'k14', label: 'KỆ 14', left: 210, top: 20,  isTarget: true  
    },
    { 
        id: 'k16', label: 'KỆ 16', left: 15,  top: 90,  isTarget: false 
    },
    { 
        id: 'k18', label: 'KỆ 18', left: 80,  top: 90,  isTarget: false 
    },
    { 
        id: 'k20', label: 'KỆ 20', left: 145, top: 90,  isTarget: false 
    },
    { 
        id: 'k22', label: 'KỆ 22', left: 210, top: 90,  isTarget: false 
    },
    { 
        id: 'k24', label: 'KỆ 24', left: 15,  top: 160, isTarget: false 
    },
    { 
        id: 'k26', label: 'KỆ 26', left: 80,  top: 160, isTarget: false 
    },
    {
        id: 'k28', label: 'KỆ 28-30', left: 145, top: 160, isTarget: false
    },
]
function LegendItem({color, label}){
    return (
        <View style = {styles.legendItem}>
            <Text style = {styles.legendText}>{label}</Text>
            <View style = {[styles.legendDot, {backgroundColor: color}]}/>
        </View>
    );
}
export default function WarehouseMapScreen(){
    return (
        <SafeAreaView style = {styles.safeArea}>
            {/* Header */}
            <View style = {styles.header}>
                <TouchableOpacity onPress = {() => router.back()}>
                    <Text style = {styles.backBtn}>‹</Text>
                </TouchableOpacity>
                <Text style = {styles.headerTitle}>Bản đồ kho</Text>
                <View style = {styles.badge}>
                    <Text style = {styles.badgeText}>Khu bánh kẹo</Text>
                </View>
            </View>
            {/* Body */}
            <ScrollView style = {styles.scroll}>
                {/* Alert chỉ đường */}
                <View style = {styles.alert}>
                    <Text style = {styles.alertIcon}>🎯</Text>
                    <View style = {styles.alertBody}>
                        <Text style = {styles.alertTitle}>Đang chỉ đường đến kệ 14 .07 .B</Text>
                        <Text style = {styles.alertSub}>Đi thẳng từ cổng vào, rẽ phải ở dãy 12 khoảng 30m.</Text>
                    </View>
                </View>
                {/* Bản đồ */}
                <View style = {styles.mapContainer}>
                     {/* Vẽ từng kệ hàng bằng position absolute */}
                    {shelves.map((shelf) => (
                        <View
                        key = {shelf.id}
                        style = {[styles.shelf, {left: shelf.left, top: shelf.top},shelf.isTarget && styles.shelfTarget]}>
                        <Text style = {[styles.shelfText, shelf.isTarget && styles.shelfTextTarget]}>{shelf.label} {shelf.isTarget ? '🎯': ' '} </Text>
                        </View>
                    ))}
                    {/* Đường đi - Dùng view ngang dọc */}
                    <View style = {styles.routeVertical} />
                    <View style ={styles.routeHorizontal} />
                    {/* Vị trí của nhân viên */}
                    <View style = {styles.meMarker}>
                        <Text style = {styles.meIcon}>📍</Text>
                    </View>
                    {/* Label phía dưới bản đồ */}
                    <Text style = {styles.mapLabel}>
                        📍 Bạn đang ở đây · Mục tiêu: Kệ 14 
                    </Text>
                </View>
                <View style = {styles.legend}>
                    <LegendItem label= {'Vị trí của bạn'} color = '#ff1744'/>
                    <LegendItem label='Kệ cần đến' color={COLORS.accent} />
                    <LegendItem label='Kệ khác' color='#37474f' />
                </View>
                {/* Card và thông tin kệ */}
                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>📍 Thông tin kệ mục tiêu</Text>
                    <View style ={styles.cardRow}>
                        <View>
                            <Text style = {styles.targetCode}>14. 07. B</Text>
                            <Text style = {styles.targetDetail}>Dãy 14 Kệ 07 Tầng B</Text>
                        </View>
                        <View style = {styles.distanceBox}>
                            <Text style = {styles.distanceValue}>~30m</Text>
                            <Text style = {styles.distanceLabel}>Khoảng cách </Text>
                        </View>
                    </View>
                </View>
                </ScrollView>
                {/* Nav item */}
                <StaffBottomNav />
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backBtn: {
        fontSize: 28,
        color: COLORS.text,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    badge: {
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
    },

    scroll: { flex: 1, padding: 16 },

    // Alert
    alert: {
        flexDirection: 'row',
        backgroundColor: '#e8f5e9',
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

    // Bản đồ
    mapContainer: {
        backgroundColor: '#263238',
        borderRadius: 16,
        height: 250,
        marginBottom: 16,
        position: 'relative',  // ← bắt buộc để con dùng absolute
        overflow: 'hidden',
    },
    shelf: {
        position: 'absolute',  // ← đặt tại tọa độ cụ thể
        width: 55,
        height: 35,
        backgroundColor: '#37474f',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shelfTarget: {
        backgroundColor: COLORS.primary,
        width: 60,
    },
    shelfText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 9,
        fontWeight: '700',
        textAlign: 'center',
    },
    shelfTextTarget: {
        color: '#fff',
    },

    // Đường đi
    routeVertical: {
        position: 'absolute',
        left: 30,
        top: 58,
        width: 3,
        height: 182,
        backgroundColor: COLORS.accent,
        opacity: 0.8,
    },
    routeHorizontal: {
        position: 'absolute',
        left: 30,
        top: 58,
        width: 208,
        height: 3,
        backgroundColor: COLORS.accent,
        opacity: 0.8,
    },

    // Vị trí nhân viên
    meMarker: {
        position: 'absolute',
        left: 18,
        top: 210,
    },
    meIcon: { fontSize: 24 },

    // Label bản đồ
    mapLabel: {
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
    },

    // Chú thích
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        color: '#666',
    },

    // Card thông tin
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#222',
        marginBottom: 12,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    targetCode: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.primary,
    },
    targetDetail: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    distanceBox: {
        backgroundColor: '#e8f5e9',
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
    },
    distanceValue: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.primary,
    },
    distanceLabel: {
        fontSize: 10,
        color: '#888',
    },

});