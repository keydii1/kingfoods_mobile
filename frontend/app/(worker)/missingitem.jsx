import {Text, View, ScrollView, TouchableOpacity,StyleSheet,Alert,Image} from 'react-native';
import {useState} from 'react'
import {SafeAreaView} from 'react-native-safe-area-context';
import {router, useLocalSearchParams} from 'expo-router';
import {COLORS} from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';
import {reportIncident} from '../../constants/services/api';
import * as ImagePicker from 'expo-image-picker';


const reasons = [   
    {
        id: 'empty', icon:'📦' , label:'Kệ còn trống - hàng chưa được bổ sung'
    },
    {
        id: 'damage', icon:'🚫', label:'Hàng đã bị hỏng / Không đạt chất lượng tiêu chuẩn'
    },
    {
        id:'moved', icon:'🔄',label: 'Hàng đã rời khỏi vị trí'
    }
]

export default function MissingItemScreen(){
        const [photoUri, setPhotoUri] = useState(null);
        const params = useLocalSearchParams();
        const itemId = params.itemId;
        const [submitting, setSubmitting] = useState(false);
        const [photoTaken, setPhotoTaken] = useState(false);
        const [reason, setReason] = useState(null);
const handleTakePhoto = async () => {
    // Xin quyền camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền camera để chụp ảnh');
        return;
    }

    // Mở camera chụp ảnh
    const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        // quality: 0.8 = giảm chất lượng 20% để tiết kiệm dung lượng
    });

    if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
        setPhotoTaken(true);
        // Lưu URI ảnh để sau này upload lên server
    }
};
       async function handleSubmit(){
        if(!photoTaken){
            Alert.alert('Lỗi!', 'Vui lòng chụp màn hình minh chứng trước');
            return;
        }
        if(!reason){
            Alert.alert('Lỗi!', 'Vui lòng chọn lí do thiếu hàng');
            return;
        }
        setSubmitting(true);
        try{
            await reportIncident(itemId, reason, photoUri || '');
                Alert.alert('Thành công!' ,'Báo cáo đã được gửi đi')
                router.back();
        }
        catch(err){
            Alert.alert('Lỗi', err.message || 'Không gửi được báo cáo');
        }
        finally{
            setSubmitting(false)
        }
    }
        return (
        <SafeAreaView style = {styles.safeArea}>
            {/* Header */}
            <View style = {styles.header}>
                <TouchableOpacity onPress = {() => router.back()}>
                    <Text style = {styles.backBtn}>‹</Text>
                </TouchableOpacity>
                <Text style = {styles.headerTitle}>Báo thiếu hàng</Text>
                <View style = {styles.badge}>
                    <Text style = {styles.badgeText}>Kệ 14.07.B</Text>
                </View>
            </View>
            {/* Body */}
            <ScrollView>
            {/* Section chụp ảnh */}
            <Text style = {styles.sectionLabel}>
                CHỤP ẢNH MINH CHỨNG
            </Text>
            {/* Khung camera */}
            {photoTaken ? (
                <View style={styles.photoDone}>
                    {photoUri && (
                        <Image
                            source={{ uri: photoUri }}
                            style={{ width: '100%', height: 160, borderRadius: 12 }}
                        />
                    )}
                    <Text style={styles.photoDoneText}>✅ Đã chụp ảnh</Text>
                    <TouchableOpacity onPress={handleTakePhoto}>
                        <Text style={{ color: COLORS.primary, marginTop: 8, fontWeight: '600' }}>Chụp lại</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.cameraBox}
                    onPress={handleTakePhoto}
                >
                    <View style={styles.cameraInner}>
                        <Text style={styles.cameraTitle}>Chụp ảnh vị trí trống</Text>
                        <Text style={styles.cameraSub}>Hướng camera vào kệ hàng đang trống</Text>
                        <View style={styles.cameraBtn}>
                            <Text style={styles.cameraBtnIcon}>📸</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            )}
            {/* Khu vực để chọn lí do */}
            <Text style = {styles.sectionLabel}>Lí do thiếu hàng:</Text>
            {/* Danh sách li do thiếu hàng, dùng map thay vì flatlist vì chỉ có 3 item */}
                {reasons.map((item)=> (
                    <TouchableOpacity
                    key = {item.id}
                    style = {[styles.reasonOption, reason === item.id && styles.reasonSelected]}
                    onPress = {() => setReason(item.id)}>
                    <Text style = {styles.reasonIcon}>{item.icon}</Text>
                    <Text style = {[styles.reasonLabel  , reason === item.id && styles.reasonLabelSelected]}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            {/* Nút gửi báo cáo */}
                <TouchableOpacity
                        style={[styles.btnSubmit, submitting && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        <Text style={styles.btnSubmitText}>
                            {submitting ? 'Đang gửi...' : '🚨 Gửi báo cáo & Chuyển tiếp'}
                        </Text>
                    </TouchableOpacity>
            </ScrollView>
            <StaffBottomNav />
        </SafeAreaView>
    )
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
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
    },

    scroll: {
        flex: 1,
        padding: 16,
    },

    // Section label
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#888',
        letterSpacing: 0.5,
        marginBottom: 10,
        marginTop: 4,
    },

    // Khung camera
    cameraBox: {
        backgroundColor: '#0d2b1a',
        borderRadius: 16,
        height: 180,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    cameraInner: {
        alignItems: 'center',
        gap: 8,
    },
    cameraTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'center',
    },
    cameraSub: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        textAlign: 'center',
    },
    cameraBtn: {
        marginTop: 8,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    cameraBtnIcon: { fontSize: 24 },
    photoDone: {
        alignItems: 'center',
        gap: 8,
    },
    photoDoneIcon: { fontSize: 40 },
    photoDoneText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },

    // Lý do
    reasonOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        gap: 12,
        borderWidth: 1.5,
        borderColor: '#eee',
    },
    reasonSelected: {
        borderColor: '#e53935',
        backgroundColor: '#fff5f5',
    },
    reasonIcon: { fontSize: 22 },
    reasonLabel: {
        flex: 1,
        fontSize: 14,
        color: '#444',
        fontWeight: '500',
    },
    reasonLabelSelected: {
        color: '#e53935',
        fontWeight: '700',
    },

    // Nút submit
    btnSubmit: {
        backgroundColor: '#e53935',
        margin: 16,
        marginTop: 8,
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
    },
    btnSubmitText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },

});