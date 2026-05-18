import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Animated, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';
import BarCodeScanner from '../../components/BarcodeScanner';
import { packItem } from '../../constants/services/api';

const STEP_LABELS = ['Map', 'Quét SP', 'SL', 'Quét thùng', 'Xác nhận'];

export default function PickingFlowScreen() {
  const params = useLocalSearchParams();
  const tasks = JSON.parse(params.tasksJson || '[]');
  const startIndex = parseInt(params.startIndex || '0', 10);

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [step, setStep] = useState(1);

  const currentTask = tasks[currentIndex];
  const isLast = currentIndex >= tasks.length - 1;

  const [barcode, setBarcode] = useState('');
  const [scanned, setScanned] = useState(false);
  const [quantity, setQuantity] = useState(currentTask?.qty || 1);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState('product');
  const [scannedBinCode, setScannedBinCode] = useState('');
  const [binInput, setBinInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const scanAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const handleArrived = () => setStep(2);

  const handleCameraScanned = (data) => {
    setShowCamera(false);
    if (cameraMode === 'product') {
      setBarcode(data);
      setScanned(true);
      setStep(3);
    } else {
      setScannedBinCode(data);
      setStep(5);
    }
  };

  const handleManualScan = () => {
    if (!barcode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã barcode');
      return;
    }
    const expected = currentTask?.sku;
    if (expected && barcode.trim() !== expected) {
      Alert.alert('❌ Sai sản phẩm', `Mã nhập: ${barcode.trim()}\nMã cần: ${expected}`);
      return;
    }
    setScanned(true);
    setStep(3);
  };

  const openBinCamera = () => {
    setCameraMode('bin');
    setShowCamera(true);
  };

  const handleManualBinScan = () => {
    if (!binInput.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã thùng');
      return;
    }
    setScannedBinCode(binInput.trim());
    setStep(5);
  };

  const handleConfirmBin = async () => {
    if (!currentTask?.taskId) {
      Alert.alert('Lỗi', 'Thiếu thông tin nhiệm vụ');
      return;
    }
    setSubmitting(true);
    console.log('handleConfirmBin: calling packItem with', {
      taskId: currentTask.taskId,
      binCode: scannedBinCode,
      quantity,
      currentTaskQty: currentTask?.qty,
    });
    try {
      await packItem(currentTask.taskId, scannedBinCode, quantity);
      if (isLast) {
        setStep(6);
      } else {
        const next = tasks[currentIndex + 1];
        setCurrentIndex(prev => prev + 1);
        setStep(1);
        setBarcode('');
        setScanned(false);
        setQuantity(next?.qty || 1);
        setScannedBinCode('');
        setBinInput('');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể xác nhận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteOrder = () => {
    router.back();
  };

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {STEP_LABELS.map((label, i) => {
        const s = i + 1;
        return (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, step >= s && styles.stepActive]}>
              <Text style={[styles.stepDotText, step >= s && styles.stepDotTextActive]}>{s}</Text>
            </View>
            {i < STEP_LABELS.length - 1 && (
              <View style={[styles.stepLine, step > s && styles.stepLineActive]} />
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {step < 6 && (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backBtn}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Picking</Text>
              <Text style={styles.headerSub}>Sản phẩm {currentIndex + 1}/{tasks.length}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{currentTask?.sku}</Text>
            </View>
          </View>
        )}

        {step < 6 && renderStepIndicator()}

        <View style={styles.content}>
          {/* Step 1: Map */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>🗺️ Di chuyển đến vị trí</Text>
              <View style={styles.mapCard}>
                <Text style={styles.mapEmoji}>📍</Text>
                <Text style={styles.mapLabel}>Vị trí sản phẩm</Text>
                <View style={styles.mapDest}>
                  <Text style={styles.mapDestIcon}>🏁</Text>
                  <Text style={styles.mapDestLabel}>{currentTask?.location}</Text>
                </View>
                <View style={styles.mapInfo}>
                  <Text style={styles.mapProductName}>{currentTask?.name}</Text>
                  <Text style={styles.mapProductSku}>{currentTask?.sku}</Text>
                </View>
                <View style={styles.mapRoute}>
                  <Text style={styles.mapArrow}>↓</Text>
                  <Text style={styles.mapStep}>Đi đến kệ, tìm vị trí {currentTask?.location}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.arriveBtn} onPress={handleArrived}>
                <Text style={styles.arriveBtnText}>✅ Tôi đã đến vị trí</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Scan product */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.scannerBox}>
                <Animated.View style={[styles.scanFrame, { opacity: scanAnim }]}>
                  <Text style={styles.scanIcon}>📷</Text>
                  <Text style={styles.scanHint}>Đưa mã vạch vào khung</Text>
                  <Animated.View style={[styles.scanLine, { opacity: scanAnim.interpolate({
                    inputRange: [0.3, 1], outputRange: [0.3, 1]
                  })}]} />
                </Animated.View>
                <Animated.View style={[styles.flashOverlay, { opacity: flashAnim }]} />
              </View>

              {!scanned ? (
                <>
                  <TouchableOpacity
                    style={styles.scanBtn}
                    onPress={() => { setCameraMode('product'); setShowCamera(true); }}
                  >
                    <Text style={styles.scanBtnText}>📷 Mở camera quét mã</Text>
                  </TouchableOpacity>
                  <Text style={styles.orText}>— hoặc —</Text>
                  <View style={styles.manualRow}>
                    <TextInput
                      style={styles.manualInput}
                      placeholder="Nhập mã barcode..."
                      placeholderTextColor="#aaa"
                      value={barcode}
                      onChangeText={setBarcode}
                    />
                    <TouchableOpacity style={styles.manualBtn} onPress={handleManualScan}>
                      <Text style={styles.manualBtnText}>Xác nhận</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.scanResult}>
                  <Text style={styles.scanSuccessIcon}>✅</Text>
                  <Text style={styles.scanSuccessText}>Quét thành công!</Text>
                  <Text style={styles.scanSku}>Mã: {barcode}</Text>
                  <Text style={styles.scanProduct}>{currentTask?.name}</Text>
                  <Text style={styles.smallHint}>Chuyển sang bước chọn số lượng...</Text>
                </View>
              )}
            </View>
          )}

          {/* Step 3: Quantity */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>🔢 Chọn số lượng</Text>
              <Text style={styles.qtyRequired}>Cần lấy: {currentTask?.qty || 0} {currentTask?.unit}</Text>
              <View style={styles.qtyCard}>
                <Text style={styles.qtyProduct}>{currentTask?.name}</Text>
                <Text style={styles.qtySku}>{currentTask?.sku}</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Text style={styles.qtyBtnIcon}>−</Text>
                  </TouchableOpacity>
                  <View style={styles.qtyValueBox}>
                    <Text style={styles.qtyValue}>{quantity}</Text>
                    <Text style={styles.qtyUnit}>{currentTask?.unit}</Text>
                  </View>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(Math.min(currentTask?.qty ?? 9999, quantity + 1))}
                >
                  <Text style={styles.qtyBtnIcon}>+</Text>
                </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(4)}>
                <Text style={styles.nextBtnText}>Quét mã thùng →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 4: Scan bin */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <View style={styles.scannerBox}>
                <Animated.View style={[styles.scanFrame, { opacity: scanAnim }]}>
                  <Text style={styles.scanIcon}>📦</Text>
                  <Text style={styles.scanHint}>Đưa mã thùng vào khung</Text>
                  <Animated.View style={[styles.scanLine, { opacity: scanAnim.interpolate({
                    inputRange: [0.3, 1], outputRange: [0.3, 1]
                  })}]} />
                </Animated.View>
                <Animated.View style={[styles.flashOverlay, { opacity: flashAnim }]} />
              </View>
              <TouchableOpacity style={styles.scanBtn} onPress={openBinCamera}>
                <Text style={styles.scanBtnText}>📷 Quét mã thùng</Text>
              </TouchableOpacity>
              <Text style={styles.orText}>— hoặc —</Text>
              <View style={styles.manualRow}>
                <TextInput
                  style={styles.manualInput}
                  placeholder="Nhập mã thùng..."
                  placeholderTextColor="#aaa"
                  value={binInput}
                  onChangeText={setBinInput}
                />
                <TouchableOpacity style={styles.manualBtn} onPress={handleManualBinScan}>
                  <Text style={styles.manualBtnText}>Xác nhận</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 5: Confirm bin */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>📦 Xác nhận thùng</Text>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmLabel}>Thùng đã quét</Text>
                <Text style={styles.confirmBinCode}>{scannedBinCode}</Text>
                <View style={styles.confirmDetail}>
                  <Text style={styles.confirmProduct}>{currentTask?.name}</Text>
                  <Text style={styles.confirmQty}>Số lượng: {quantity} {currentTask?.unit}</Text>
                </View>
              </View>
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.rescanBtn}
                  onPress={() => { setCameraMode('bin'); setShowCamera(true); }}
                >
                  <Text style={styles.rescanBtnText}>🔄 Quét lại</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, submitting && { opacity: 0.7 }]}
                  onPress={handleConfirmBin}
                  disabled={submitting}
                >
                  <Text style={styles.confirmBtnText}>
                    {submitting ? 'Đang xử lý...' : '✅ Xác nhận đúng thùng'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 6: Order complete */}
          {step === 6 && (
            <View style={styles.completeContainer}>
              <Text style={styles.completeIcon}>🎉</Text>
              <Text style={styles.completeTitle}>Hoàn tất đơn hàng!</Text>
              <Text style={styles.completeSub}>
                Tất cả {tasks.length} sản phẩm đã được lấy và bỏ vào thùng.
                Hãy xác nhận hoàn tất đơn hàng tại màn hình danh sách.
              </Text>
              <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteOrder}>
                <Text style={styles.completeBtnText}>Về danh sách sản phẩm</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showCamera} animationType="slide">
        <BarCodeScanner
          expectedCode={cameraMode === 'product' ? currentTask?.sku || '' : ''}
          onScanned={handleCameraScanned}
          onClose={() => setShowCamera(false)}
        />
      </Modal>
      <StaffBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f1' },
  scrollArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { fontSize: 28, color: COLORS.primary },
  headerCenter: { flex: 1, marginLeft: 10 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  headerSub: { fontSize: 11, color: '#888', marginTop: 2 },
  badge: {
    backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },

  // Steps
  stepRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 12, backgroundColor: '#fff', paddingHorizontal: 8,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#e0e0e0',
    alignItems: 'center', justifyContent: 'center',
  },
  stepActive: { backgroundColor: COLORS.primary },
  stepDotText: { fontSize: 10, fontWeight: '700', color: '#999' },
  stepDotTextActive: { color: '#fff' },
  stepLine: { width: 24, height: 2, backgroundColor: '#e0e0e0', marginHorizontal: 3 },
  stepLineActive: { backgroundColor: COLORS.primary },

  content: { flex: 1, padding: 16 },
  stepContainer: { flex: 1, justifyContent: 'center' },
  stepTitle: { fontSize: 18, fontWeight: '700', color: '#222', textAlign: 'center', marginBottom: 8 },

  // Map
  mapCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20,
  },
  mapEmoji: { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  mapLabel: { fontSize: 14, fontWeight: '700', color: '#222', textAlign: 'center', marginBottom: 16 },
  mapDest: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 8 },
  mapDestIcon: { fontSize: 24 },
  mapDestLabel: { fontSize: 28, fontWeight: '900', color: COLORS.primary, letterSpacing: 2 },
  mapInfo: { alignItems: 'center', marginBottom: 16 },
  mapProductName: { fontSize: 15, fontWeight: '600', color: '#222' },
  mapProductSku: { fontSize: 12, color: '#888' },
  mapRoute: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  mapArrow: { fontSize: 20, width: 30, textAlign: 'center' },
  mapStep: { fontSize: 13, color: '#666', flex: 1 },
  arriveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 18, alignItems: 'center',
    marginTop: 10,
  },
  arriveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Scanner
  scannerBox: {
    backgroundColor: '#1a1a1a', borderRadius: 20, height: 260,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden',
  },
  scanFrame: { alignItems: 'center' },
  scanIcon: { fontSize: 60, marginBottom: 12 },
  scanHint: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  scanLine: {
    width: 200, height: 2, backgroundColor: COLORS.accent, marginTop: 20,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 10, elevation: 4,
  },
  flashOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#fff' },
  scanBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 18,
    alignItems: 'center', marginBottom: 10,
  },
  scanBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  orText: { textAlign: 'center', color: '#aaa', fontSize: 13, marginBottom: 10 },
  manualRow: { flexDirection: 'row', gap: 10 },
  manualInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 14,
  },
  manualBtn: {
    backgroundColor: '#e8f5e9', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center',
  },
  manualBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  scanResult: { alignItems: 'center', padding: 20 },
  scanSuccessIcon: { fontSize: 48, marginBottom: 8 },
  scanSuccessText: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  scanSku: { fontSize: 13, color: '#888', marginBottom: 4 },
  scanProduct: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 8 },
  smallHint: { fontSize: 12, color: '#aaa' },

  // Quantity
  qtyRequired: {
    fontSize: 15, fontWeight: '700', color: '#e65100', textAlign: 'center', marginBottom: 12,
  },
  qtyCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24,
  },
  qtyProduct: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 4 },
  qtySku: { fontSize: 12, color: '#888', marginBottom: 20 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  qtyBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#f5f5f5',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnIcon: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  qtyValueBox: { alignItems: 'center', minWidth: 80 },
  qtyValue: { fontSize: 40, fontWeight: '900', color: '#222' },
  qtyUnit: { fontSize: 13, color: '#888', marginTop: 4 },

  // Confirm bin
  confirmCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20,
  },
  confirmLabel: { fontSize: 12, color: '#888', marginBottom: 8 },
  confirmBinCode: {
    fontSize: 36, fontWeight: '900', color: '#ffd600', backgroundColor: '#1a3a2a',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, overflow: 'hidden',
    marginBottom: 16, letterSpacing: 3,
  },
  confirmDetail: { alignItems: 'center' },
  confirmProduct: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 4 },
  confirmQty: { fontSize: 13, color: '#888' },
  confirmActions: { gap: 10 },
  rescanBtn: {
    borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#fff',
  },
  rescanBtnText: { color: '#666', fontSize: 14, fontWeight: '600' },
  confirmBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 18, alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Complete
  completeContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  completeIcon: { fontSize: 64, marginBottom: 16 },
  completeTitle: { fontSize: 24, fontWeight: '900', color: '#222', textAlign: 'center', marginBottom: 8 },
  completeSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  completeBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 48, paddingVertical: 16,
  },
  completeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Buttons
  nextBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 10,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
