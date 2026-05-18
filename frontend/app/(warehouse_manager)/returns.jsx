import { View, Text, StyleSheet,
         ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

// Thông tin hàng trả
const returnItem = {
    icon: 'cube-outline',
    name: 'Nước tương Chinsu 500ml',
    sku: 'KF-00456',
    from: 'Kingfood Q.7',
    qty: '8 chai',
};

// Các bước xử lý
const steps = [
    { id: 1, label: 'Quét mã hàng trả',        done: true  },
    { id: 2, label: 'Xác nhận số lượng: 8 chai', done: true  },
    { id: 3, label: 'Kiểm tra tình trạng SP',   done: false },
    { id: 4, label: 'Chọn hướng xử lý',         done: false },
];

// Các lựa chọn tình trạng
const conditions = [
    { id: 'good',    label: 'Còn tốt – Nhập lại kho', icon: 'checkmark-circle-outline', color: COLORS.primary  },
    { id: 'damaged', label: 'Bao bì hỏng – Giảm giá', icon: 'warning-outline', color: '#e65100' },
    { id: 'broken',  label: 'Hư hỏng – Thanh lý', icon: 'close-circle-outline', color: COLORS.error },
];

// Component 1 bước
function StepRow({ step }) {
    return (
        <View style={styles.stepRow}>
            <View style={[styles.stepNum,
                step.done && styles.stepNumDone]}>
                <Text style={styles.stepNumText}>
                    {step.done ? '✓' : step.id}
                </Text>
            </View>
            <Text style={[styles.stepText,
                step.done && styles.stepTextDone]}>
                {step.label}
            </Text>
        </View>
    );
}

export default function ReturnsScreen() {
    const [condition, setCondition] = useState(null);

    return (
        <SafeAreaView style={styles.safeArea}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Xử lý Hàng Trả về</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.scroll}>

                {/* Alert */}
                <View style={styles.alert}>
                    <Ionicons name="arrow-undo-outline" size={24} color="#1565c0" style={{ marginRight: 6 }} />
                    <View style={styles.alertBody}>
                        <Text style={styles.alertTitle}>
                            Hàng trả từ Cửa hàng
                        </Text>
                        <Text style={styles.alertSub}>
                            Quét mã, kiểm tra trạng thái rồi nhập kho hoặc gửi QC.
                        </Text>
                    </View>
                </View>

                {/* Card hàng trả */}
                <View style={styles.returnCard}>
                    {/* Banner cam */}
                    <View style={styles.returnBanner}>
                        <Ionicons name={returnItem.icon} size={28} color="#fff" style={{ marginRight: 6 }} />
                        <View style={styles.returnInfo}>
                            <Text style={styles.returnName}>
                                {returnItem.name}
                            </Text>
                            <Text style={styles.returnSub}>
                                SKU: {returnItem.sku} · Từ: {returnItem.from} · {returnItem.qty}
                            </Text>
                        </View>
                    </View>

                    {/* Các bước */}
                    <View style={styles.stepsContainer}>
                        {steps.map((step) => (
                            <StepRow key={step.id} step={step} />
                        ))}
                    </View>
                </View>

                {/* Tình trạng sản phẩm */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Ionicons name="search-outline" size={18} color="#222" style={{ marginRight: 6 }} />
                        <Text style={styles.cardTitle}>Tình trạng sản phẩm</Text>
                    </View>
                    {conditions.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.conditionBtn,
                                condition === item.id &&
                                    styles.conditionBtnActive,
                            ]}
                            onPress={() => setCondition(item.id)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name={item.icon} size={18} color={item.color} />
                                <Text style={[
                                    styles.conditionText,
                                    condition === item.id &&
                                        styles.conditionTextActive,
                                ]}>
                                    {item.label}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Nút xác nhận */}
                <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() => router.back()}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="download-outline" size={18} color="#fff" />
                        <Text style={styles.btnPrimaryText}>
                            Xác nhận Nhập kho – Kệ 14.07.B
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnOutline}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="document-text-outline" size={18} color="#666" />
                        <Text style={styles.btnOutlineText}>
                            Ghi chú thêm cho QC
                        </Text>
                    </View>
                </TouchableOpacity>

            </ScrollView>

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
    scroll: { flex: 1, padding: 16 },
    alert: {
        flexDirection: 'row', backgroundColor: '#e3f2fd',
        borderRadius: 14, padding: 14, gap: 10, marginBottom: 12,
        borderLeftWidth: 4, borderLeftColor: '#1976d2',
        alignItems: 'center',
    },
    alertIcon: { fontSize: 22 },
    alertBody: { flex: 1 },
    alertTitle: { fontSize: 13, fontWeight: '700',
        color: '#1565c0', marginBottom: 4 },
    alertSub: { fontSize: 12, color: '#555', lineHeight: 18 },

    // Return Card
    returnCard: {
        borderRadius: 16, overflow: 'hidden',
        borderWidth: 1.5, borderColor: COLORS.successBg,
        marginBottom: 12,
    },
    returnBanner: {
        backgroundColor: '#e65100', padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    returnEmoji: { fontSize: 28 },
    returnInfo: { flex: 1 },
    returnName: { color: '#fff', fontSize: 15, fontWeight: '800' },
    returnSub: { color: 'rgba(255,255,255,0.75)',
        fontSize: 12, marginTop: 3 },
    stepsContainer: {
        backgroundColor: '#fff', padding: 16,
        gap: 12,
    },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    stepNum: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#ddd', alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumDone: { backgroundColor: COLORS.accent },
    stepNumText: { color: '#fff', fontSize: 13, fontWeight: '800' },
    stepText: { fontSize: 13, color: '#333', fontWeight: '600' },
    stepTextDone: { color: '#aaa', textDecorationLine: 'line-through' },

    // Card
    card: {
        backgroundColor: '#fff', borderRadius: 16,
        padding: 16, marginBottom: 12,
    },
    cardTitle: { fontSize: 14, fontWeight: '700',
        color: '#222' },

    // Condition buttons
    conditionBtn: {
        padding: 14, borderRadius: 12, marginBottom: 8,
        backgroundColor: '#f9f9f9', borderWidth: 1.5,
        borderColor: '#eee',
    },
    conditionBtnActive: {
        backgroundColor: COLORS.successBg,
        borderColor: COLORS.accent,
    },
    conditionText: { fontSize: 14, color: '#555', fontWeight: '500' },
    conditionTextActive: { color: COLORS.primary, fontWeight: '700' },

    // Buttons
    btnPrimary: {
        backgroundColor: COLORS.primary, borderRadius: 14,
        padding: 16, alignItems: 'center', marginBottom: 10,
    },
    btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    btnOutline: {
        backgroundColor: '#fff', borderRadius: 14,
        padding: 16, alignItems: 'center', borderWidth: 1.5,
        borderColor: '#ddd', marginBottom: 24,
    },
    btnOutlineText: { color: '#666', fontSize: 14, fontWeight: '600' },
});