import {Text, TextInput, View, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {COLORS} from '../../constants/colors';
import {useState} from 'react';
import StaffBottomNav from '../../components/StaffBottomNav';

// các loại mã có thể nhập
const codeTypes = [
    {id: 'sku', icon: '📦', label: 'Mã SKU'},
    {id: 'bin', icon : '🗃️', label :'Mã thùng'},
    {id: 'location', icon: '📍', label : 'Mã kệ'},
]

// Các nút phím bấm
const keys = [
  '1','2','3',
  '4','5','6',
  '7','8','9',
  '⌫','0','✓'
];
// Componet 1 nút bàn phím 
function KeyButton({label, onPress }){
    const isDelete = label === '⌫';
    const isConfirm = label ==='✓';
    return (
        <TouchableOpacity 
        style = {[styles.key,isDelete && styles.keyDelete, isConfirm && styles.keyConfirm, ]}
        onPress = {onPress}>
            <Text style = {[styles.keyText, isConfirm&& styles.keyConfirmText]}>{label}</Text>
        </TouchableOpacity>
    );
}

export default function ManualEntryScreen(){
    const [codeType, setCodeType] = useState('sku');
    const [code, setCode] = useState('');
    // Xử lí khi nhấn phím
    function handleKey(key){
        if (key === '⌫'){
            setCode (prev => prev.slice(0, -1));
        }
        else if( key === '✓'){
            if(code.length === 0) return;
            alert(`Xác nhận mã code : ${code}`);
            setCode('');
        }
        else{
            setCode(prev => prev + key);
        }
    }
     // Label hiển thị theo loại mã
    const currentType = codeTypes.find(t => t.id === codeType);
    return (
        <SafeAreaView style = {styles.safeArea}>
            {/* Header */}
            <View style = {styles.header}>
                <TouchableOpacity onPress = {() => router.back()}>
                    <Text style = {styles.backBtn}>‹</Text>
                </TouchableOpacity>
                <Text style = {styles.headerTitle}>Nhập mã thủ công</Text>
                <View style = {{width: 28}} />
            </View>
            {/* Body */}
            <ScrollView style = {styles.scroll}>
                {/* Alert */}
                <View style = {styles.alert}>
                    <Text style = {styles.alertIcon}>📵</Text>
                    <View style = {styles.alertBody}>
                        <Text style = {styles.alertTitle}>Máy quét không hoạt đông ?</Text>
                        <Text style = {styles.alertSub}>Nhập mã SKU hoặc mã thùng bằng bàn phím số</Text>
                    </View>
                </View>
                {/* Chọn loại mã */}
                <View style = {styles.typeRow}>
                    {codeTypes.map((type) => (
                        <TouchableOpacity 
                        key = {type.id}
                        style = {[styles.typeBtn, codeType === type.id && styles.typeBtnActive]}
                        onPress = {() => {setCodeType(type.id); 
                                            setCode('');
                        }}>
                            <Text style = {[styles.typeBtnText, codeType === type.id && styles.typeBtnTextActive]}>{type.icon} {type.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {/* Hiển thị màn hình mã */}
                <View style = {styles.display}>
                    <Text style = {styles.displayLabel}>
                        {currentType?.icon} {currentType?.label} đang nhập
                    </Text>
                    <Text style = {styles.displayValue}>
                        {code.length > 0 ? code : '_ _ _'}
                        {code.length > 0 ? '_': ' '}
                    </Text>
                    <Text style = {styles.displayHint}>
                        {code.length > 0 ? 'Nhấn ✓ để xác nhận' : 'Bắt đầu nhập mã...'}
                    </Text>
                </View>
                {/* Bàn phím hiển thị */}
                <View style = {styles.keypad}>
                    {keys.map ((key) => (
                        <KeyButton
                        key = {key}
                        label = {key}
                        onPress = {() => handleKey(key)} />
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

    content: {
        flex: 1,
        padding: 16,
    },

    // Alert
    alert: {
        flexDirection: 'row',
        backgroundColor: COLORS.warningBg,
        borderRadius: 14,
        padding: 14,
        gap: 10,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.warning,
    },
    alertIcon: { fontSize: 22 },
    alertBody: { flex: 1 },
    alertTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#e65100',
        marginBottom: 2,
    },
    alertSub: {
        fontSize: 12,
        color: '#666',
    },

    // Loại mã
    typeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    typeBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#ddd',
    },
    typeBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    typeBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    typeBtnTextActive: {
        color: '#fff',
    },

    // Màn hiển thị
    display: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: COLORS.accent,
    },
    displayLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 8,
    },
    displayValue: {
        fontSize: 32,
        fontWeight: '900',
        color: COLORS.primary,
        letterSpacing: 4,
        marginBottom: 8,
    },
    displayHint: {
        fontSize: 12,
        color: '#aaa',
    },

    // Bàn phím
    keypad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    key: {
        width: '30%',
        aspectRatio: 1.8,
        backgroundColor: '#fff',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    keyDelete: {
        backgroundColor: COLORS.errorBg,
    },
    keyConfirm: {
        backgroundColor: COLORS.successBg,
    },
    keyText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#222',
    },
    keyConfirmText: {
        color: COLORS.primary,
        fontSize: 22,
    },
    scroll: {
  padding: 16,
},
});