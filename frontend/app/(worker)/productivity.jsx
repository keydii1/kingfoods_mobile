import { View, Text, StyleSheet,
         ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';


// Thống kê cá nhân
const myStats = {
    skuPerHour: 45,
    target: 50,
    skuDone: 180,
    workHours: '4 giờ',
    progress: 72,
    status: 'Dưới mức ⚠️',
};
// Data dành cho stack
// Data cho stats
const stats = [
    {
        label: 'SKU đã pick',
        value: `${myStats.skuDone} mã`,
        color: COLORS.primary,
    },
    {
        label: 'Thời gian làm',
        value: myStats.workHours,
    },
    {
        label: 'Mục tiêu',
        value: `${myStats.target} SKU/h`,
        color: COLORS.primary,
    },
    {
        label: 'Trạng thái',
        value: myStats.status,
        color: COLORS.error,
    },
];

// Bảng xếp hạng
const leaderboard = [
    { rank: 1,  medal: '🥇', name: 'Trần Thị Lan',    zone: 'Khu Bánh & Kẹo',  sku: 72,  isMe: false },
    { rank: 2,  medal: '🥈', name: 'Nguyễn Văn Sơn',  zone: 'Khu Đồ Uống',     sku: 61,  isMe: false },
    { rank: 3,  medal: '🥉', name: 'Lê Minh Tùng',    zone: 'Khu Hóa Phẩm',   sku: 55,  isMe: false },
    { rank: 4,  medal: '4',  name: 'Phạm Thị Mai',    zone: 'Khu Bánh & Kẹo ⚠️', sku: 45, isMe: true },
    { rank: 5,  medal: '5',  name: 'Hoàng Văn Đức',   zone: 'Khu Khuyến Mãi', sku: 43,  isMe: false },
];
// COMPONENT 1 DÒNG STATS
function StatRow({label,value, color, isLast}){
    return (
        <>
        <View style = {styles.statRow}>
            <Text style = {styles.statLabel}>{label}</Text>
            <Text style = {[styles.statVal, color && {color},]}>{value}</Text>
                {!isLast && (
                <View style={styles.divider} />
            )}    
        </View>
        </>
    );
}
// component cho 1 dòng leaderboard
function LeaderRow({ item }) {
    return (
        <View style={[
            styles.leaderRow,
            item.isMe && styles.leaderRowMe ]}>

            <View style={[
                styles.rankBadge,
                item.rank <= 3 && styles.rankBadgeTop,
            ]}>
                <Text style={styles.rankText}>
                    {item.medal}
                </Text>
            </View>

            <View style={styles.leaderInfo}>
                <View style={styles.leaderNameRow}>
                    <Text style={styles.leaderName}>
                        {item.name}
                    </Text>

                    {item.isMe && (
                        <View style={styles.meTag}>
                            <Text style={styles.meTagText}>
                                BẠN
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={styles.leaderZone}>
                    {item.zone}
                </Text>

            </View>

            <View style={styles.leaderSku}>
                <Text
                    style={[
                        styles.leaderSkuVal,
                        {
                            color:
                                item.sku >= 50
                                    ? COLORS.primary
                                    : COLORS.error,
                        },
                    ]}
                >
                    {item.sku}
                </Text>

                <Text style={styles.leaderSkuUnit}>
                    SKU/h
                </Text>
            </View>

        </View>
    );
}

export default function ProductivityScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>

            {/* Header */}
            <View style={styles.header}>

                <TouchableOpacity
                    onPress={() => router.back()}
                >
                    <Text style={styles.backBtn}>‹</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Năng suất Picking
                </Text>

                <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>
                        LIVE
                    </Text>
                </View>

            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Alert */}
                <View style={styles.alert}>

                    <Text style={styles.alertIcon}>
                        ⚠️
                    </Text>

                    <View style={styles.alertBody}>

                        <Text style={styles.alertTitle}>
                            CẢNH BÁO NĂNG SUẤT THẤP!
                        </Text>

                        <Text style={styles.alertSub}>
                            Hiệu suất đang dưới mức 50 SKU/h.
                            Hãy tăng tốc để đạt mục tiêu ca!
                        </Text>

                    </View>

                </View>

                {/* Card năng suất */}
                <View style={styles.card}>

                    <Text style={styles.cardTitle}>
                        📊 Năng suất của tôi
                    </Text>

                    {/* Gauge */}
                    <View style={styles.gaugeCenter}>

                        <Text style={styles.gaugeValue}>
                            {myStats.skuPerHour}
                        </Text>

                        <Text style={styles.gaugeUnit}>
                            SKU/h
                        </Text>

                    </View>

                    {/* Stats */}
                    <View style={styles.statsGrid}>

                        {stats.map((item, index) => (
                            <StatRow
                                key={index}
                                label={item.label}
                                value={item.value}
                                color={item.color}
                                isLast={
                                    index === stats.length - 1
                                }
                            />
                        ))}

                    </View>

                    {/* Progress */}
                    <View style={styles.progressSection}>

                        <View style={styles.progressHeader}>

                            <Text style={styles.progressLabel}>
                                Tiến độ mục tiêu
                            </Text>

                            <Text
                                style={[
                                    styles.progressPct,
                                    { color: COLORS.error },
                                ]}
                            >
                                {myStats.progress}%
                            </Text>

                        </View>

                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width:
                                            `${myStats.progress}%`,
                                    },
                                ]}
                            />
                        </View>

                        <Text style={styles.progressHint}>
                            Cần thêm
                            {' '}
                            {myStats.target - myStats.skuPerHour}
                            {' '}
                            SKU/h để đạt mục tiêu
                        </Text>

                    </View>

                </View>

                {/* Leaderboard */}
                <View style={styles.card}>

                    <Text style={styles.cardTitle}>
                        🏆 Bảng xếp hạng – Ca sáng
                    </Text>

                    {leaderboard.map((item) => (
                        <LeaderRow
                            key={item.rank}
                            item={item}
                        />
                    ))}

                </View>

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

    backBtn: {
        fontSize: 28,
        color: COLORS.primary,
    },

    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#222',
    },

    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffebee',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 5,
    },

    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: COLORS.error,
    },

    liveText: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.error,
    },

    scroll: {
        flex: 1,
    },

    scrollContent: {
        padding: 16,
    },

    alert: {
        flexDirection: 'row',
        backgroundColor: COLORS.errorBg,
        borderRadius: 14,
        padding: 14,
        gap: 10,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.error,
    },

    alertIcon: {
        fontSize: 22,
    },

    alertBody: {
        flex: 1,
    },

    alertTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.error,
        marginBottom: 4,
    },

    alertSub: {
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },

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

    gaugeCenter: {
        alignItems: 'center',
        paddingVertical: 20,
    },

    gaugeValue: {
        fontSize: 64,
        fontWeight: '900',
        color: COLORS.error,
    },

    gaugeUnit: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },

    statsGrid: {
        gap: 4,
    },

    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },

    statLabel: {
        fontSize: 13,
        color: '#888',
    },

    statVal: {
        fontSize: 13,
        fontWeight: '700',
        color: '#222',
    },

    divider: {
        height: 0.5,
        backgroundColor: '#f0f0f0',
    },

    progressSection: {
        marginTop: 14,
    },

    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },

    progressLabel: {
        fontSize: 11,
        color: '#aaa',
    },

    progressPct: {
        fontSize: 11,
        fontWeight: '700',
    },

    progressBar: {
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        overflow: 'hidden',
    },

    progressFill: {
        height: '100%',
        backgroundColor: COLORS.error,
        borderRadius: 10,
    },

    progressHint: {
        fontSize: 11,
        color: COLORS.error,
        fontWeight: '600',
        marginTop: 6,
        textAlign: 'right',
    },

    leaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f5f5f5',
        gap: 12,
    },

    leaderRowMe: {
        backgroundColor: '#f0f7f0',
        borderRadius: 12,
        paddingHorizontal: 8,
    },

    rankBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },

    rankBadgeTop: {
        backgroundColor: 'transparent',
    },

    rankText: {
        fontSize: 20,
    },

    leaderInfo: {
        flex: 1,
    },

    leaderNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    leaderName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#222',
    },

    meTag: {
        backgroundColor: COLORS.primary,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },

    meTagText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
    },

    leaderZone: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },

    leaderSku: {
        alignItems: 'flex-end',
    },

    leaderSkuVal: {
        fontSize: 20,
        fontWeight: '800',
    },

    leaderSkuUnit: {
        fontSize: 10,
        color: '#aaa',
    },

});