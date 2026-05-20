import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Animated, ScrollView, Modal, InteractionManager } from 'react-native';
import { unstable_batchedUpdates } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';
import BarCodeScanner from '../../components/BarcodeScanner';
import BarcodeView from '../../components/BarcodeView';
import WarehouseMap from '../../components/WarehouseMap';
import { packItem } from '../../constants/services/api';
import { Ionicons } from '@expo/vector-icons';
import { PACKING_POS } from '../../config/warehouseLayout';
import { findShortestPath, pathDistance } from '../../utils/pathfinding';
import { Alert } from '../../utils/appAlert';
import { useAuth } from '../../contexts/AuthContext';

export default function PickingFlowScreen() {
  const params = useLocalSearchParams();
  const { userRole } = useAuth();
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
  const [fromPacking, setFromPacking] = useState(false);
  const [prevLocation, setPrevLocation] = useState('');
  const [mapReady, setMapReady] = useState(true);
  const completeScaleAnim = useRef(new Animated.Value(0)).current;
  const completeOpacityAnim = useRef(new Animated.Value(0)).current;
  const stepFadeAnim = useRef(new Animated.Value(1)).current;

  const scanAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const handleArrived = () => setStep(2);

  const handleBack = () => {
    if (step <= 1) return router.back();
    const prev = step - 1;
    if (prev === 1) {
      setBarcode('');
      setScanned(false);
      setQuantity(currentTask?.qty || 1);
    } else if (prev === 2) {
      setBarcode('');
      setScanned(false);
    } else if (prev === 3) {
      setScannedBinCode('');
      setBinInput('');
    }
    setStep(prev);
  };

  const handleConfirmBin = useCallback(async (binCodeOverride) => {
    const finalBinCode = binCodeOverride !== undefined ? binCodeOverride : scannedBinCode;
    if (!currentTask?.taskId) {
      Alert.alert('Lỗi', 'Thiếu thông tin nhiệm vụ');
      return;
    }
    setSubmitting(true);
    try {
      await packItem(currentTask.taskId, finalBinCode, quantity);
      if (isLast) {
        setStep(6);
      } else {
        // Fade out current step first
        Animated.timing(stepFadeAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start(() => {
          // Hide map during transition to avoid heavy re-render
          setMapReady(false);

          // Batch all state updates together to trigger only ONE re-render
          unstable_batchedUpdates(() => {
            setPrevLocation(currentTask?.locationCode || currentTask?.location || '');
            const next = tasks[currentIndex + 1];
            setCurrentIndex(prev => prev + 1);
            setStep(1);
            setBarcode('');
            setScanned(false);
            setQuantity(next?.qty || 1);
            setScannedBinCode('');
            setBinInput('');
          });

          // Defer map rendering until after the layout settles
          InteractionManager.runAfterInteractions(() => {
            setMapReady(true);
            // Fade in new step
            Animated.timing(stepFadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          });
        });
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể xác nhận');
    } finally {
      setSubmitting(false);
    }
  }, [scannedBinCode, currentTask, quantity, isLast, currentIndex, tasks, stepFadeAnim]);

  const handleCameraScanned = (data) => {
    setShowCamera(false);
    if (cameraMode === 'product') {
      const expected = currentTask?.sku;
      if (expected && data !== expected) {
        router.push({
          pathname: '/pickingerror',
          params: {
            scannedSKU: data,
            scannedName: '',
            expectedSKU: expected,
            expectedName: currentTask?.name || '',
          },
        });
        return;
      }
      setBarcode(data);
      setScanned(true);
      setStep(3);
    } else {
      setScannedBinCode(data);
      // Auto confirm!
      handleConfirmBin(data);
    }
  };

  const handleManualScan = () => {
    if (!barcode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã barcode');
      return;
    }
    const expected = currentTask?.sku;
    if (expected && barcode.trim() !== expected) {
      router.push({
        pathname: '/pickingerror',
        params: {
          scannedSKU: barcode.trim(),
          scannedName: '',
          expectedSKU: expected,
          expectedName: currentTask?.name || '',
        },
      });
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
    const code = binInput.trim();
    setScannedBinCode(code);
    // Auto confirm!
    handleConfirmBin(code);
  };

  const handleCompleteOrder = () => {
    const dest = userRole === 'admin' ? '/managerdashboard' : '/dashboard';
    router.replace(dest);
  };

  // Animate completion screen entrance
  useEffect(() => {
    if (step === 6) {
      Animated.parallel([
        Animated.spring(completeScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(completeOpacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      completeScaleAnim.setValue(0);
      completeOpacityAnim.setValue(0);
    }
  }, [step]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {step < 6 && (
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack}>
              <Text style={styles.backBtn}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Picking</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{currentTask?.sku}</Text>
            </View>
          </View>
        )}

        <Animated.View style={[styles.content, { opacity: stepFadeAnim }]}>
          {/* Step 1: Map - route to product */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>
                {prevLocation ? `Từ ${prevLocation} đến ${currentTask?.location || ''}` : 'Di chuyển đến vị trí'}
              </Text>
              <View style={styles.mapCard}>
                {mapReady ? (
                  <WarehouseMap
                    currentLocation={prevLocation || currentTask?.locationCode || currentTask?.location}
                    targetLocation={currentTask?.locationCode || currentTask?.location}
                    targetLocationName={currentTask?.location}
                    showRoute={true}
                    fromPacking={!prevLocation}
                  />
                ) : (
                  <View style={styles.mapPlaceholder}>
                    <Text style={styles.mapPlaceholderText}>Đang tải bản đồ...</Text>
                  </View>
                )}
                <View style={styles.mapInfo}>
                  <Text style={styles.mapProductName}>{currentTask?.name}</Text>
                  <Text style={styles.mapProductSku}>{currentTask?.sku}</Text>
                  <View style={styles.mapDivider} />
                  <View style={styles.mapLocationRow}>
                    <Ionicons name="location-outline" size={13} color="#c62828" style={{ marginRight: 4 }} />
                    <Text style={styles.mapLocationLabel}>Vị trí</Text>
                    <Text style={styles.mapLocationText}>{currentTask?.location || '—'}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.arriveBtn} onPress={handleArrived}>
                <Text style={styles.arriveBtnText}>Tôi đã đến vị trí</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Scan product */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.barcodeCard}>
                <Text style={styles.targetLabel}>Mã vạch sản phẩm cần quét:</Text>
                <BarcodeView value={currentTask?.sku || '---'} />
                <Text style={styles.targetName}>{currentTask?.name || ''}</Text>
                <Text style={styles.targetQty}>SL: {currentTask?.qty || 0} {currentTask?.unit || ''}</Text>
              </View>
              <View style={styles.scannerBox}>
                <Animated.View style={[styles.scanFrame, { opacity: scanAnim }]}>
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
                    <Text style={styles.scanBtnText}>Mở camera quét mã</Text>
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
              <Text style={styles.stepTitle}>Chọn số lượng</Text>
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
                  <Text style={styles.scanHint}>Đưa mã thùng vào khung</Text>
                  <Animated.View style={[styles.scanLine, { opacity: scanAnim.interpolate({
                    inputRange: [0.3, 1], outputRange: [0.3, 1]
                  })}]} />
                </Animated.View>
                <Animated.View style={[styles.flashOverlay, { opacity: flashAnim }]} />
              </View>
              <TouchableOpacity style={styles.scanBtn} onPress={openBinCamera}>
                <Text style={styles.scanBtnText}>Quét mã thùng</Text>
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
              <Text style={styles.stepTitle}>Xác nhận thùng</Text>
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
                  <Text style={styles.rescanBtnText}>Quét lại</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, submitting && { opacity: 0.7 }]}
                  onPress={handleConfirmBin}
                  disabled={submitting}
                >
                  <Text style={styles.confirmBtnText}>
                    {submitting ? 'Đang xử lý...' : 'Xác nhận đúng thùng'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 6: Order complete */}
          {step === 6 && (
            <Animated.View style={[
              styles.completeContainer,
              {
                opacity: completeOpacityAnim,
                transform: [{ scale: completeScaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }) }],
              }
            ]}>
              <View style={styles.completeIconCircle}>
                <Ionicons name="checkmark-circle" size={72} color={COLORS.primary} />
              </View>
              <Text style={styles.completeTitle}>Hoàn tất đơn hàng! 🎉</Text>
              <Text style={styles.completeSub}>
                Tất cả {tasks.length} sản phẩm đã được lấy và bỏ vào thùng thành công.
              </Text>
              <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteOrder}>
                <Ionicons name="home-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.completeBtnText}>Về trang chủ</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      <Modal visible={showCamera} animationType="slide">
        <BarCodeScanner
          expectedCode={cameraMode === 'product' ? currentTask?.sku || '' : ''}
          expectedName={cameraMode === 'product' ? currentTask?.name || '' : ''}
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

  content: { flex: 1, padding: 16 },
  stepContainer: { flex: 1, justifyContent: 'center' },
  stepTitle: { fontSize: 18, fontWeight: '700', color: '#222', textAlign: 'center', marginBottom: 8 },
  mapPlaceholder: {
    height: 280, backgroundColor: '#f0f0f0', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 13, color: '#999', fontWeight: '500',
  },

  // Barcode card
  barcodeCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    marginBottom: 4,
  },
  targetName: {
    fontSize: 13,
    color: '#444',
    marginTop: 6,
    textAlign: 'center',
  },
  targetQty: {
    fontSize: 11,
    color: '#e65100',
    fontWeight: '700',
    marginTop: 4,
  },

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
  mapDivider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  mapLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapLocationIcon: { fontSize: 13 },
  mapLocationLabel: { fontSize: 11, color: '#999', fontWeight: '600' },
  mapLocationText: { fontSize: 14, fontWeight: '800', color: '#c62828' },
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
  completeIconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  completeTitle: { fontSize: 24, fontWeight: '900', color: '#222', textAlign: 'center', marginBottom: 8 },
  completeSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  completeBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 48, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  completeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Buttons
  nextBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 10,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
