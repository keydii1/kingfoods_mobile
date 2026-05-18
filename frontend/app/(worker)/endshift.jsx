import {Text, View, StyleSheet, ScrollView,TouchableOpacity, Alert, ActivityIndicator} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {COLORS} from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';
import {useEffect, useState} from 'react';
import {getAssignedTasks} from '../../constants/services/api';
// Mockdata
const shiftStart = {
    score: 87,
    scoreDiff : '+12 tiếng so với ca hôm trước',
    skuPicked : 234,
    workHours: '8h',
    pendingOrders: 3,
    missingReports: 5,
}
 
// Tạo mảng lưu trữ các phase
const orders = [
    {
        id : '#KF-12345' , location: 'Q.7', detail: '52/52 SKU · Hoàn thành', status: 'done', statusLabel:'Hoàn thành'
    },
    {
        id :'#KF-12346', location: 'Q.1', detail: '38/38 SKU · Hoàn thành', status:'done', statusLabel: 'Hoàn thành'
    },
    {
        id: '#KF-12348', location: 'Thủ Đức', detail: '40/48 SKU · 8 SKU thiếu hàng', status: 'missing', statusLabel: 'Thiếu'
    },
    {
        id: '#KF-12349', location: 'Gò Vấp', detail: '0/30 SKU · Bàn giao ca sau', status: 'pending', statusLabel: 'Tồn Kho'
    }
]

// tạo 1 component sài chung
function StatBox ({value, label, valueColor}){
    return (
        <View style = {styles.statBox}>
            <Text style = {[styles.statValue, valueColor && {color: valueColor}]}>{value}</Text>
            <Text style = {styles.statLabel}>{label}</Text>
        </View>
    );
}

// Component dòng đơn hàng
function OrderRow({order}){
    // Màu dot và tag theo tùy trạng thái
    const dotColor ={
        done:    '#4caf50',
        missing: '#ff9800',
        pending: '#e53935',
    }[order.status]
    const tagStyle = {
        done:    styles.tagGreen,
        missing: styles.tagOrange,
        pending: styles.tagRed,
    }[order.status]
    return(
        <View style = {styles.orderRow}>
            <View style = {[styles.orderDot, {backgroundColor: dotColor}]} />
            <View style = {styles.orderInfo}>
                <Text style = {styles.orderName}>
                    {order.id} - {order.location}
                </Text>
                <Text style = {styles.orderDetail}>{order.detail}</Text>
            </View>
            <View style = {[styles.tag, tagStyle]}>
                <Text style = {styles.tagText}>{order.statusLabel}</Text>
            </View>
        </View>
    );
}

export default function EndShiftScreen(){
    const [apiStats, setApiStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const displayStats = apiStats || shiftStart;
    useEffect (() =>{
        async function fetchShift(){
            try{
                const res = await getAssignedTasks();
                const tasks = Array.isArray(res) ? res : [];
                const totalSku = tasks.reduce((sum, t) => sum + (t.quantityPicked || 0), 0);
                const totalItems = tasks.reduce((sum, t) => sum + (t.quantityToPick || 0), 0);
                const pct = totalItems > 0 ? Math.round((totalSku / totalItems) * 100) : 0;
                setApiStats ({
                    score: pct,
                    skuPicked: totalSku,
                    pendingOrders: tasks.filter(t => t.status !== 'completed').length,
                });
            }
            catch(err){
                // Giữ shiftmock nếu lỗi
            }
            finally{
                setLoading(false)
            }
        }
        fetchShift()
    }, []);
    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={COLORS.primary} size="large" />
                    <Text style={styles.loadingText}>Đang tổng kết ca...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return(
        <SafeAreaView style = {styles.safeArea}>
            {/* Header */}
            <View style = {styles.header}>
                <TouchableOpacity onPress = {() => router.back()}>
                    <Text style = {styles.backBtn}>‹</Text>
                </TouchableOpacity>
                <Text style = {styles.headerTitle}>Tổng kết ca sáng</Text>
                <View style = {styles.badge}>
                    <Text style = {styles.badgeText}>
                        ✅ Kết thúc
                    </Text>
            </View>
            </View>
            {/* Body */}
            <ScrollView style = {styles.scroll}>
                {/* Score Card */}
                <View style = {styles.scoreCard}>
                    <Text style = {styles.scoreValue}>{displayStats.score}</Text>
                    <Text style = {styles.scoreLabel}>Điểm năng suất tối đa</Text>
                    <Text style = {styles.scoreDiff}>{shiftStart.scoreDiff}</Text>
                </View>
                {/* Tổng quan - lưới 2x2 */}
                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Tổng quan</Text>
                    <View style = {styles.statGrid}>
                        <StatBox value = {displayStats.skuPicked} label = 'SKU đã pick' />
                        <StatBox value = {shiftStart.workHours} label = 'Thời gian làm' valueColor='#1976d2' />
                        <StatBox value = {displayStats.pendingOrders} label = 'Đơn chưa xong' valueColor = {COLORS.warning} />
                        <StatBox value = {shiftStart.missingReports} label = 'Báo thiếu hàng' valueColor = {COLORS.warning} />
                    </View>
                </View>
                {/* Danh sách những đơn hàng */}
                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Đơn hàng</Text>
                    {orders.map((order) => (
                        <OrderRow key = {order.id} order = {order} />
                    ))}
                </View>
                {/* Nút xác nhận */}
                <TouchableOpacity 
                style = {styles.btnConfirm}
                onPress = {() => router.replace('/Login')}>
                    <Text style = {styles.btnConfirmText}>Xác nhận kết thúc ca</Text>
                </TouchableOpacity>
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
    badge: {
        backgroundColor: COLORS.successBg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        color: COLORS.success,
        fontSize: 12,
        fontWeight: '600',
    },

    scroll: { flex: 1, padding: 16 },
    loadingContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
    },
    loadingText: {
        marginTop: 12, fontSize: 14, color: '#888',
    },

    // Score Card
    scoreCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    scoreValue: {
        color: '#fff',
        fontSize: 64,
        fontWeight: '900',
        lineHeight: 72,
    },
    scoreLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    scoreDiff: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 12,
        marginTop: 6,
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
        marginBottom: 14,
    },

    // Stat Grid 2x2
    statGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',       // ← tự xuống hàng
    },
    statBox: {
        width: '50%',           // ← mỗi ô 50% chiều ngang
        alignItems: 'center',
        paddingVertical: 12,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
        textAlign: 'center',
    },

    // Order Row
    orderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        marginRight: 10,
    },
    orderDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    orderInfo: { flex: 1 },
    orderName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#222',
    },
    orderDetail: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },

    // Tag trạng thái
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    tagGreen:  { backgroundColor: COLORS.successBg },
    tagOrange: { backgroundColor: COLORS.warningBg },
    tagRed:    { backgroundColor: COLORS.errorBg },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
    },

    // Nút xác nhận
    btnConfirm: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginBottom: 24,
    },
    btnConfirmText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
});