import {useState} from 'react';
import {Text, View, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {CameraView, useCameraPermissions} from 'expo-camera';
import {COLORS} from '../constants/colors';

export default function BarCodeScanner({onScanned, onClose, expectedCode}){
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    // Chua biet trang thai quyen co duoc truy cap hay k 
    if(!permission){
        return(
            <View style = {styles.center}>
                <Text style = {styles.permText}>Đang tải camera...</Text>
            </View>
        );
    }
    // Bị từ chối quyền truy cập
    if(!permission.granted){
        return(
            <View style = {styles.center}>
                <Text style = {styles.permText}>Cần quyền truy cập camera để quét mà</Text>
                <TouchableOpacity style = {styles.permBtn} onPress = {requestPermission}>
                    <Text style = {styles.permBtnText}>Cấp quyền camera</Text>
                </TouchableOpacity>
            </View>
        );
    }
 const handleScan = ({ data }) => {
        if (scanned) return;
        // Tránh gọi onScanned nhiều lần liên tiếp
        setScanned(true);
        if(expectedCode && data !== expectedCode){
            // Quét sai mã
            Alert.alert('❌ Sai sản phẩm',
                `Mã quét được: ${data}\nMã cần quét: ${expectedCode}`,
            [
                {
                    text: 'Quét lại',
                    onPress: () => setScanned(false)
                }
            ]
            );
            return 
        }
        onScanned(data)
};
return(
    <View style = {styles.container}>
        <CameraView
        style = {styles.camera}
        facing = 'back'
        barcodeScannerSettings = {{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'code128' , 'code39'],
        }}
        onBarcodeScanned={handleScan} />
      {/* Khung ngắm */}
      <View style = {styles.overlay}>
        <View style = {styles.scanFrame}>
            <View style = {[styles.corner, styles.cornerTL]} />
            <View style = {[styles.corner, styles.cornerTR]} />
            <View style = {[styles.corner, styles.cornerBL]} />
            <View style = {[styles.corner, styles.cornerBR]} /> 
        </View>
        <Text style = {styles.hint}> {scanned ? 'Đang xử lý...' : 'Hướng camera vào mã barcode'} </Text>
      </View>
      {/* Nút đóng */}
      <TouchableOpacity style = {styles.closeBtn} onPress ={onClose}>
        <Text style = {styles.closeBtnText}>✕ Đóng</Text>
      </TouchableOpacity>
    </View>
);
}
const styles = StyleSheet.create({
    container: { flex: 1 },
    camera: { flex: 1 },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: 24,
        backgroundColor: '#000',
    },
    permText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    permBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    permBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },

    // Overlay khung ngắm
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    scanFrame: {
        width: 240,
        height: 240,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 36,
        height: 36,
        borderColor: '#fff',
    },
    cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
    hint: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },

    // Nút đóng
    closeBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    closeBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});