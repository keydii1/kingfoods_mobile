import {Text, View, SectionList, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useState, useEffect} from 'react';
import {ActivityIndicator, Alert} from 'react-native';
import {getIncidents} from '../../constants/services/api'
import {router, usePathname} from 'expo-router';
import {COLORS} from '../../constants/colors';

// Mockdata chia thành 2 section SectionList

const sections = [
    {
            title : 'Mới nhất',
        data: [
            {
            id : '1',
            icon: '',
            iconBg: '#ffebee',
            title : 'Hủy đơn khẩn cấp',
            message: '#KF-12349 – Bình Thạnh vừa bị hủy. Dừng pick ngay.',
            time: '2 phút trước - Quản lí Minh Tuấn',
            unread : true,
        },
        {
            id: '2',
            icon: '',
            iconBg: '#fff3e0',
            title: 'Thêm 5 SKU vào đơn #KF-12345',
            time: '15 phút trước · Hệ thống',
            message: 'Bánh quy Hải Hà, Nước suối Lavie 500ml đã được cập nhật',
            unread: true,
           
        },
        {
            id : '3',
            icon: '',
            iconBg: '#e3f2fd',
            title: 'Thay đổi vị trí của hàng',
            message: 'Chinsu 500ml đã chuyển từ kệ 12.03.A sang 12.07.B',
            time: '32 phút trước',
            unread: true,
        },
    ],  
    },
    {
        title: 'Trước đó',
        data: [
            {
                id: '4',
                icon: '',
                iconBg: '#e8f5e9',
                title: 'Bàn giao ca hoàn tất',
                message: 'Ca sáng bàn giao thành công 3 ghi chú cho ca chiều.',
                time: '1 giờ trước',
                unread: false,
            },
            {
                id: '5',
                icon: '',
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
            const res = await getIncidents();
            const paginated = res?.data || res;
            const items = Array.isArray(paginated) ? paginated : (paginated?.data || []);
            const sorted = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const newOnes = sorted.slice(0, 10).map(t => ({
                id: `inc-${t.id}`,
                iconBg: t.status === 'resolved' ? '#e8f5e9' : '#ffebee',
                title: t.reason || 'Sự cố',
                message: `${t.task?.product?.name || 'Sản phẩm'} · ${t.reporter?.name || 'Nhân viên'} báo cáo`,
                time: t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : '',
                unread: t.status !== 'resolved',
            }));
            if(newOnes.length > 0){
                setApiSections([
                    { title: 'Mới nhất', data: newOnes },
                ]);
            }
        } catch (err){
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
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
            ) : (
                       <SectionList
                style={{ flex: 1 }}
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
        paddingBottom: 20,
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
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Thông báo
    notifItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
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