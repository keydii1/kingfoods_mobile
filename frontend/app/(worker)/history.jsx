import { View, Text, StyleSheet, SectionList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';
import {getAssignedTasks} from '../../constants/services/api';

// Filter tags
const filters = [
    { id: 'all',     icon: 'folder-open-outline', label: 'Tất cả', color: '#888' },
    { id: 'pick',    icon: 'checkmark-circle-outline', label: 'Đã pick', color: COLORS.primary },
    { id: 'missing', icon: 'alert-circle-outline', label: 'Báo thiếu', color: COLORS.warning },
    { id: 'move',    icon: 'swap-horizontal-outline', label: 'Move', color: '#1565c0' },
];

// Mock data lịch sử — chia theo ngày
const allHistory = [
    {
        title: 'Hôm nay – 22/04/2026',
        data: [
            { id: '1', time: '15:42', icon: 'cube-outline', type: 'pick',
              title: 'Bánh quy Hải Hà (KF-00123)',
              sub: 'Kệ 12.03.A · Thùng BIN-401 · 5 hộp',
              status: 'ok', statusLabel: '✓ OK' },
            { id: '2', time: '15:28', icon: 'alert-circle-outline', type: 'missing',
              title: 'Nước tương Chinsu 500ml',
              sub: 'Kệ 14.07.B · Báo thiếu hàng · 3 chai',
              status: 'skip', statusLabel: 'Thiếu' },
            { id: '3', time: '15:10', icon: 'swap-horizontal-outline', type: 'move',
              title: 'Sữa chua Vinamilk (KF-00456)',
              sub: 'BIN-205 → BIN-206 · Chuyển thùng',
              status: 'move', statusLabel: 'Move' },
            { id: '4', time: '15:55', icon: 'cube-outline', type: 'pick',
              title: 'Mì gói Hảo Hảo (KF-00789)',
              sub: 'Kệ 18.02.A · Thùng BIN-308 · 20 gói',
              status: 'ok', statusLabel: '✓ OK' },
        ],
    },
    {
        title: 'Hôm qua – 21/04/2026',
        data: [
            { id: '5', time: '16:30', icon: 'cube-outline', type: 'pick',
              title: 'Dầu ăn Neptune 1L (KF-01100)',
              sub: 'Kệ 09.03.C · Thùng BIN-210 · 6 chai',
              status: 'ok', statusLabel: '✓ OK' },
            { id: '6', time: '14:20', icon: 'alert-circle-outline', type: 'missing',
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
            <Ionicons name={item.icon} size={20} color={statusColors[item.status] || '#666'} />
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
                const tasks = Array.isArray(res) ? res : [];
                const grouped = {};
                tasks.forEach(task => {
                    const date = task.createdAt ? new Date(task.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay';
                    if(!grouped[date]) grouped[date] = [];
                    grouped[date].push({
                        id : task.id,
                        time: task.updatedAt ? new Date(task.updatedAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'}): '',
                        icon: task.status === 'completed' ? 'checkmark-circle-outline' : 'cube-outline',
                        type : 'pick',
                        sub: `${task.quantityPicked || 0} / ${task.quantityToPick || 0} SKU`,
                        status: task.status === 'completed' ? 'ok' : 'skip',
                        statusLabel: task.status === 'completed' ? '✓ OK' : 'Đang làm',
                    });
                });
                if(Object.keys(grouped).length > 0 ){
                    setApiSections (
                        Object.entries(grouped).map(([title, data]) => ({
                             title: title,
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
    const sourceData = apiSections.length > 0 ? apiSections : allHistory;
    const filteredSections = sourceData.map((section) =>({
        ...section,
        data: filter === 'all' ? section.data : section.data.filter((item) => item.type === filter),
    })).filter((section) => section.data.length > 0);
    return (
        <SafeAreaView style = {styles.safeArea}>
            {/* header */}
             <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch sử Picking</Text>
                <TouchableOpacity onPress={() => Alert.alert('Tìm kiếm', 'Chức năng tìm kiếm')}>
                    <Ionicons name="search-outline" size={20} color="#222" />
                </TouchableOpacity>
            </View>
            {/* Body */}
            {/* filter tag */}
            <View style = {styles.filterRow}>
                {filters.map((f) =>(
                    <TouchableOpacity 
                    key = {f.id}
                    style = {[styles.filterTag, filter === f.id && styles.filterTagActive]}
                    onPress = {() => setFilter(f.id)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons 
                                name={f.icon} 
                                size={16} 
                                color={filter === f.id ? COLORS.primary : f.color} 
                            />
                            <Text style = {[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
                        </View>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0f4f1', paddingVertical: 8, paddingHorizontal: 4 }}>
                        <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                        <Text style = {styles.sectionHeader}>{section.title}</Text>
                    </View>
                )}
                contentContainerStyle = {styles.list}
                ListEmptyComponent={
                    <View style = {styles.emptyBox}>
                        <Ionicons name="hourglass-outline" size={40} color="#aaa" />
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