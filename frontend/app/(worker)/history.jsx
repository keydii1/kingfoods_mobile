import { View, Text, StyleSheet,
         SectionList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { COLORS } from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';
import {getAssignedTasks} from '../../constants/services/api';

// Filter tags
const filters = [
    { id: 'all',     label: '🗂️ Tất cả'    },
    { id: 'pick',    label: '✅ Đã pick'    },
    { id: 'missing', label: '⚠️ Báo thiếu' },
    { id: 'move',    label: '🔄 Move'       },
];

// Mock data lịch sử — chia theo ngày
const allHistory = [
    {
        title: '📅 Hôm nay – 22/04/2026',
        data: [
            { id: '1', time: '15:42', icon: '📦', type: 'pick',
              title: 'Bánh quy Hải Hà (KF-00123)',
              sub: 'Kệ 12.03.A · Thùng BIN-401 · 5 hộp',
              status: 'ok', statusLabel: '✓ OK' },
            { id: '2', time: '15:28', icon: '⚠️', type: 'missing',
              title: 'Nước tương Chinsu 500ml',
              sub: 'Kệ 14.07.B · Báo thiếu hàng · 3 chai',
              status: 'skip', statusLabel: 'Thiếu' },
            { id: '3', time: '15:10', icon: '🔄', type: 'move',
              title: 'Sữa chua Vinamilk (KF-00456)',
              sub: 'BIN-205 → BIN-206 · Chuyển thùng',
              status: 'move', statusLabel: 'Move' },
            { id: '4', time: '14:55', icon: '📦', type: 'pick',
              title: 'Mì gói Hảo Hảo (KF-00789)',
              sub: 'Kệ 18.02.A · Thùng BIN-308 · 20 gói',
              status: 'ok', statusLabel: '✓ OK' },
        ],
    },
    {
        title: '📅 Hôm qua – 21/04/2026',
        data: [
            { id: '5', time: '16:30', icon: '📦', type: 'pick',
              title: 'Dầu ăn Neptune 1L (KF-01100)',
              sub: 'Kệ 09.03.C · Thùng BIN-210 · 6 chai',
              status: 'ok', statusLabel: '✓ OK' },
            { id: '6', time: '14:20', icon: '⚠️', type: 'missing',
              title: 'Snack Oishi Tôm 68g (KF-01024)',
              sub: 'Kệ 22.08.A · Báo thiếu · 12 gói',
              status: 'skip', statusLabel: 'Thiếu' },
        ],
    },
];

// Màu status
const statusColors = {
    ok:   COLORS.primary,
    skip: COLORS.warning,
    move: '#1565c0',
};

// Component 1 dòng lịch sử
function HistoryItem({ item }) {
    return (
        <View style={styles.historyItem}>
            <Text style={styles.itemTime}>{item.time}</Text>
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSub}>{item.sub}</Text>
            </View>
            <Text style={[styles.itemStatus,
                { color: statusColors[item.status] }]}>
                {item.statusLabel}
            </Text>
        </View>
    );
}

export default function HistoryScreen(){
        const [apiSections, setApiSections] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect (() => {
        async function fetchHistory(){
            try {
                const res = await getAssignedTasks(); // gọi API
                const tasks = Array.isArray(res) ? res : []; // kiểm tra xem dữ liệu có phải mảng k 
                const grouped = {}; // tạo object để theo nhóm ngày
                tasks.forEach(task => {
                    const date = task.createdAt ? new Date(task.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay';
                    if(!grouped[date]) grouped[date] = [];
                    grouped[date].push({
                        id : task.id,
                        time: task.updatedAt ? new Date(task.updatedAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'}): '',
                        icon: task.status === 'completed' ? '✅' :'📦',
                        type : 'pick',
                        sub: `${task.quantityPicked || 0} / ${task.quantityToPick || 0} SKU`,
                        status: task.status === 'completed' ? 'ok' : 'skip',
                        statusLabel: task.status === 'completed' ? '✓ OK' : 'Đang làm',
                    });
                });
                if(Object.keys(grouped).length > 0 ){
                    setApiSections (
                        Object.entries(grouped).map(([title, data]) => ({
                             title: `📅 ${title}`,
                             data
                        }))
                    );
                }
            }
            catch (err){
                // Giữ allHistory mock nếu lỗi 
            }
            finally {
                setLoading(false)
            }
        }
        fetchHistory();
    }, []);
    // Khi nhấn tag nào thì chỉ hiện những item thuộc loại đó. Đây là pattern active filter dùng
    const [filter, setFilter] = useState('all')
    // Dùng data từ API, fallback về mock nếu lỗi
    const sourceData = apiSections.length > 0 ? apiSections : allHistory;
    // Lọc data theo filter đang chọn
    const filteredSections = sourceData.map((section) =>({
        ...section,
        data: filter === 'all' ? section.data : section.data.filter((item) => item.type === filter),
    })).filter((section) => section.data.length > 0);
    return (
        <SafeAreaView style = {styles.safeArea}>
            {/* header */}
             <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backBtn}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch sử Picking</Text>
                <Text style={styles.searchIcon}>🔍</Text>
            </View>
            {/* Body */}
            {/* filter tag */}
            <View style = {styles.filterRow}>
                {filters.map((f) =>(
                    <TouchableOpacity 
                    key = {f.id}
                    style = {[styles.filterTag, filter === f.id && styles.filterTagActive]}
                    onPress = {() => setFilter(f.id)}>
                        <Text style = {[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {/* Danh sách lịch sử */}
            {loading ? (
                <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
                ) : (   
                <SectionList
                sections = {filteredSections}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => <HistoryItem item = {item} />}
                renderSectionHeader={({section}) => (
                    <Text style = {styles.sectionHeader}>{section.title}</Text>
                )}
                contentContainerStyle = {styles.list}
                ListEmptyComponent={
                    <View style = {styles.emptyBox}>
                        <Text style = {styles.emptyIcon}>🕐</Text>
                        <Text style = {styles.emptyText}>Không có lịch sử</Text>
                    </View>
                }
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
    searchIcon: { fontSize: 20 },

    // Filter
    filterRow: {
        flexDirection: 'row',
        padding: 12,
        gap: 8,
        backgroundColor: '#fff',
        flexWrap: 'wrap',
    },
    filterTag: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    filterTagActive: {
        backgroundColor: COLORS.successBg,
        borderColor: COLORS.accent,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#888',
    },
    filterTextActive: {
        color: COLORS.primary,
    },

    // List
    list: { padding: 12 },

    // Section Header
    sectionHeader: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.primary,
        letterSpacing: 0.5,
        paddingVertical: 8,
        paddingHorizontal: 4,
    },

    // History Item
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 12,
        marginBottom: 8,
        gap: 10,
    },
    itemTime: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
        width: 40,
    },
    itemIcon: { fontSize: 20 },
    itemBody: { flex: 1 },
    itemTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#222',
    },
    itemSub: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    itemStatus: {
        fontSize: 12,
        fontWeight: '700',
    },

    // Empty
    emptyBox: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 10,
    },
    emptyIcon: { fontSize: 40 },
    emptyText: {
        fontSize: 14,
        color: '#aaa',
    },
});