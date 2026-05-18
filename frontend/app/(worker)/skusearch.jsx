import {Text, View, TouchableOpacity, ScrollView, StyleSheet, FlatList, TextInput, ActivityIndicator, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {COLORS} from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';
import {useState, useEffect} from 'react';
import {getProducts} from '../../constants/services/api'

// Tạo mockdata
const allProducts = [
    { id: '1', location: '14.07\n.B', name: 'Nước tương Chinsu 500ml',
      sku: 'KF-00456', zone: 'Khu Bánh kẹo', stock: 42, stockStatus: 'ok' },
    { id: '2', location: '14.08\n.A', name: 'Nước mắm Chinsu 500ml',
      sku: 'KF-00457', zone: 'Khu Bánh kẹo', stock: 8, stockStatus: 'low' },
    { id: '3', location: '22.01\n.C', name: 'Tương ớt Chinsu 250g',
      sku: 'KF-00512', zone: 'Khu Hóa phẩm', stock: 0, stockStatus: 'out' },
    { id: '4', location: '26.10\n.A', name: 'Bánh quy Hải Hà 200g',
      sku: 'KF-00123', zone: 'Khu Bánh kẹo', stock: 24, stockStatus: 'ok' },
    { id: '5', location: '09.03\n.C', name: 'Dầu ăn Neptune 1L',
      sku: 'KF-01100', zone: 'Khu Thực phẩm', stock: 6, stockStatus: 'low' },
]

// Tạo 1 component chung
const stockConfig = {
    ok: {color: COLORS.primary, label: 'Tồn Kho'},
    low: {color: COLORS.warning, label :'Còn ít'},
    out: {color: COLORS.error, label: 'hết hàng'},
}

// Tạo 1 map để đọc từng id của sản phẩm
function SkuResult ({item}){
    const stock =  stockConfig[item.stockStatus]
    return (
        <TouchableOpacity
        style = {styles.resultRow}
        onPress = {() => router.push('/warehousemap')}>
            {/* Vị trí của sản phẩm */}
            <View style = {styles.logTag}>
                <Text style = {styles.logTagText}>{item.location}</Text>
            </View>
            {/* Tên + SKU của sản phẩm */}
            <View style = {styles.productInfo}>
                <Text style = {styles.productName}>{item.name}</Text>
                <Text style = {styles.productSku}>SKU :{item.sku} {item.zone}</Text>
            </View>
            {/* Số lượng hàng trong kho*/}
            <View style = {styles.stockBox}>
                <Text style = {[styles.stockValue, {color: stock.color}]}>{item.stock}</Text>
                <Text style = {styles.stockLabel}>{stock.label}</Text>
            </View>
        </TouchableOpacity>
    );
}

export default function SkuSearchScreen(){
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() =>{
        if (!query.trim()) {
        setResults([]);
        return;
    }
    const timer = setTimeout(async () => {
        setLoading(true);
        try{
            const res = await getProducts(query.trim());
            const products = Array.isArray(res) ? res : [];
            setResults(products.map(p =>({
                id: p._id,
                location: p.location || '-',
                name: p.name,
                sku: p.sku,
                zone: p.zone || p.category || ' ',
                stock: p.stock ?? 0,
                stockStatus: p.stock === 0 ? 'out' : p.stock < 10 ? 'low' : 'ok',

            })));
        } catch(err){
            Alert.alert('Lỗi', 'Không tìm được sản phẩm');
        }
        finally{
            setLoading(false);
        }
    }, 500);
    return () => clearTimeout(timer); // cleanup debounce
}, [query])
    return(
        <SafeAreaView style = {styles.safeArea}>
            {/* Header */}
            <View style = {styles.header}>
                <TouchableOpacity onPress = {() => router.back()}>
                    <Text style = {styles.backBtn}>‹</Text>
                </TouchableOpacity>
                <Text style = {styles.headerTitle}>Tìm kiếm sản phẩm</Text>
                <View style={{ width: 28 }} />
            </View>
{/* Ô tìm kiếm */}
<View style={styles.searchBar}>
    <Text style={styles.searchIcon}>🔍</Text>

    <TextInput
        style={styles.searchInput}
        placeholder="Nhập tên hoặc mã SKU"
        placeholderTextColor="#aaa"
        value={query}
        onChangeText={setQuery}
        autoFocus={true}
    />

    {query.length > 0 ? (
        <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
        </TouchableOpacity>
    ) : (
        <TouchableOpacity>
            <Text style={styles.cameraBtn}>📷</Text>
        </TouchableOpacity>
    )}
</View>

{/* Số kết quả */}
{query.length > 0 && (
    <Text style={styles.resultCount}>
        {results.length} kết quả cho "{query}"
    </Text>
)}

{/* Danh sách kết quả */}
{loading ? (
    <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
) : results.length === 0 && query.trim() ? (
    <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào</Text>
) : (
    <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <SkuResult item={item} />}
        contentContainerStyle={styles.list}
    />
)}
            {/* Bottom nav */}
                <StaffBottomNav />
        </SafeAreaView>
    )
}
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },

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

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        marginHorizontal: 16,
        marginTop: 14,
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 52,
    },

    searchIcon: {
        fontSize: 18,
        marginRight: 8,
    },

    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
    },

    clearBtn: {
        fontSize: 18,
        color: '#888',
        paddingHorizontal: 4,
    },

    cameraBtn: {
        fontSize: 20,
    },

    resultCount: {
        marginTop: 10,
        marginHorizontal: 18,
        color: '#666',
        fontSize: 14,
    },

    list: {
        padding: 16,
        paddingBottom: 120,
    },

    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },

    logTag: {
        width: 58,
        height: 58,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    logTagText: {
        color: '#fff',
        fontWeight: '700',
        textAlign: 'center',
        fontSize: 13,
    },

    productInfo: {
        flex: 1,
    },

    productName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },

    productSku: {
        fontSize: 13,
        color: '#777',
    },

    stockBox: {
        alignItems: 'center',
    },

    stockValue: {
        fontSize: 18,
        fontWeight: '700',
    },

    stockLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },

    tipCard: {
        backgroundColor: '#eef6ff',
        borderRadius: 16,
        padding: 16,
        marginTop: 10,
    },

    tipTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6,
        color: COLORS.primary,
    },

    tipText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#444',
    },

    emptyBox: {
        alignItems: 'center',
        marginTop: 60,
    },

    emptyIcon: {
        fontSize: 40,
        marginBottom: 10,
    },

    emptyText: {
        fontSize: 15,
        color: '#666',
    },

});