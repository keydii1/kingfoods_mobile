import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Animated, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';

export default function PickingScreen() {
  const params = useLocalSearchParams();
  const productIndex = parseInt(params.productIndex || '0', 10);
  const totalProducts = parseInt(params.totalProducts || '1', 10);
  const productId = params.productId;
  const productName = params.productName;
  const productSku = params.productSku;
  const productLocation = params.productLocation;
  const productQty = parseInt(params.productQty || '1', 10);
  const productUnit = params.productUnit;

  const [barcode, setBarcode] = useState('');
  const [scanned, setScanned] = useState(false);
  const [quantity, setQuantity] = useState(productQty);
  const [showQty, setShowQty] = useState(false);

  const scanAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scanned) {
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setShowQty(true), 500);
    }
  }, [scanned]);

  const simulateScan = () => {
    Animated.sequence([
      Animated.timing(scanAnim, { toValue: 0.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scanAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setBarcode(productSku);
      setScanned(true);
    });
  };

  const handleManualScan = () => {
    if (!barcode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã barcode');
      return;
    }
    setScanned(true);
    setTimeout(() => setShowQty(true), 500);
  };

  const goToRoute = () => {
    router.replace({
      pathname: '/route',
      params: {
        productIndex: String(productIndex),
        totalProducts: String(totalProducts),
        productId,
        productName,
        productSku,
        productLocation,
        productQty: String(quantity),
        productUnit,
      },
    });
  };

  // Hiển thị bước
  const currentStep = showQty ? 2 : 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Picking</Text>
          <Text style={styles.headerSub}>Sản phẩm {productIndex + 1}/{totalProducts}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{productSku}</Text>
        </View>
      </View>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        {[1, 2].map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, currentStep >= s && styles.stepActive]}>
              <Text style={[styles.stepDotText, currentStep >= s && styles.stepDotTextActive]}>
                {s === 1 ? '📷' : '🔢'}
              </Text>
            </View>
            {i < 1 && <View style={[styles.stepLine, currentStep > s && styles.stepLineActive]} />}
          </View>
        ))}
      </View>

      {/* Step 1: Scan barcode */}
      {!showQty && (
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
              <TouchableOpacity style={styles.scanBtn} onPress={simulateScan}>
                <Text style={styles.scanBtnText}>📸 Quét mã</Text>
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
              <Text style={styles.scanProduct}>{productName}</Text>
            </View>
          )}
        </View>
      )}

      {/* Step 2: Quantity */}
      {showQty && (
        <View style={styles.stepContainer}>
          <Text style={styles.qtyTitle}>🔢 Chọn số lượng</Text>
          <View style={styles.qtyCard}>
            <Text style={styles.qtyProduct}>{productName}</Text>
            <Text style={styles.qtySku}>{productSku} · {productLocation}</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={styles.qtyBtnIcon}>−</Text>
              </TouchableOpacity>
              <View style={styles.qtyValueBox}>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <Text style={styles.qtyUnit}>{productUnit}</Text>
              </View>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Text style={styles.qtyBtnIcon}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.routeBtn} onPress={goToRoute}>
            <Text style={styles.routeBtnText}>🗺️ Xem lộ trình đến sản phẩm tiếp theo</Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
        <StaffBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f1' },
  scrollArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
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
    padding: 14, backgroundColor: '#fff',
  },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#e0e0e0',
    alignItems: 'center', justifyContent: 'center',
  },
  stepActive: { backgroundColor: COLORS.primary },
  stepDotText: { fontSize: 14 },
  stepDotTextActive: {},
  stepLine: { width: 60, height: 2, backgroundColor: '#e0e0e0', marginHorizontal: 6 },
  stepLineActive: { backgroundColor: COLORS.primary },

  stepContainer: { flex: 1, padding: 20, justifyContent: 'center' },

  // Scanner
  scannerBox: {
    backgroundColor: '#1a1a1a', borderRadius: 20, height: 240,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden',
  },
  scanFrame: { alignItems: 'center' },
  scanIcon: { fontSize: 50, marginBottom: 10 },
  scanHint: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  scanLine: {
    width: 180, height: 2, backgroundColor: COLORS.accent, marginTop: 16,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 10, elevation: 4,
  },
  flashOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#fff' },
  scanBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 10,
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
  scanResult: { alignItems: 'center', padding: 10 },
  scanSuccessIcon: { fontSize: 44, marginBottom: 6 },
  scanSuccessText: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  scanSku: { fontSize: 12, color: '#888', marginBottom: 4 },
  scanProduct: { fontSize: 14, fontWeight: '600', color: '#222' },

  // Quantity
  qtyTitle: { fontSize: 18, fontWeight: '700', color: '#222', textAlign: 'center', marginBottom: 16 },
  qtyCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20,
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
  routeBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 18, alignItems: 'center',
  },
  routeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
