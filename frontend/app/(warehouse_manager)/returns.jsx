import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { traceContainer, reportItemIssue, getAllTasksAdmin } from '../../constants/services/api';
import { Alert } from '../../utils/appAlert';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { playSound } from '../../utils/soundService';
import ManagerBottomNav from '../../components/ManagerBottomNav';

const cleanLocationName = (name) => {
    if (!name) return '—';
    return name.replace(/^[🥦🥫🧴❄️\s]+/, '').replace(/^[^a-zA-Z0-9À-ỹđĐ\s]+/, '').trim();
};

export default function ReturnsScreen() {
    const { darkMode } = useAppPreferences();

    const activeBg = darkMode ? '#121212' : '#f0f4f1';
    const activeHeaderBg = darkMode ? '#1e1e1e' : '#fff';
    const activeBorderColor = darkMode ? '#2d2d2d' : '#eee';
    const activeTextColor = darkMode ? '#f3f4f6' : '#222';
    const activeCardBg = darkMode ? '#1e1e1e' : '#fff';
    const activeTextGrayColor = darkMode ? '#9ca3af' : '#666';
    const activeInputBg = darkMode ? '#2d2d2d' : '#f8f9fa';

    // Search and data states
    const [searchType, setSearchType] = useState('container'); // 'container' or 'order'
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Results states
    const [traceResult, setTraceResult] = useState(null); // container traceability
    const [orderTasks, setOrderTasks] = useState([]); // order picking tasks

    // Penalty states
    const [selectedItemForPenalty, setSelectedItemForPenalty] = useState(null);
    const [penaltyStatus, setPenaltyStatus] = useState('damaged'); // 'damaged' or 'lost'
    const [submittingPenalty, setSubmittingPenalty] = useState(false);
    const [penaltyResult, setPenaltyResult] = useState(null); // result of penalty report from backend

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập mã thùng hàng hoặc mã đơn hàng');
            return;
        }

        setLoading(true);
        setTraceResult(null);
        setOrderTasks([]);
        setPenaltyResult(null);

        try {
            if (searchType === 'container') {
                const res = await traceContainer(searchQuery.trim().toUpperCase());
                setTraceResult(res);
                playSound('success');
            } else {
                // Tracing by Order ID
                const orderId = parseInt(searchQuery.trim());
                if (isNaN(orderId)) {
                    throw new Error('Mã đơn hàng phải là một số hợp lệ');
                }
                const res = await getAllTasksAdmin({ orderId });
                const arr = res && Array.isArray(res.data) ? res.data : [];
                // Filter tasks belonging to this order
                const filtered = arr.filter(t => t.orderDetail?.order?.id === orderId);
                
                if (filtered.length === 0) {
                    Alert.alert('Thông tin', `Không tìm thấy nhiệm vụ pick hàng nào cho đơn #${orderId}`);
                } else {
                    setOrderTasks(filtered);
                    playSound('success');
                }
            }
        } catch (err) {
            Alert.alert('Lỗi truy xuất', err.message || 'Không tìm thấy dữ liệu khớp');
        } finally {
            setLoading(false);
        }
    };

    const handlePenalizePicker = async () => {
        if (!selectedItemForPenalty) return;

        setSubmittingPenalty(true);
        try {
            const res = await reportItemIssue(selectedItemForPenalty.itemId, { status: penaltyStatus });
            setPenaltyResult(res);
            setSelectedItemForPenalty(null);
            playSound('success');
            Alert.alert('Thành công', 'Đã ghi nhận sự cố hỏng/thiếu hàng và truy quét nhân viên chịu trách nhiệm!');
            
            // Re-fetch container list to update statuses
            if (searchQuery.trim()) {
                const updated = await traceContainer(searchQuery.trim().toUpperCase());
                setTraceResult(updated);
            }
        } catch (err) {
            Alert.alert('Lỗi kỉ luật', err.message || 'Không thể gửi báo cáo kỉ luật');
        } finally {
            setSubmittingPenalty(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg }]}>

            {/* Header */}
            <View style={[styles.header, { backgroundColor: activeHeaderBg, borderBottomColor: activeBorderColor }]}>
                <TouchableOpacity onPress={() => router.replace('/managerdashboard')}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: activeTextColor }]}>Truy xuất QA & Kỷ luật</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* Section Toggle */}
                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[
                            styles.toggleBtn,
                            { backgroundColor: darkMode ? '#2d2d2d' : '#fff', borderColor: activeBorderColor },
                            searchType === 'container' && [styles.toggleActiveBtn, { borderColor: COLORS.primary }]
                        ]}
                        onPress={() => {
                            setSearchType('container');
                            setSearchQuery('');
                            setTraceResult(null);
                            setOrderTasks([]);
                            setPenaltyResult(null);
                        }}
                    >
                        <Ionicons name="cube-outline" size={16} color={searchType === 'container' ? '#fff' : activeTextGrayColor} />
                        <Text style={[styles.toggleBtnText, { color: activeTextGrayColor }, searchType === 'container' && styles.toggleActiveBtnText]}>
                            Truy xuất Thùng
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.toggleBtn,
                            { backgroundColor: darkMode ? '#2d2d2d' : '#fff', borderColor: activeBorderColor },
                            searchType === 'order' && [styles.toggleActiveBtn, { borderColor: COLORS.primary }]
                        ]}
                        onPress={() => {
                            setSearchType('order');
                            setSearchQuery('');
                            setTraceResult(null);
                            setOrderTasks([]);
                            setPenaltyResult(null);
                        }}
                    >
                        <Ionicons name="receipt-outline" size={16} color={searchType === 'order' ? '#fff' : activeTextGrayColor} />
                        <Text style={[styles.toggleBtnText, { color: activeTextGrayColor }, searchType === 'order' && styles.toggleActiveBtnText]}>
                            Truy xuất Đơn hàng
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchCard, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]}>
                    <Text style={[styles.searchLabel, { color: activeTextColor }]}>
                        {searchType === 'container' ? 'Nhập mã Thùng hàng sỉ cần truy xuất:' : 'Nhập mã số Đơn hàng cần truy xuất:'}
                    </Text>
                    <View style={styles.searchRow}>
                        <TextInput
                            style={[styles.searchInput, { backgroundColor: activeInputBg, color: activeTextColor, borderColor: activeBorderColor }]}
                            placeholder={searchType === 'container' ? 'Ví dụ: C001, C002...' : 'Ví dụ: 1067, 1066...'}
                            placeholderTextColor={darkMode ? '#64748b' : '#aaa'}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize={searchType === 'container' ? 'characters' : 'none'}
                            keyboardType={searchType === 'order' ? 'numeric' : 'default'}
                        />
                        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Ionicons name="search" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Penalty Result Announcement (Labor Disciplinary record) */}
                {penaltyResult && (
                    <View style={[styles.penaltyCard, { backgroundColor: darkMode ? '#3b181a' : '#ffebee', borderColor: darkMode ? '#7f1d1d' : '#ffcdd2' }]}>
                        <View style={styles.penaltyHeader}>
                            <Ionicons name="alert-circle" size={28} color="#e53935" />
                            <Text style={styles.penaltyTitle}>BIÊN BẢN KỶ LUẬT LAO ĐỘNG</Text>
                        </View>
                        
                        <View style={styles.penaltyBody}>
                            <Text style={[styles.penaltyText, { color: darkMode ? '#cbd5e1' : '#333' }]}>
                                <Text style={styles.boldText}>Nhân viên chịu trách nhiệm: </Text>
                                {penaltyResult.culprit?.name || 'Nhân viên kho'} ({penaltyResult.culprit?.username || 'N/A'}) - SĐT: {penaltyResult.culprit?.phoneNumber || 'N/A'}
                            </Text>
                            <Text style={[styles.penaltyText, { color: darkMode ? '#cbd5e1' : '#333' }]}>
                                <Text style={styles.boldText}>Sản phẩm bị lỗi/báo thiếu: </Text>
                                {penaltyResult.itemDetails?.productName || 'Sản phẩm'} (SL: {penaltyResult.itemDetails?.quantity || 1})
                            </Text>
                            <Text style={[styles.penaltyText, { color: darkMode ? '#cbd5e1' : '#333' }]}>
                                <Text style={styles.boldText}>Hành vi vi phạm: </Text>
                                {penaltyResult.itemDetails?.issue === 'damaged' ? 'Làm hỏng/vỡ nát bao bì sản phẩm' : 'Xếp thiếu số lượng đơn sỉ khi đóng thùng'}
                            </Text>
                            
                            <View style={styles.penaltyDivider} />
                            
                            <Text style={styles.penaltyAction}>
                                ⚖️ <Text style={styles.boldText}>Hình thức xử lý kỉ luật: </Text>
                                Ghi nhận lỗi vào Hồ sơ Nhân viên, cảnh cáo toàn kho và khấu trừ trực tiếp vào kết quả đánh giá năng suất (KPI) ngày hôm nay!
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.closePenaltyBtn} onPress={() => setPenaltyResult(null)}>
                            <Text style={styles.closePenaltyText}>Xác nhận & Đóng hồ sơ</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Loading indicator */}
                {loading && (
                    <ActivityIndicator color={COLORS.primary} size="large" style={{ marginVertical: 40 }} />
                )}

                {/* ── CONTAINER TRACE RESULT ── */}
                {traceResult && (
                    <View style={styles.resultsContainer}>
                        
                        {/* Container Meta Card */}
                        <View style={[styles.metaCard, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <View style={styles.metaIconCircle}>
                                    <Ionicons name="cube" size={24} color="#fff" />
                                </View>
                                <View>
                                    <Text style={[styles.metaTitle, { color: activeTextColor }]}>{traceResult.containerInfo?.name || 'Thùng hàng'}</Text>
                                    <Text style={[styles.metaSub, { color: activeTextGrayColor }]}>Mã thùng: {traceResult.containerInfo?.code}</Text>
                                </View>
                            </View>
                            <View style={styles.metaGrid}>
                                <View style={styles.metaItem}>
                                    <Text style={[styles.metaLabel, { color: activeTextGrayColor }]}>Sức chứa</Text>
                                    <Text style={[styles.metaValue, { color: activeTextColor }]}>{traceResult.containerInfo?.capacity} cái</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Text style={[styles.metaLabel, { color: activeTextGrayColor }]}>Đang chứa</Text>
                                    <Text style={[styles.metaValue, { color: COLORS.primary }]}>{traceResult.containerInfo?.currentUsage} cái</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Text style={[styles.metaLabel, { color: activeTextGrayColor }]}>Trạng thái</Text>
                                    <Text style={[styles.metaValue, { color: traceResult.containerInfo?.status === 'active' ? COLORS.success : COLORS.error }]}>
                                        {traceResult.containerInfo?.status === 'active' ? '🟢 Đang hoạt động' : '🔴 Niêm phong'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Picked Items List */}
                        <Text style={[styles.sectionTitle, { color: activeTextColor }]}>Lịch sử đóng thùng & Định danh Picker:</Text>
                        
                        {traceResult.pickedItems && traceResult.pickedItems.length > 0 ? (
                            traceResult.pickedItems.map((item, idx) => {
                                const isDamaged = item.status === 'damaged';
                                const isLost = item.status === 'lost';
                                const isGood = item.status === 'good';

                                return (
                                    <View key={idx} style={[styles.itemCard, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]}>
                                        <View style={styles.itemHeader}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.itemName, { color: activeTextColor }]}>{item.product?.name || 'Sản phẩm'}</Text>
                                                <Text style={[styles.itemMeta, { color: activeTextGrayColor }]}>Số lượng đóng: <Text style={{ fontWeight: '750', color: COLORS.primary }}>{item.quantity} cái</Text> · Đơn hàng: <Text style={{ fontWeight: '750', color: activeTextColor }}>#{item.orderId}</Text></Text>
                                            </View>
                                            <View style={[
                                                styles.statusTag,
                                                isGood ? { backgroundColor: '#e8f5e9' } : { backgroundColor: '#ffebee' }
                                            ]}>
                                                <Text style={[
                                                    styles.statusTagText,
                                                    isGood ? { color: '#2e7d32' } : { color: '#e53935' }
                                                ]}>
                                                    {isGood ? '✓ Tốt' : isDamaged ? '⚠️ Hỏng vỡ' : '⚠️ Báo thiếu'}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={[styles.pickerDetails, { backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa', borderColor: activeBorderColor }]}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Ionicons name="person-circle" size={20} color={COLORS.primary} />
                                                <Text style={[styles.pickerName, { color: activeTextColor }]}>
                                                    Picker: <Text style={{ fontWeight: '800' }}>{item.pickedBy?.name || 'Chưa định danh'}</Text> ({item.pickedBy?.username})
                                                </Text>
                                            </View>
                                            <Text style={[styles.pickerPhone, { color: activeTextGrayColor }]}>
                                                SĐT: {item.pickedBy?.phoneNumber || 'N/A'} · Lúc: {item.pickedAt ? new Date(item.pickedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </Text>
                                        </View>

                                        {isGood && (
                                            <TouchableOpacity 
                                                style={styles.penalizeBtn} 
                                                onPress={() => setSelectedItemForPenalty({
                                                    itemId: item.itemId,
                                                    productName: item.product?.name,
                                                    quantity: item.quantity,
                                                    pickerName: item.pickedBy?.name
                                                })}
                                            >
                                                <Ionicons name="alert-circle" size={14} color="#fff" />
                                                <Text style={styles.penalizeBtnText}>Khách báo lỗi / Phạt kỉ luật</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={[styles.emptyText, { color: activeTextGrayColor }]}>Thùng hàng hiện chưa chứa sản phẩm nào.</Text>
                        )}
                    </View>
                )}

                {/* ── ORDER TASK TRACE RESULT ── */}
                {orderTasks && orderTasks.length > 0 && (
                    <View style={styles.resultsContainer}>
                        <Text style={[styles.sectionTitle, { color: activeTextColor }]}>Định danh picker cho Đơn hàng #{searchQuery}:</Text>

                        {orderTasks.map((task, idx) => {
                            const remaining = (task.quantityToPick ?? 1) - (task.quantityPicked ?? 0);
                            const isCompleted = task.status === 'completed' || remaining <= 0;

                            return (
                                <View key={idx} style={[styles.itemCard, { backgroundColor: activeCardBg, borderColor: activeBorderColor }]}>
                                    <View style={styles.itemHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.itemName, { color: activeTextColor }]}>{task.orderDetail?.product?.name || 'Sản phẩm'}</Text>
                                            <Text style={[styles.itemMeta, { color: activeTextGrayColor }]}>Số lượng yêu cầu: <Text style={{ fontWeight: '750', color: activeTextColor }}>{task.quantityToPick} cái</Text></Text>
                                        </View>
                                        <View style={[
                                            styles.statusTag,
                                            isCompleted ? { backgroundColor: '#e8f5e9' } : { backgroundColor: '#fff3e0' }
                                        ]}>
                                            <Text style={[
                                                styles.statusTagText,
                                                isCompleted ? { color: '#2e7d32' } : { color: '#e65100' }
                                            ]}>
                                                {isCompleted ? '✓ Hoàn thành' : `Đang pick (${task.quantityPicked})`}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.pickerDetails, { backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa', borderColor: activeBorderColor }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Ionicons name="person-circle" size={20} color={COLORS.primary} />
                                            <Text style={[styles.pickerName, { color: activeTextColor }]}>
                                                Picker phụ trách: <Text style={{ fontWeight: '800' }}>{task.assignedUser?.name || 'N/A'}</Text> ({task.assignedUser?.username})
                                            </Text>
                                        </View>
                                        <Text style={[styles.pickerPhone, { color: activeTextGrayColor }]}>
                                            SĐT: {task.assignedUser?.phoneNumber || 'N/A'} · Khu vực kệ: <Text style={{ fontWeight: '800', color: COLORS.primary }}>{cleanLocationName(task.location?.name)}</Text>
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

            </ScrollView>

            {/* Disciplinary Reporting Modal */}
            {selectedItemForPenalty && (
                <Modal visible={true} transparent={true} animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: activeCardBg }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: activeTextColor }]}>⚠️ Báo lỗi & Phạt Kỷ Luật</Text>
                                <TouchableOpacity onPress={() => setSelectedItemForPenalty(null)}>
                                    <Ionicons name="close-circle" size={26} color={activeTextGrayColor} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalBody}>
                                <Text style={[styles.modalSub, { color: activeTextGrayColor, marginBottom: 12 }]}>
                                    Bạn đang lập biên bản kỷ luật cho nhân viên: <Text style={{ fontWeight: '850', color: COLORS.primary }}>{selectedItemForPenalty.pickerName}</Text>
                                </Text>

                                <View style={[styles.violationCard, { backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa', borderColor: activeBorderColor }]}>
                                    <Text style={{ fontSize: 13, color: activeTextColor, fontWeight: '700' }}>Chi tiết sự cố:</Text>
                                    <Text style={{ fontSize: 12, color: activeTextGrayColor, marginTop: 4 }}>
                                        Sản phẩm: {selectedItemForPenalty.productName}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: activeTextGrayColor, marginTop: 2 }}>
                                        Số lượng: {selectedItemForPenalty.quantity} cái
                                    </Text>
                                </View>

                                <Text style={[styles.formLabel, { color: activeTextColor, marginTop: 16 }]}>Chọn hành vi lỗi của Picker: *</Text>
                                <View style={{ gap: 8, marginTop: 8 }}>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionBtn,
                                            { backgroundColor: darkMode ? '#2d2d2d' : '#f5f5f5', borderColor: activeBorderColor },
                                            penaltyStatus === 'damaged' && [styles.optionActiveBtn, { borderColor: '#e53935' }]
                                        ]}
                                        onPress={() => setPenaltyStatus('damaged')}
                                    >
                                        <Ionicons name="warning" size={18} color="#e53935" />
                                        <Text style={[styles.optionText, { color: activeTextColor }, penaltyStatus === 'damaged' && { fontWeight: '800', color: '#e53935' }]}>
                                            Bể vỡ / Hư hỏng hàng hóa (Damaged)
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.optionBtn,
                                            { backgroundColor: darkMode ? '#2d2d2d' : '#f5f5f5', borderColor: activeBorderColor },
                                            penaltyStatus === 'lost' && [styles.optionActiveBtn, { borderColor: '#e53935' }]
                                        ]}
                                        onPress={() => setPenaltyStatus('lost')}
                                    >
                                        <Ionicons name="alert-circle" size={18} color="#e53935" />
                                        <Text style={[styles.optionText, { color: activeTextColor }, penaltyStatus === 'lost' && { fontWeight: '800', color: '#e53935' }]}>
                                            Xếp thiếu hàng / Báo thiếu hụt (Lost)
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity 
                                    style={[styles.confirmPenaltyBtn, submittingPenalty && { opacity: 0.7 }]} 
                                    onPress={handlePenalizePicker}
                                    disabled={submittingPenalty}
                                >
                                    {submittingPenalty ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.confirmPenaltyBtnText}>⚖️ Áp Dụng Xử Phạt Kỉ Luật</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Bottom Nav */}
            <ManagerBottomNav active="returns" />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f4f1' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', padding: 16,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 16, fontWeight: '800' },
    scroll: { flex: 1, padding: 16 },
    
    // Toggle
    toggleRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        gap: 6,
    },
    toggleActiveBtn: {
        backgroundColor: COLORS.primary,
    },
    toggleBtnText: {
        fontSize: 11,
        fontWeight: '700',
    },
    toggleActiveBtnText: {
        color: '#fff',
        fontWeight: '800',
    },

    // Search Card
    searchCard: {
        borderWidth: 1.5,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    searchLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    searchBtn: {
        backgroundColor: COLORS.primary,
        width: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Penalty Card Styles
    penaltyCard: {
        borderWidth: 2,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#e53935',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 3,
    },
    penaltyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    penaltyTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#e53935',
        letterSpacing: 0.5,
    },
    penaltyBody: {
        gap: 6,
    },
    penaltyText: {
        fontSize: 12,
        lineHeight: 18,
    },
    boldText: {
        fontWeight: '850',
    },
    penaltyDivider: {
        height: 1,
        backgroundColor: 'rgba(229, 57, 53, 0.2)',
        marginVertical: 8,
    },
    penaltyAction: {
        fontSize: 12,
        color: '#c62828',
        lineHeight: 18,
    },
    closePenaltyBtn: {
        backgroundColor: '#e53935',
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: 14,
    },
    closePenaltyText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },

    // Results container
    resultsContainer: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 12,
        marginTop: 6,
    },

    // Meta card
    metaCard: {
        borderWidth: 1.5,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    metaIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metaTitle: {
        fontSize: 14,
        fontWeight: '800',
    },
    metaSub: {
        fontSize: 11,
        marginTop: 1,
    },
    metaGrid: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f3f3f3',
        paddingTop: 12,
        marginTop: 12,
        justifyContent: 'space-between',
    },
    metaItem: {
        alignItems: 'center',
        flex: 1,
    },
    metaLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 4,
    },
    metaValue: {
        fontSize: 13,
        fontWeight: '800',
    },

    // Item card
    itemCard: {
        borderWidth: 1.5,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemName: {
        fontSize: 13,
        fontWeight: '750',
        lineHeight: 18,
    },
    itemMeta: {
        fontSize: 11,
        marginTop: 4,
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusTagText: {
        fontSize: 10,
        fontWeight: '800',
    },
    pickerDetails: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 10,
        marginTop: 12,
        gap: 4,
    },
    pickerName: {
        fontSize: 12,
    },
    pickerPhone: {
        fontSize: 11,
        marginLeft: 26,
    },
    penalizeBtn: {
        backgroundColor: '#e53935',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        marginTop: 12,
    },
    penalizeBtnText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },
    emptyText: {
        fontStyle: 'italic',
        fontSize: 12,
        textAlign: 'center',
        marginVertical: 20,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f3f3',
        paddingBottom: 12,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 15,
        fontWeight: '800',
    },
    modalBody: {
        marginBottom: 20,
    },
    modalSub: {
        fontSize: 12,
    },
    violationCard: {
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 12,
    },
    formLabel: {
        fontSize: 12,
        fontWeight: '800',
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    optionActiveBtn: {
        backgroundColor: '#ffebee',
    },
    optionText: {
        fontSize: 12,
        fontWeight: '500',
    },
    modalFooter: {
        borderTopWidth: 1,
        borderTopColor: '#f3f3f3',
        paddingTop: 16,
    },
    confirmPenaltyBtn: {
        backgroundColor: '#e53935',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    confirmPenaltyBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '800',
    },
});