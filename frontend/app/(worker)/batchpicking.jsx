import { View, Text, StyleSheet,
         ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { COLORS } from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';
import {getAssignedTasks} from '../../constants/services/api';
// Danh sách item cần pick
const batchItems = [
    {
        id: '1', location: '12.03\n.A',
        name: 'Bánh quy Hải Hà 200g (5 hộp)',
        bins: [{ color: '#fff3e0', text: '#e65100', label: '🟡 BIN-401 (Q.7)' }],
        done: true, isCurrent: false,
    },
    {
        id: '2', location: '14.07\n.B',
        name: 'Nước tương Chinsu 500ml (3 chai)',
        bins: [{ color: '#fff3e0', text: '#e65100', label: '🟡 BIN-401 (Q.7)' }],
        done: false, isCurrent: true,
    },
    {
        id: '3', location: '18.02\n.A',
        name: 'Mì gói Hảo Hảo (20 gói)',
        bins: [
            { color: '#e8f5e9', text: '#2e7d32', label: '🟢 BIN-402' },
            { color: '#e3f2fd', text: '#1565c0', label: '🔵 BIN-403' },
        ],
        done: false, isCurrent: false,
    },
];

// Component bin chip
function BinChip({ bin }) {
    return (
        <View style={[styles.binChip, { backgroundColor: bin.color }]}>
            <Text style={[styles.binChipText, { color: bin.text }]}>
                {bin.label}
            </Text>
        </View>
    );
}

// Component 1 batch item
function BatchItem({ item, onToggle }) {
    return (
        <TouchableOpacity
            style={[
                styles.batchItem,
                item.isCurrent && styles.batchItemCurrent,
                item.done && styles.batchItemDone,
            ]}
            onPress={() => onToggle(item.id)}
        >
            {/* Vị trí kệ */}
            <View style={[styles.locTag,
                item.isCurrent && styles.locTagCurrent]}>
                <Text style={styles.locText}>{item.location}</Text>
            </View>

            {/* Thông tin */}
            <View style={styles.itemInfo}>
                <Text style={[styles.itemName,
                    item.done && styles.itemNameDone]}>
                    {item.name}
                </Text>
                <View style={styles.binsRow}>
                    <Text style={styles.arrowText}>→ </Text>
                    {item.bins.map((bin, i) => (
                        <BinChip key={i} bin={bin} />
                    ))}
                </View>
            </View>

            {/* Checkbox */}
            <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
                {item.done && <Text style={styles.checkmark}>✓</Text>}
            </View>
        </TouchableOpacity>
    );
}

export default function BatchPickingScreen() {
    const [items, setItems] = useState(batchItems);
    const [loading, setLoading] = useState(true);
    useEffect(() =>{
        async function fetchBatch(){
            try{
                const res = await getAssignedTasks();
                const tasks = Array.isArray(res) ? res : [];
                const allItems = tasks
                .filter(t => t.status !== 'completed')
                .map((t, ti) => ({
                    id: t.id,
                    location: t.location?.name || '',
                    name: `${t.orderDetail?.product?.name || 'Sản phẩm'} (${t.quantityToPick} cái)`,
                    bins: [{
                        color: '#fff3e0',
                         text: '#e65100',
                        label: `🟡 BIN-${t.orderDetail?.order?.id || t.id}`
                    }],
                    done: false,
                    isCurrent: ti === 0
                }));
                if(allItems.length > 0 ) {
                    setItems(allItems);
                }
            } catch(err){
                // giữ mock data nếu lỗi
            }
            finally {
                setLoading(false);
            }
        }
        fetchBatch();
    }, []);
    // Toggle done khi nhấn vào item
    function handleToggle(id) {
        setItems(prev => prev.map((item) =>
            item.id === id
                ? { ...item, done: !item.done, isCurrent: false }
                : item
        ));
    }

    const doneCount = items.filter((i) => i.done).length;
    const batchStats = [
        { value: String(items.length), label: 'Tổng SKU' },
        { value: String(new Set(items.map(i => i.location)).size), label: 'Vị trí kệ' },
        { value: String(new Set(items.flatMap(i => i.bins.map(b => b.label))).size), label: 'Thùng đích' },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backBtn}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Batch Picking</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{items.length} Đơn</Text>
                </View>
            </View>

            <ScrollView style={styles.scroll}>

                {/* Banner batch */}
                <View style={styles.batchBanner}>
                    <Text style={styles.bannerTitle}>
                        🚀 Pick nhiều đơn cùng lúc
                    </Text>
                    <Text style={styles.bannerSub}>
                        Nhặt hàng cho 3 đơn trong 1 chuyến → Giảm 40% quãng đường
                    </Text>
                    <View style={styles.batchStats}>
                        {batchStats.map((stat) => (
                            <View key={stat.label} style={styles.batchStat}>
                                <Text style={styles.batchStatVal}>
                                    {stat.value}
                                </Text>
                                <Text style={styles.batchStatLabel}>
                                    {stat.label}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Alert */}
                <View style={styles.alert}>
                    <Text style={styles.alertIcon}>💡</Text>
                    <View style={styles.alertBody}>
                        <Text style={styles.alertTitle}>
                            Hệ thống đã gộp & sắp thứ tự
                        </Text>
                        <Text style={styles.alertSub}>
                            Đi theo thứ tự kệ → dừng ở mỗi kệ → 
                            bỏ đúng thùng màu tương ứng.
                        </Text>
                    </View>
                </View>

                {/* Danh sách */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        📋 Thứ tự Pick ({doneCount}/{items.length} xong)
                    </Text>
                    {loading ? (
                        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
                    ) : (
                        items.map((item) => (
                            <BatchItem
                                key={item.id}
                                item={item}
                                onToggle={handleToggle}
                            />
                        ))
                    )}
                </View>

                {/* Nút quét mã */}
                <TouchableOpacity style={styles.btnScan}>
                    <Text style={styles.btnScanText}>
                        📷 QUÉT MÃ – KỆ 14.07.B
                    </Text>
                </TouchableOpacity>

            </ScrollView>

        <StaffBottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f4f1' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', padding: 16,
        backgroundColor: '#fff', borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backBtn: { fontSize: 28, color: COLORS.primary },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
    badge: {
        backgroundColor: '#f3e5f5', paddingHorizontal: 10,
        paddingVertical: 4, borderRadius: 20,
    },
    badgeText: { color: '#7b1fa2', fontSize: 12, fontWeight: '600' },
    scroll: { flex: 1, padding: 16 },
    batchBanner: {
        background: '#4a0072',
        backgroundColor: '#4a0072',
        borderRadius: 18, padding: 16, marginBottom: 12,
    },
    bannerTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
    bannerSub: {
        color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4,
    },
    batchStats: { flexDirection: 'row', gap: 10, marginTop: 12 },
    batchStat: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 10, padding: 10, alignItems: 'center',
    },
    batchStatVal: { color: '#fff', fontSize: 18, fontWeight: '900' },
    batchStatLabel: { color: 'rgba(255,255,255,0.7)',
        fontSize: 10, marginTop: 2 },
    alert: {
        flexDirection: 'row', backgroundColor: '#e3f2fd',
        borderRadius: 14, padding: 14, gap: 10, marginBottom: 12,
        borderLeftWidth: 4, borderLeftColor: '#1976d2',
    },
    alertIcon: { fontSize: 22 },
    alertBody: { flex: 1 },
    alertTitle: { fontSize: 13, fontWeight: '700',
        color: '#1565c0', marginBottom: 4 },
    alertSub: { fontSize: 12, color: '#555', lineHeight: 18 },
    card: {
        backgroundColor: '#fff', borderRadius: 16,
        padding: 16, marginBottom: 12,
    },
    cardTitle: { fontSize: 14, fontWeight: '700',
        color: '#222', marginBottom: 12 },
    batchItem: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: '#fff', borderRadius: 14, padding: 12,
        marginBottom: 8, gap: 10, borderWidth: 1.5,
        borderColor: 'transparent',
    },
    batchItemCurrent: {
        borderColor: '#7b1fa2', backgroundColor: '#fdf0ff',
    },
    batchItemDone: { opacity: 0.5 },
    locTag: {
        backgroundColor: '#37474f', borderRadius: 8,
        padding: 6, alignItems: 'center', minWidth: 50,
    },
    locTagCurrent: { backgroundColor: '#7b1fa2' },
    locText: { color: '#fff', fontSize: 11,
        fontWeight: '900', textAlign: 'center' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 12, fontWeight: '700', color: '#222' },
    itemNameDone: { color: '#aaa', textDecorationLine: 'line-through' },
    binsRow: { flexDirection: 'row', flexWrap: 'wrap',
        alignItems: 'center', marginTop: 4 },
    arrowText: { fontSize: 12, color: '#888' },
    binChip: {
        borderRadius: 6, paddingHorizontal: 6,
        paddingVertical: 2, marginRight: 4, marginTop: 2,
    },
    binChipText: { fontSize: 10, fontWeight: '700' },
    checkbox: {
        width: 24, height: 24, borderRadius: 8,
        borderWidth: 2, borderColor: '#ddd',
        alignItems: 'center', justifyContent: 'center',
    },
    checkboxDone: {
        backgroundColor: COLORS.successBg,
        borderColor: COLORS.accent,
    },
    checkmark: { color: COLORS.primary, fontSize: 13, fontWeight: '800' },
    btnScan: {
        backgroundColor: '#4a0072', borderRadius: 16,
        padding: 18, alignItems: 'center', marginBottom: 24,
    },
    btnScanText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});