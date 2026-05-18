import { router, useFocusEffect } from 'expo-router';
import{
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {COLORS} from '../../constants/colors'
import {useState, useCallback} from 'react'
import StaffBottomNav from '../../components/StaffBottomNav'
import { useAuth } from '../../contexts/AuthContext'
import {getAssignedTasks} from '../../constants/services/api' 


export default function DashboardScreen(){
    // thêm 1 số components để fetch
    const {userName, userRole, assignedZone} = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    useFocusEffect(useCallback(() => {
        async function fetchTasks() {
            try{
                const res = await getAssignedTasks();
                console.log('dashboard: getAssignedTasks response', JSON.stringify(res, null, 2));
                const mapped = (Array.isArray(res) ? res : []).map(task => ({
                    ...task,
                    orderId: task.orderDetail?.order?.id ?? task.orderId,
                    storeName: task.orderDetail?.order?.branch?.name || '',
                    totalCount: task.quantityToPick ?? task.totalCount ?? 0,
                    pickedCount: task.quantityPicked ?? task.pickedCount ?? 0,
                }));
                setTasks(mapped);
            }
            catch (err){
                console.log('dashboard: fetch error', err.message);
                setTasks([
                    { _id: '1', orderId: 'MOCK-001', storeName: 'Cửa hàng Q.7', totalCount: 5, pickedCount: 2, status: 'in_progress' },
                    { _id: '2', orderId: 'MOCK-002', storeName: 'Cửa hàng Q.1', totalCount: 3, pickedCount: 0, status: 'pending' },
                ]);
            }
            finally { // dù có fetch thành công hay thất bại thì phải luôn tắt biểu tượng loading
                setLoading(false);
            }
        }
        setLoading(true);
        fetchTasks();
    }, []));
    // Tính % task hoàn thành
    const getPct = (task) =>{
        if(!task.totalCount) return 0
        return Math.round((task.pickedCount / task.totalCount) * 100)
    }
    // Helper: lấy style trạng thái
    const getStatusStyle = (status) =>{
        if(status === 'completed') return styles.statusGreen;
        if(status === 'in_progress') return styles.statusOrange;
        return styles.statusGray;
    };
    // lấy màu thanh % theo khoảng
    const getProgressColor = (pct) =>{
        if(pct < 25) return '#e53935';
        if(pct < 50) return '#fb8c00';
        if(pct < 75) return '#fdd835';
        return '#43a047';
    };
    // lấy label cho từng trạng tháy
    const getStatusLabel = (status) =>{
         if(status === 'completed') return 'Xong';
         if(status === 'in_progress') return 'Đang làm'
         return 'Chờ';
    }
    return(
       <SafeAreaView style={styles.safeArea}>
           <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            <View style={styles.banner}>
                <View style={styles.bannerTop}>
                    <View>
                        <Text style={styles.greeting}>Xin chào 👋</Text>
                        <Text style={styles.name}>{userName || 'Nhân viên'}</Text>
                        <Text style={styles.zone}>{assignedZone || 'Chưa phân khu'}</Text>
                    </View>
                    <View style={styles.shiftTime}>
                        <Text style={styles.shiftLabel}>Ca</Text>
                        <Text style={styles.shiftValue}>08:00–16:00</Text>
                    </View>
                </View>
            {loading ? (
    <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
) : tasks.length === 0 ? (
    <Text style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 16 }}>
        Không có đơn hàng hôm nay
    </Text>
) : (
    tasks.map((task, index) => (
        <TouchableOpacity
            key={task._id || task.orderId || task.id || index}
            style={styles.orderCard}
            onPress={() => router.push({
                pathname: '/(worker)/productlist',
                params: { taskId: task._id || task.id || task.orderId }
            })}
        >
            <View style={styles.orderHead}>
                <View>
                    <Text style={styles.orderId}>#{task.orderId}</Text>
                    <Text style={styles.orderStore}>{task.storeName}</Text>
                </View>
                <View style={[styles.statusTag, getStatusStyle(task.status)]}>
                    <Text style={styles.statusText}>{getStatusLabel(task.status)}</Text>
                </View>
            </View>
            <View style={styles.orderFooter}>
                <Text style={styles.skuText}>
                    {task.pickedCount}/{task.totalCount} SKU
                </Text>
                    <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${getPct(task)}%`, backgroundColor: getProgressColor(getPct(task)) }]} />
                </View>
                <Text style={styles.pctText}>{getPct(task)}%</Text>
            </View>
        </TouchableOpacity>
    ))
)}
            </View>
            </ScrollView>
            <StaffBottomNav />
            </SafeAreaView>
)}
const styles = StyleSheet.create({
    // Màn hình tổng
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },

    // Scroll
    scrollArea: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    // Banner xanh phía trên
    banner: {
        backgroundColor: COLORS.primary,
        padding: 20,
        paddingBottom: 24,
    },
    bannerTop: {
        flexDirection: 'row',        // xếp 2 thứ nằm ngang
        justifyContent: 'space-between', // đẩy ra 2 đầu
        marginBottom: 20,
    },
    greeting: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
    },
    name: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 2,
    },
    zone: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginTop: 4,
    },
    shiftTime: {
        alignItems: 'flex-end',     // căn phải
    },
    shiftLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },
    shiftValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    // 3 chỉ số KPI
    kpiRow: {
        flexDirection: 'row',        // 3 ô nằm ngang
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 14,
    },
    kpiItem: {
        flex: 1,                     // chia đều 3 ô
        alignItems: 'center',
    },
    kpiValue: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
    },
    kpiLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        marginTop: 2,
    },
    kpiDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },

    // Vùng cuộn đơn hàng
    scroll: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 12,
    },

    // Thẻ đơn hàng
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,            // bo góc nhiều như em muốn
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',         // đổ bóng
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,                // đổ bóng trên Android
    },
    orderHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    orderId: {
        fontSize: 14,
        fontWeight: '700',
        color: '#222',
    },
    orderStore: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },

    // Tag trạng thái
    statusTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusOrange: { backgroundColor: '#fff7e0' },
    statusGreen:  { backgroundColor: '#e8f5e9' },
    statusGray:   { backgroundColor: '#f5f5f5' },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
    },

    // Thanh tiến độ
    orderFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    skuText: {
        fontSize: 12,
        color: '#888',
        width: 60,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#eee',
        borderRadius: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primaryLight,
        borderRadius: 10,
    },
    pctText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
        width: 36,
        textAlign: 'right',
    },

});