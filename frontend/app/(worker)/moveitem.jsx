import {Text, View, TouchableOpacity, ScrollView, StyleSheet, Alert} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {useState} from 'react';
import {router} from 'expo-router';
import {COLORS} from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';
import {moveItem as apiMoveItem} from '../../constants/services/api'
import {useLocalSearchParams} from 'expo-router';

// tạo 1 component tái sử dụng
function MoveStep ({number, label, value , status}) {
    // Tính style dựa trên status
    const isActive = status === 'active';
    const isDone = status === 'done';
    return (
        <View style={[
        styles.step,
        isDone && styles.stepDone,
        isActive && styles.stepActive,
        ]}>
            {/* Số thứ tự bước */}
            <View style={[
            styles.stepNum,
            isDone && styles.stepNumDone,
            isActive && styles.stepNumActive,
            ]}>
                <Text style = {styles.stepNumText}>{isDone ? '✓': number}</Text>
            </View>
            {/* Nội dung bước */}
            <View style = {styles.stepBody}>
                <Text style = {styles.stepLabel}>{label}</Text>
                <Text style={[
                styles.stepValue,
                isDone   && { color: COLORS.accent },
                isActive && { color: '#7c3aed' },
                ]}>{value}</Text>
            </View>
            {/* Tag trạng thái */}
            <View style={[
            styles.statusTag,
            isDone && styles.tagDone,
            isActive && styles.tagActive,
            ]}>
                <Text style = {styles.statusTagText}>{isDone ? 'Đã quét' : isActive ? 'Đang chờ' : 'Chờ'}</Text>
            </View>
        </View>
    );
}
export default function MoveItem(){
        const params = useLocalSearchParams();
    const [submitting, setSubmitting] = useState(false);
        const fromContainer = params.fromContainer || 'BIN-401';
    const toContainer = params.toContainer || 'BIN-402';
    const itemId = params.itemId || '';

    // Hiện ra step hiện tại đang ở step mấy
    const [step, setStep] = useState(2);
    // Suy ra trạng thái dựa theo step
    function getStatus(stepNum){
        if(step > stepNum) return 'done';
        if(step === stepNum) return 'active';
        return 'todo';
    }
    async function handleConfirm(){
            setSubmitting(true);
            try{
                await apiMoveItem(itemId, fromContainer, toContainer);
                Alert.alert('Thành công', 'Đã chuyển hành sang thùng mới');
                router.back()
            }
            catch(err){
                Alert.alert('Lỗi', err.message || 'Không thể chuyển hàng')
            }
            finally{
                setSubmitting(false);
            }
           }
    function handleScan(){
        if(step < 3){
            setStep(prev => prev + 1);
        } else if(step === 3){
            setStep(4);
        }
    }
    const btnLabel = step === 1 ? '📷 Quét mã Sản phẩm' : step === 2 ? '📷 Quét mã Thùng CŨ' : '📷 Quét mã Thùng MỚI';

    return (
        <SafeAreaView style = {styles.safeArea}>
            {/* Header */}
            <View style = {styles.header}>
            <TouchableOpacity onPress = {() => router.back()}>
                <Text style = {styles.backBtn}>‹</Text>
            </TouchableOpacity>
            <Text style = {styles.headerTitle}>Chuyển thùng</Text>
            <View style = {{width: 28}} />
            </View>
            <ScrollView>
                {/* Body */}
                <View style = {styles.content}>
                    {/* Cảnh báo */}
                    <View style = {styles.alertBox}>
                        <Text style = {styles.alertIcon}>⚠️</Text>
                        <View style = {styles.alertBody}>
                            <Text style = {styles.alertTitle}>Quét nhầm thùng ? </Text>
                            <Text style = {styles.alertText}>Thực hiện 3 bước để chuyển hàng sang đúng thùng. Hệ thống sẽ tự động cập nhât</Text>
                        </View>
                    </View>
                    {/* 3 bước tuần tự */}
                    <MoveStep number={1} label ='Bước 1 - Sản phẩm' value = 'KF 00456 - Chinsu 500ml' status = {getStatus(1)} />
                     <Text style={styles.arrow}>↓</Text>
                    <MoveStep number={2} label ='Bước 2 - Thùng cũ (Origin)' value = {step > 2 ? 'BIN-205' : 'Chưa quét'} status = {getStatus(2)} />
                     <Text style={styles.arrow}>↓</Text>
                    <MoveStep number={3}  label ='Bước 3 - Thùng mới(targat)' value = {step >= 3 ? 'BIN-401' : 'Chưa quét'} status = {getStatus(3)} />
                    {/* Hướng dẫn */}
                    <View style = {styles.guideCard}>
                        <Text style = {styles.guideTitle}>Hướng dẫn</Text>
                        <Text style = {styles.guideText}>             Sau khi quét thùng mới, hệ thống sẽ:{'\n'}
                        1. Cập nhật vị trí hàng trong database{'\n'}
                        2. In lại label đơn hàng mới (nếu cần){'\n'}
                        3. Chuyển bạn về màn hình sản phẩm tiếp theo
                        </Text>
                    </View>
                </View>
                {step < 4 ? (
                    <TouchableOpacity
                        style={styles.btnScan}
                        onPress={handleScan}
                    >
                        <Text style={styles.btnScanText}>{btnLabel}</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.btnConfirm, submitting && { opacity: 0.7 }]}
                        onPress={handleConfirm}
                        disabled={submitting}
                    >
                        <Text style={styles.btnConfirmText}>
                            {submitting ? 'Đang xử lý...' : '✅ Xác nhận chuyển thùng'}
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
            {/* Bottom nav */}
            <StaffBottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backBtn: { fontSize: 28, color: '#222' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#222' },

    content: {padding: 16, gap: 4 },
    // Alert box
    alertBox: {
        flexDirection: 'row',
        backgroundColor: '#fff3e0',
        borderRadius: 14,
        padding: 14,
        gap: 10,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    alertIcon: { fontSize: 20 },
    alertBody: { flex: 1 },
    alertTitle: {
        fontSize: 14, fontWeight: '700', color: '#e65100', marginBottom: 4,
    },
    alertText: { fontSize: 12, color: '#bf360c', lineHeight: 18 },

    // Step
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        gap: 12,
        borderWidth: 1.5,
        borderColor: '#eee',
    },
    stepDone:   { borderColor: COLORS.accent, backgroundColor: '#f1f8f1' },
    stepActive: { borderColor: '#7c3aed',     backgroundColor: '#faf5ff' },

    stepNum: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#eee',
        alignItems: 'center', justifyContent: 'center',
    },
    stepNumDone:   { backgroundColor: COLORS.accent },
    stepNumActive: { backgroundColor: '#7c3aed' },
    stepNumText: { color: '#fff', fontWeight: '800', fontSize: 14 },

    stepBody: { flex: 1 },
    stepLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
    stepValue: { fontSize: 14, fontWeight: '700', color: '#333' },

    // Status tag
    statusTag: {
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 20, backgroundColor: '#f5f5f5',
    },
    tagDone:   { backgroundColor: '#e8f5e9' },
    tagActive: { backgroundColor: '#ede9fe' },
    statusTagText: { fontSize: 11, fontWeight: '600', color: '#555' },

    arrow: { textAlign: 'center', fontSize: 20, color: '#ccc' },

    // Guide card
    guideCard: {
        backgroundColor: '#f9faf9',
        borderRadius: 14,
        padding: 14,
        marginTop: 8,
    },
    guideTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8 },
    guideText: { fontSize: 12, color: '#666', lineHeight: 20 },

    // Nút quét
    btnScan: {
        backgroundColor: COLORS.primary,
        margin: 16, marginTop: 8,
        borderRadius: 14,
        padding: 18,
        alignItems: 'center',
    },
    btnScanText: { color: '#fff', fontSize: 15, fontWeight: '800' },

    btnConfirm: {
        backgroundColor: COLORS.primary,
        margin: 16, marginTop: 8,
        borderRadius: 14,
        padding: 18,
        alignItems: 'center',
    },
    btnConfirmText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
