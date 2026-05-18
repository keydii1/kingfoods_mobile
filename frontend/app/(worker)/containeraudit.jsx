import { View, Text, StyleSheet,
         ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams} from 'expo-router';
import { COLORS } from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';
import {useState, useEffect} from 'react';
import {traceContainer} from '../../constants/services/api'

// Mock data thùng hàng
const binInfo = {
    code: 'BIN-401',
    order: '#KF-12345 · Kingfood Q.7',
    status: 'checking',
};

// Danh sách SKU trong thùng
const skuList = [
    { id: '1', sku: 'KF-00123', name: 'Bánh quy Hải Hà',
      required: '5 hộp', actual: 5, status: 'ok' },
    { id: '2', sku: 'KF-00456', name: 'Sữa chua Vinamilk',
      required: '12 hộp', actual: 12, status: 'ok' },
    { id: '3', sku: 'KF-00789', name: 'Mì gói Hảo Hảo',
      required: '20 gói · Chỉ có 18', actual: 18, status: 'bad' },
    { id: '4', sku: 'KF-01024', name: 'Snack Oishi',
      required: 'Thiếu hàng – đã báo cáo', actual: 0, status: 'skip' },
];

// Config theo status
const auditConfig = {
    ok:   { check: '✓', checkColor: COLORS.successBg,
            checkText: COLORS.primary, valueColor: COLORS.primary,
            suffix: '✓' },
    bad:  { check: '✗', checkColor: COLORS.errorBg,
            checkText: COLORS.error, valueColor: COLORS.error,
            suffix: '✗' },
    skip: { check: '–', checkColor: COLORS.warningBg,
            checkText: COLORS.warning, valueColor: COLORS.warning,
            suffix: '⚠️' },
};
// Tạo component danh sach trong thùng
function AuditRow({item}){
    const config = auditConfig[item.status];
    return (
        <View style = {styles.auditRow}>
            {/* Check badge */}
            <View style ={[styles.checkBadge, {backgroundColor: config.checkColor}]}>
                <Text style = {[styles.checkText, {color: config.checkText}]}>{config.check}</Text>
            </View>
            {/* Thông tin SKU */}
            <View style = {styles.skuInfo}>
                <Text style = {styles.skuName}>{item.sku} - {item.name}</Text>
                <Text style = {styles.skuRequired}>Yêu cầu: {item.required}</Text>
            </View>
            {/* Số lượng thực tế */}
            <Text style = {[styles.actualValue, {color: config.valueColor}]}>{item.actual} {config.suffix}</Text>
        </View>
    );
}

export default function ContainerAuditScreen(){
    const params = useLocalSearchParams();
    const [apiBinInfo, setApiBinInfo] = useState(null);
    const [apiSkuList, setApiSkuList] = useState([]);
    const [loading, setLoading] = useState(true);
    const containerCode = params.containerCode || binInfo.code;
    const displayBinInfo = apiBinInfo || binInfo;
    const displaySkuList = apiSkuList.length > 0 ? apiSkuList : skuList;

    useEffect(() =>{
        async function fetchTrace(){
            try{
                const res = await traceContainer(containerCode);
                setApiBinInfo({
                    code: res.containerCode || containerCode,
                    order: res.orderId || ' ',
                    status : res.status || 'checking',
                });
                setApiSkuList((res.items || []).map(item =>  ({
                    id: item._id,
                    sku: item.sku,
                    name: item.productName,
                    required : `${item.requiredQty} ${item.unit}`,
                    actual: item.actualQty,
                    status: item.status === 'ok' ? 'ok'
                      : item.status === 'short' ? 'bad' : 'skip',
                })));
            }
            catch(err){
                // Giữ mockdata nếu bị lỗi
            }
            finally{
                setLoading(false);
            }
        }
        fetchTrace();
    },[containerCode])
    return(
         <SafeAreaView style={styles.safeArea}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backBtn}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kiểm tra Thùng</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Audit</Text>
                </View>
            </View>
            {/* Body */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
            ) : (
            <ScrollView style = {styles.scroll}>
                {/* Card thùng hàng */}
                <View style = {styles.binCard}>
                    <Text style = {styles.binEmoji}>📦</Text>
                    <View style = {styles.binInfo}>
                        <Text style = {styles.binCode}>{displayBinInfo.code}</Text>
                        <Text style = {styles.binOrder}>{displayBinInfo.order}</Text>
                        <View style = {styles.checkingBadge}>
                            <Text style = {styles.checkingText}>Đang kiểm tra</Text>
                        </View>
                    </View>
                </View>
                {/* Danh sách SKU */}
                <View style = {styles.card}>
                    <Text style = {styles.cardTitle}>Danh sách SKU trong thùng</Text>
                    {displaySkuList.map((item) => (
                        <AuditRow key = {item.id} item = {item} />
                    ))}
                </View>
                {/* Kết quả audit */}
                {displaySkuList.some(item => item.status === 'bad' || item.status === 'skip') && (
                <View style = {styles.resultBox}>
                    <Text style = {styles.resultIcon}>❌</Text>
                    <Text style = {styles.resultTitle}>Không đạt - cần phải xử lí</Text>
                    <Text style = {styles.resultSub}>
                        {displayBinInfo.code} có{' '}
                        {displaySkuList.filter(i => i.status !== 'ok').length} SKU cần xử lí.
                    </Text>
                </View>
                )}
                {/* Nút chụp ảnh + nút báo cáo */}
                <TouchableOpacity style = {styles.btnPrimary}>
                    <Text style = {styles.btnPrimaryText}>📸 Chụp ảnh & Báo cáo</Text>
                </TouchableOpacity>
                <TouchableOpacity style = {styles.btnOutline}>
                    <Text style = {styles.btnOutlineText}>↩️ Bổ sung hàng còn thiếu</Text>
                </TouchableOpacity>
            </ScrollView>
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
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        color: '#1565c0',
        fontSize: 12,
        fontWeight: '600',
    },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1, padding: 16 },

    // Bin Card
    binCard: {
        backgroundColor: '#263238',
        borderRadius: 18,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 12,
    },
    binEmoji: { fontSize: 40 },
    binInfo: { flex: 1 },
    binCode: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
    },
    binOrder: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 12,
        marginTop: 3,
    },
    checkingBadge: {
        backgroundColor: '#ffc107',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 3,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    checkingText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#333',
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

    // Audit Row
    auditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f5f5f5',
        gap: 12,
    },
    checkBadge: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkText: {
        fontSize: 14,
        fontWeight: '800',
    },
    skuInfo: { flex: 1 },
    skuName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#222',
    },
    skuRequired: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    actualValue: {
        fontSize: 13,
        fontWeight: '800',
    },

    // Result Box
    resultBox: {
        backgroundColor: COLORS.errorBg,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#ef9a9a',
        marginBottom: 12,
        gap: 6,
    },
    resultIcon: { fontSize: 30 },
    resultTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#c62828',
    },
    resultSub: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    },

    // Buttons
    btnPrimary: {
        backgroundColor: COLORS.warning,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginBottom: 10,
    },
    btnPrimaryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    btnOutline: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#ddd',
        marginBottom: 24,
    },
    btnOutlineText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
});
