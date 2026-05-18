import {Text, View, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {COLORS} from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';
import {handoverTask} from '../../constants/services/api';
import {useState} from 'react';

// Mockdata ghi chú bàn giao
const notes = [
     {
        id: '1', icon: 'ellipse', iconColor: COLORS.error,
        text: 'Đơn #KF-12348 (Gò Vấp) chưa pick. Ưu tiên ngay đầu ca chiều.',
        who: 'Phạm Thị Mai · 15:58',
    },
    {
        id: '2', icon: 'warning', iconColor: COLORS.warning,
        text: 'Kệ 14.07.B hết Chinsu. Hàng bổ sung lúc 17:00.',
        who: 'Phạm Thị Mai · 15:45',
    },
    {
        id: '3', icon: 'information-circle', iconColor: '#1565c0',
        text: 'BIN-205 có 8 SKU chờ xử lý move. Kiểm tra trước khi xuất.',
        who: 'Phạm Thị Mai · 15:30',
    },
];

// Mockdata hàng tồn kho
const pendingOrders = [
    {
        id: '#KF-12348', location: 'Gò Vấp',
        detail: '0/30 SKU · Ưu tiên cao',
        status: 'urgent', statusLabel: 'Cấp bách',
    },
    {
        id: '#KF-12347', location: 'Thủ Đức',
        detail: '40/48 SKU · 8 SKU đang thiếu',
        status: 'waiting', statusLabel: 'Chờ hàng',
    },
];

// Component 1 ghi chú
function NoteCard({note}) {
    return(
        <View style = {styles.noteCard}>
            <Ionicons name={note.icon} size={18} color={note.iconColor} style={{ marginRight: 6 }} />
            <View style = {styles.noteBody}>
                <Text style = {styles.noteText}>{note.text}</Text>
                <Text style = {styles.noteWho}>{note.who}</Text>
            </View>
        </View>
    );
}

// Component hàng tồn kho
function PendingOrder({order}){
    const tagStyle = order.status === 'urgent' ? styles.tagRed: styles.tagOrange;
    return(
        <View style = {styles.orderRow}>
            <View style = {[styles.orderDot, {backgroundColor: order.status === 'urgent' ? COLORS.error : COLORS.warning}]} />
            <View style = {styles.orderInfo}>
                <Text style = {styles.orderName}>{order.id} - {order.location}</Text>
                <Text style = {styles.orderDetail}>{order.detail}</Text>
            </View>
            <View style = {[styles.tag, tagStyle]}>
                <Text style = {styles.tagText}>{order.statusLabel}</Text>
            </View>
        </View>
    );
}

// component chung
function StatItem({ label, value, color }) {
    return (
        <View style={styles.statItem}>
             <Text style={[ styles.statValue,{ color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

export default function HandOverScreen(){
    const [submitting, setSubmitting] = useState(false);

    const handleHandover = async () => {
        setSubmitting(true);
        try {
            await handoverTask(0, 0);
            Alert.alert('Thành công', 'Bàn giao ca thành công');
            router.replace('/(worker)/dashboard');
        } catch (err) {
            Alert.alert('Lỗi', err.message || 'Không thể bàn giao ca');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style = {styles.safeArea}>
            {/* Header */}
            <View style = {styles.header}>
                <TouchableOpacity onPress = {() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style = {styles.headerTitle}>Bàn giao ca</Text>
                <View style = {styles.badge}>
                    <Text style = {styles.badgeText}>Ca chiều</Text>
                </View>
            </View>
            {/* Body */}
            <ScrollView     style={styles.scroll}
                            contentContainerStyle={styles.scrollContent}>
                {/* Card người bàn giao */}
                <View style = {styles.handoverCard}>
                    <View style = {styles.handoverHead}>
                        <View style={styles.handoverAvatarContainer}>
                            <Ionicons name="construct-outline" size={32} color={COLORS.primary} />
                        </View>
                        <View style = {styles.hanoverInfo}>
                            <Text style = {styles.handoverName}>Phạm Thị Mai - Ca sáng</Text>
                            <Text style = {styles.handoverSub}>Bàn giao lúc 16:00 · Khu Bánh & Kẹo</Text>
                        </View>
                    </View>
                    {/* Stat chỉ số của người bàn giao*/}
                     <View style={styles.statsRow}>
                        <StatItem
                            value="234"
                            label="SKU done"
                            color={COLORS.primary}
                        />
                        <View style={styles.statDivider} />
                        <StatItem
                            value="3"
                            label="Tồn đơn"
                            color={COLORS.warning}
                        />
                        <View style={styles.statDivider} />
                        <StatItem
                            value="5"
                            label="Thiếu hàng"
                            color={COLORS.error}
                        />
                    </View>
                </View>

                {/* Ghi chú bàn giao */}
                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Ghi chú bàn giao</Text>
                    {notes.map((note) => (
                        <NoteCard key = {note.id} note = {note}/>
                    ))}
                </View>

                {/* Đơn hàng tồn */}
                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Đơn hàng tồn</Text>
                    {pendingOrders.map((order) =>(
                        <PendingOrder key = {order.id} order = {order} />
                    ))}
                </View>

                {/* Nút xác nhận nhận ca */}
                <TouchableOpacity
                    style={[styles.btnHandover, submitting && { opacity: 0.7 }]}
                    onPress={handleHandover}
                    disabled={submitting}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                        <Text style={styles.btnHandoverText}>
                            {submitting ? 'Đang bàn giao...' : 'Xác nhận bàn giao ca'}
                        </Text>
                    </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backBtn: { fontSize: 28, color: COLORS.primary },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
    badge: {
        backgroundColor: COLORS.warningBg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: { color: '#e65100', fontSize: 12, fontWeight: '600' },

    scroll: {
        flex: 1,
    },

    scrollContent: {
        padding: 16,
    },

    // Handover Card
    handoverCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    handoverHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    handoverAvatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e8f5e9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    handoverAvatar: { fontSize: 36 },
    handoverInfo: { flex: 1 },
    handoverName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#222',
    },
    handoverSub: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#eee',
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

    // Note Card
    noteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f5f5f5',
    },
    noteIcon: { fontSize: 18 },
    noteBody: { flex: 1 },
    noteText: {
        fontSize: 13,
        color: '#333',
        lineHeight: 18,
    },
    noteWho: {
        fontSize: 11,
        color: '#aaa',
        marginTop: 4,
    },

    // Order Row
    orderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f5f5f5',
        gap: 10,
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
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    tagRed:    { backgroundColor: COLORS.errorBg },
    tagOrange: { backgroundColor: COLORS.warningBg },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
    },

    btnHandover: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginBottom: 24,
    },
    btnHandoverText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
});