import {Text, TextInput, View, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {COLORS} from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';

// mockdata 1 sản phẩm thay vì nhiều ở product
const pickItem ={
    location : '14.07.B',
    locationDetail :'Dãy 14-Kệ 07-Tầng B-Khu bánh kẹo',
    sku :'KF-00456',
    name:'Nước tương chinsu 500ml',
    emoji :'🥫',
    qty:'3',
    unit:'chai',
    bin:'BIN-401',
    client:'KFM Q.7',
    packageCode :'PK-338291',
    current:'5',
    total:'12'
}
// tạo component tái sử dung
function MetaItem({label, value, valueColor}){
        return (
            <View style = {styles.metaItem}>
                <Text style = {styles.metaLabel}>{label}</Text>
                <Text style = {[styles.metaVal, valueColor && {color: valueColor}]}>{value}</Text>
            </View>
        );
}
export default function PackingScreen(){
    return(
        <SafeAreaView style ={styles.safeArea}>
            {/* Header */}
            <View style = {styles.header}>
            <TouchableOpacity onPress = {() => router.back()}>
            <Text style = {styles.backBtn}>‹</Text>
            </TouchableOpacity>    
            <Text style = {styles.headerTitle}>Picking-Bước 1/2</Text>
            <View style = {styles.badge}>
                <Text style = {styles.badgeText}>
                   SKU: {pickItem.current}/{pickItem.total}
                </Text>
            </View>
            </View>
            <ScrollView style = {styles.scroll}>
                {/*Card Vị trí kệ */}
                <View style = {styles.locationCard}>
                    <Text style = {styles.locationLabel}>📍 Vị trí kệ</Text>
                    <Text style = {styles.locationCode}>{pickItem.location}</Text>
                    <Text style = {styles.locationDetail}>{pickItem.locationDetail}</Text>
                {/* Thanh hiển thị step */}
                <View style = {styles.stepRow}>
                    <View style = {[styles.stepDot, styles.stepActive]}/>
                    <View style = {styles.stepLine}/>
                    <View style = {styles.stepDot}/>
                </View>
                   </View>
                {/* Card sản phẩm */}
                <View style = {styles.productCard}>
                    {/* Emoji + Số lượng sản phẩm */}
                <View style = {styles.productLeft}>
                    <Text style = {styles.productEmoji}>
                        {pickItem.emoji}
                    </Text>
                    <View style = {styles.qtyBadge}>
                        <Text style = {styles.qtyValue}>{pickItem.qty}</Text>
                        <Text style = {styles.qtyUnit}>{pickItem.unit}</Text>
                    </View>
                </View>
                {/* Product information */}
                <View style = {styles.productBody}>
                    <Text style = {styles.productSku}>SKU: {pickItem.sku}</Text>
                    <Text style = {styles.productName}>{pickItem.name}</Text>
                    {/* Thông tin chi tiết của sản phẩm 3 cái dòng dưới tên sản phẩm */}
                    <View style = {styles.metaRow}>
                        <MetaItem label ='Thùng đích' value ={pickItem.bin} valueColor ="#e65100" />
                        <MetaItem label ='Khách hàng' value = {pickItem.client} />
                        <MetaItem label = 'Mã kiện' value = {pickItem.packageCode} />
                    </View>
                </View>
                </View>
                {/* Hộp thông báo */}
                <View style = {styles.infoBox}>
                    <Text style = {styles.infoIcon}>ℹ️</Text>
                    <View style = {styles.infoBody}>
                        <Text style = {styles.infoTitle}>
                            Quét mã sản phẩm trước
                        </Text>
                        <Text style = {styles.infoText}>
                            Tại vị trí này có nhiều sản phẩm giống nhau. Vui lòng quét mã sản phẩm trước khi bỏ vào thùng
                        </Text>
                    </View>
                </View>
                {/* Nút bấm để chuyển sang quét mà */}
                <TouchableOpacity 
                style = {styles.btnPrimary}
                onPress = {() => router.push('/scancontainer')} >
                    <Text style ={styles.btnPrimaryText}>Quét mã sản phẩm</Text>
                </TouchableOpacity>
                {/* Nút nhập tay sản phẩm */}
                <TouchableOpacity
                    style={styles.manualEntryBtn}
                    onPress={() => router.push('/manualentry')}
                >
                    <Text style={styles.manualEntryText}>
                        Nếu không thể quét mã? Hãy nhấn vào đây
                    </Text>
                </TouchableOpacity>
                {/* Nút báo thiếu */}
                <TouchableOpacity 
                style ={styles.btnOutline}
                onPress = {() => router.push('/missingitem')}>
                    <Text style = {styles.btnOutlineText}>Hết hàng/ Báo thiếu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.btnMap}
                    onPress={() => router.push('/warehousemap')}
                    >
                    <Text style={styles.btnMapText}>🗺️ Xem bản đồ kho</Text>
                </TouchableOpacity>
            </ScrollView>
             <StaffBottomNav />
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },

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
    backBtn: {
        fontSize: 28,
        color: COLORS.text,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    badge: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },

    scroll: { flex: 1, padding: 16 },

    // Vị trí kệ
    locationCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    locationLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginBottom: 6,
    },
    locationCode: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 2,
    },
    locationDetail: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: 4,
    },

    // Thanh bước
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 6,
    },
    stepDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    stepActive: {
        backgroundColor: '#fff',
    },
    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },

    // Card sản phẩm
    productCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        gap: 14,
        marginBottom: 12,
    },
    productLeft: {
        alignItems: 'center',
        gap: 8,
    },
    productEmoji: {
        fontSize: 44,
    },
    qtyBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignItems: 'center',
    },
    qtyValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    qtyUnit: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
    },
    productBody: { flex: 1 },
    productSku: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#222',
        marginBottom: 10,
    },

    // Meta info
    metaRow: {
        flexDirection: 'row',
        gap: 8,
    },
    metaItem: { flex: 1 },
    metaLabel: {
        fontSize: 10,
        color: '#aaa',
        marginBottom: 2,
    },
    metaVal: {
        fontSize: 12,
        fontWeight: '700',
        color: '#333',
    },

    // Hộp thông tin
    infoBox: {
        backgroundColor: '#e3f2fd',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    infoIcon: { fontSize: 20 },
    infoBody: { flex: 1 },
    infoTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1565c0',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 12,
        color: '#1565c0',
        lineHeight: 18,
    },

    // Nút chính
    btnPrimary: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        padding: 18,
        alignItems: 'center',
        marginBottom: 10,
    },
    btnPrimaryText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    btnOutline: {
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        marginBottom: 24,
    },
    btnOutlineText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
btnMap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#eef4ff',

    borderWidth: 1.5,
    borderColor: '#d6e4ff',

    borderRadius: 14,

    paddingVertical: 14,
    paddingHorizontal: 16,

    marginBottom: 16,
},
btnMapText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
},
manualEntryBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 18,
},

manualEntryText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
},
});