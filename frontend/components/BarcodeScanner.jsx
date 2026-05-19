import {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import {Text, View, TextInput, TouchableOpacity, StyleSheet} from 'react-native';
import {CameraView, useCameraPermissions} from 'expo-camera';
import {COLORS} from '../constants/colors';
import BarcodeView from './BarcodeView';

export default function BarCodeScanner({onScanned, onClose, expectedCode, expectedName}){
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const scannedRef = useRef(false);
    const onScannedRef = useRef(onScanned);
    onScannedRef.current = onScanned;

    const handleManualSubmit = () => {
        if (!manualCode.trim()) return;
        setScanned(true);
        onScanned(manualCode.trim());
    };

    const expectedInfo = expectedCode ? (
        <View style={styles.expectedSection}>
            <View style={styles.expectedBar}>
                <Text style={styles.expectedLabel}>Cần quét:</Text>
                <Text style={styles.expectedCode}>{expectedCode}</Text>
                {expectedName ? <Text style={styles.expectedName}>{expectedName}</Text> : null}
            </View>
            <BarcodeView value={expectedCode} />
        </View>
    ) : null;

    const fallbackInput = (
        <View style={styles.fallbackBox}>
            <Text style={styles.fallbackLabel}>— hoặc nhập mã barcode —</Text>
            <View style={styles.manualRow}>
                <TextInput
                    style={styles.manualInput}
                    placeholder="Nhập mã barcode..."
                    placeholderTextColor="#aaa"
                    value={manualCode}
                    onChangeText={setManualCode}
                    autoCapitalize="none"
                    autoFocus
                />
                <TouchableOpacity style={styles.manualBtn} onPress={handleManualSubmit}>
                    <Text style={styles.manualBtnText}>Xác nhận</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

  useEffect(() => {
    if (!scanned) return;
    const timer = setTimeout(() => {
      setScanned(false);
      scannedRef.current = false;
    }, 2000);
    return () => clearTimeout(timer);
  }, [scanned]);

  const handleScan = useCallback(({ data }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setScanned(true);
    onScannedRef.current(data);
  }, []);

  const scanSettings = useMemo(() => ({
    barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'code93', 'codabar', 'itf14', 'upc_a', 'upc_e', 'qr'],
    interval: 500,
  }), []);

    // Chua biet trang thai quyen co duoc truy cap hay k 
    if(!permission){
        return(
            <View style={styles.container}>
                <View style={styles.cameraWrapper}>
                    <View style={styles.center}>
                        <Text style={styles.permText}>Đang tải camera...</Text>
                    </View>
                </View>
                <View style={styles.fallbackRow}>
                    {expectedInfo}
                    {fallbackInput}
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <Text style={styles.closeBtnText}>Đóng</Text>
                </TouchableOpacity>
            </View>
        );
    }
    // Bị từ chối quyền truy cập
    if(!permission.granted){
        return(
            <View style={styles.container}>
                <View style={styles.cameraWrapper}>
                    <View style={styles.center}>
                        <Text style={styles.permText}>Cần quyền truy cập camera để quét mã</Text>
                        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                            <Text style={styles.permBtnText}>Cấp quyền camera</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.fallbackRow}>
                    {expectedInfo}
                    {fallbackInput}
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <Text style={styles.closeBtnText}>Đóng</Text>
                </TouchableOpacity>
            </View>
        );
    }
return(
    <View style = {styles.container}>
        <View style = {styles.cameraWrapper}>
            <CameraView
            style = {styles.camera}
            facing = 'back'
            autofocus = 'on'
            barcodeScannerSettings = {scanSettings}
            onBarcodeScanned = {handleScan} />
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
        </View>
        <View style={styles.fallbackRow}>
            {expectedInfo}
            {fallbackInput}
        </View>
        {/* Nút đóng */}
        <TouchableOpacity style = {styles.closeBtn} onPress ={onClose}>
          <Text style = {styles.closeBtnText}>Đóng</Text>
        </TouchableOpacity>
    </View>
);
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    cameraWrapper: { flex: 1 },
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

    // Expected code display
    expectedSection: {
        alignItems: 'center',
        marginBottom: 8,
    },
    expectedBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        marginBottom: 8,
    },
    expectedLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },
    expectedCode: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 1,
    },
    expectedName: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        flex: 1,
        textAlign: 'right',
    },

    // Fallback manual input
    fallbackRow: {
        padding: 16,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.15)',
    },
    fallbackBox: {
        gap: 8,
    },
    fallbackLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        textAlign: 'center',
    },
    manualRow: {
        flexDirection: 'row',
        gap: 10,
    },
    manualInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
    },
    manualBtn: {
        backgroundColor: COLORS.accent,
        borderRadius: 12,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    manualBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});