import {Text, View, SectionList, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useState, useEffect} from 'react';
import {ActivityIndicator, Alert} from 'react-native';
import {getAssignedTasks} from '../../constants/services/api'
import {router, usePathname} from 'expo-router';
import {COLORS} from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';

// Mockdata chia thành 2 section SectionList

const sections = [
    {
        title : '🔔 Mới nhất',
        data: [
            {
            id : '1',
            icon: '🚨',
            iconBg: '#ffebee',
            title : 'Hủy đơn khẩn cấp',
            message: '#KF-12349 – Bình Thạnh vừa bị hủy. Dừng pick ngay.',
            time: '2 phút trước - Quản lí Minh Tuấn',
            unread : true,
        },
        {
            id: '2',
            icon: '📦',
            iconBg: '#fff3e0',
            title: 'Thêm 5 SKU vào đơn #KF-12345',
            time: '15 phút trước · Hệ thống',
            message: 'Bánh quy Hải Hà, Nước suối Lavie 500ml đã được cập nhật',
            unread: true,
           
        },
        {
            id : '3',
            icon: '📍',
            iconBg: '#e3f2fd',
            title: 'Thay đổi vị trí của hàng',
            message: 'Chinsu 500ml đã chuyển từ kệ 12.03.A sang 12.07.B',
            time: '32 phút trước',
            unread: true,
        },
    ],  
    },
    {
        title: '📋 Trước đó',
        data: [
            {
                id: '4',
                icon: '✅',
                iconBg: '#e8f5e9',
                title: 'Bàn giao ca hoàn tất',
                message: 'Ca sáng bàn giao thành công 3 ghi chú cho ca chiều.',
                time: '1 giờ trước',
                unread: false,
            },
            {
                id: '5',
                icon: '⚠️',
                iconBg: '#fff3e0',
                title: 'Cảnh báo năng suất',
                message: 'Năng suất 10:00–11:00 chỉ đạt 43 SKU/h, dưới mức 50.',
                time: '3 giờ trước',
                unread: false,
            },
        ],
    },
];

// Component cho thông báo
function NotifItem({item}){
    return (
        <TouchableOpacity
        style = {[styles.notifItem, item.unread && styles.notifUnread]}>
            {/* Icon */}
            <View style = {[styles.notifIcon, {backgroundColor:item.iconBg}]}>
                <Text style = {styles.notifIconText}>{item.icon}</Text>
            </View>
            {/* Nội dung */}
            <View style = {styles.notifBody}>
                <Text style = {styles.notifTitle}>{item.title}</Text>
                <Text style = {styles.notifMessage}>{item.message}</Text>
                <Text style = {styles.notifTime}>{item.time}</Text>
            </View>
            {/* Hiển thị chấm màu xanh nếu chưa đọc */}
            {item.unread && <View style = {styles.unreadDot} />}
        </TouchableOpacity>
    );
}

export default function NotificationScreen(){
    const [apiSections, setApiSections] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() =>{
        async function fetchNotification(){
            try{
            const res = await getAssignedTasks();
            const tasks = Array.isArray(res) ? res : [];
            const newOnes = tasks
            .filter(t => t.status !== 'completed')
            .map((t, i) => ({
                id: `new-${t.id}`,
                icon: '📦', iconBg: '#e3f2fd',
                title: `Đang pick: ${t.orderDetail?.product?.name || 'Sản phẩm'}`,
                message: `${t.quantityPicked}/${t.quantityToPick} · ${t.orderDetail?.order?.branch?.name || ''}`,
                time: t.createdAt ? new Date(t.createdAt).toLocaleTimeString('vi-VN') : ' ',
                unread: true,
            }));
            const old = tasks
            .filter(t => t.status === 'completed')
            .map(t => ({
                id: `old-${t.id}`,
                icon: '✅', iconBg: '#e8f5e9',
                title: `Hoàn thành: ${t.orderDetail?.product?.name || 'Sản phẩm'}`,
                message: `${t.quantityToPick} cái · ${t.orderDetail?.order?.branch?.name || ''}`,
                time: t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString('vi-VN') : ' ',
                unread: false
            }));
            if(newOnes.length > 0 || old.length > 0){
                setApiSections([
                    { title: '🔔 Mới nhất', data: newOnes },
                    { title: '📋 Trước đó', data: old },
                ]);
            }
        } catch (err){
            //  giữ mockdata nếu lõi
        } finally {
            setLoading(false);
        }
    }
        fetchNotification();
    }, []);
    const displaySections = apiSections.length > 0 ? apiSections : sections;
    const unreadCount = displaySections.reduce((sum, sec) => sum + sec.data.filter(i => i.unread).length, 0);

    return(
        <SafeAreaView style = {styles.safeArea}>
            {/* Header */}
            <View style = {styles.header}>
                <TouchableOpacity onPress = {() => router.back()}>
                    <Text style = {styles.backBtn}>‹</Text>
                     </TouchableOpacity>
                    <Text style = {styles.headerTitle}>Thông báo</Text>
                    <View style = {styles.badge}>
                        <Text style = {styles.badgeText}>{unreadCount} mới</Text>
                    </View>
            </View>
            {/* Danh sách thông báo */}
            {loading ? (
                <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
            ) : (
                       <SectionList
                sections={displaySections}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <NotifItem item={item} />}
                renderSectionHeader={({ section }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {section.title}
                        </Text>
                    </View>
                )}
                contentContainerStyle={styles.list}
            />
            )}
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

    // List
    list: {
        padding: 12,
    },

    // Section Header
    sectionHeader: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#888',
    },

    // Thông báo
    notifItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        gap: 12,
    },
    notifUnread: {
        backgroundColor: '#f0f7f0',
        borderLeftWidth: 3,
        borderLeftColor: COLORS.accent,
    },
    notifIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notifIconText: { fontSize: 20 },
    notifBody: { flex: 1 },
    notifTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#222',
        marginBottom: 4,
    },
    notifMessage: {
        fontSize: 12,
        color: '#555',
        lineHeight: 18,
        marginBottom: 6,
    },
    notifTime: {
        fontSize: 11,
        color: '#aaa',
    },
    unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginTop: 4,
},
});