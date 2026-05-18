import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../constants/colors';
import StaffBottomNav from '../../components/StaffBottomNav';

const allProducts = [
  { id: 1, shelf: '26.10.15', product: 'Bánh Quy Hải Hà 200g', sku: 'KF-00123', qty: 5, unit: 'Hộp' },
  { id: 2, shelf: '14.07.B', product: 'Nước tương Chinsu 500ml', sku: 'KF-00456', qty: 3, unit: 'Chai' },
  { id: 3, shelf: '17.02.A', product: 'Mì gói Hảo Hảo tôm 75g', sku: 'KF-00789', qty: 20, unit: 'Gói' },
  { id: 4, shelf: '22.08.A', product: 'Snack Oshi Tôm 68g', sku: 'KF-01024', qty: 12, unit: 'Gói' },
  { id: 5, shelf: '09.03.C', product: 'Dầu ăn Neptune 1L', sku: 'KF-01100', qty: 6, unit: 'Chai' },
];

// Bản đồ kho (shelf positions)
const shelfPositions = {
  '09.03.C': { top: 100, left: 180 },
  '14.07.B': { top: 18, left: 90 },
  '17.02.A': { top: 100, left: 90 },
  '22.08.A': { top: 100, left: 18 },
  '26.10.15': { top: 20, left: 18 },
};

export default function RouteOptimizationScreen() {
  const params = useLocalSearchParams();
  const productIndex = parseInt(params.productIndex || '0', 10);
  const totalProducts = parseInt(params.totalProducts || '5', 10);
  const productLocation = params.productLocation || '';

  // Current product and next product
  const currentProduct = allProducts[productIndex] || allProducts[0];
  const nextProduct = allProducts[productIndex + 1];
  const isLast = productIndex >= totalProducts - 1 || !nextProduct;

  // Generate pick list with done/active states
  const pickList = allProducts.slice(0, totalProducts).map((p, i) => ({
    id: p.id,
    shelf: p.shelf,
    product: `${p.product} x${p.qty}`,
    distance: i < productIndex ? 'Đã xong' : i === productIndex ? '~15m →' : i === productIndex + 1 ? '~42m' : `~${(i - productIndex) * 30}m`,
    done: i < productIndex,
    active: i === productIndex,
  }));

  const currentPos = shelfPositions[currentProduct.shelf] || { top: 50, left: 120 };
  const nextPos = shelfPositions[nextProduct?.shelf] || { top: 100, left: 180 };

  const handleArrived = () => {
    if (isLast) {
      // Last product done → back to productlist
      router.replace({ pathname: '/productlist', params: { completed: 'true' } });
    } else {
      // Go to next product's picking screen
      const next = allProducts[productIndex + 1];
      router.replace({
        pathname: '/picking',
        params: {
          productIndex: String(productIndex + 1),
          totalProducts: String(totalProducts),
          productId: String(next.id),
          productName: next.product,
          productSku: next.sku,
          productLocation: next.shelf,
          productQty: String(next.qty),
          productUnit: next.unit,
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lộ trình</Text>
        <View style={styles.savedBadge}>
          <Text style={styles.savedText}>{productIndex + 1}/{totalProducts}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info */}
        <View style={styles.alertCard}>
          <Text style={styles.alertIcon}>🗺️</Text>
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>
              {isLast ? 'Sản phẩm cuối cùng!' : `Đi đến sản phẩm #${productIndex + 1}`}
            </Text>
            <Text style={styles.alertSub}>
              {isLast
                ? 'Sau khi hoàn thành sẽ quay lại danh sách.'
                : `${currentProduct.shelf} → ${nextProduct?.shelf || 'Kết thúc'}`}
            </Text>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapCard}>
          <View style={styles.gridOverlay}>
            {/* Shelves */}
            {Object.entries(shelfPositions).map(([loc, pos]) => {
              const isCurrent = loc === currentProduct.shelf;
              const isNextLocation = loc === nextProduct?.shelf;
              return (
                <View
                  key={loc}
                  style={[
                    isCurrent ? styles.shelfActive : isNextLocation ? styles.shelfNext : styles.shelf,
                    { top: pos.top, left: pos.left },
                  ]}
                >
                  <Text style={styles.shelfText}>{loc}</Text>
                </View>
              );
            })}

            {/* Route line from current to next */}
            {!isLast && (
              <>
                <View style={[styles.routeHorizontal, {
                  top: currentPos.top + 17,
                  left: currentPos.left + 64,
                  width: nextPos.left - currentPos.left - 64 + (currentPos.top === nextPos.top ? 0 : 40),
                }]} />
                <View style={[styles.routeVertical, {
                  top: Math.min(currentPos.top, nextPos.top) + 17,
                  left: nextPos.left + 32,
                  height: Math.abs(nextPos.top - currentPos.top),
                }]} />
              </>
            )}

            {/* Worker dot */}
            <View style={[styles.workerDot, { top: currentPos.top - 5, left: currentPos.left - 5 }]}>
              <View style={styles.workerInner} />
            </View>
          </View>
        </View>

        {/* Pick order */}
        <View style={styles.pickCard}>
          <Text style={styles.pickTitle}>📍 THỨ TỰ PICK</Text>
          {pickList.map((item) => (
            <View key={item.id} style={styles.pickRow}>
              <View style={[
                styles.stepCircle,
                item.done && styles.stepCircleDone,
                item.active && styles.stepCircleActive,
              ]}>
                <Text style={[styles.stepText, item.done && styles.stepTextDone]}>
                  {item.done ? '✓' : item.id}
                </Text>
              </View>
              <View style={styles.pickInfo}>
                <Text style={styles.pickShelf}>{item.shelf}</Text>
                <Text style={styles.pickProduct}>{item.product}</Text>
              </View>
              <Text style={[styles.pickDistance, item.done && styles.pickDone]}>
                {item.distance}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Arrived button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.arriveBtn} onPress={handleArrived}>
          <Text style={styles.arriveBtnText}>
            {isLast ? '✅ Hoàn thành — quay lại danh sách' : '✅ Tôi đã đến vị trí này'}
          </Text>
        </TouchableOpacity>
      </View>
        <StaffBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eef2ef' },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { color: '#fff', fontSize: 28 },
  headerTitle: { flex: 1, marginLeft: 8, color: '#fff', fontSize: 18, fontWeight: '800' },
  savedBadge: {
    backgroundColor: '#4ade80', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  savedText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },

  alertCard: {
    flexDirection: 'row', backgroundColor: '#22863a', borderRadius: 20, padding: 16,
    marginBottom: 14, alignItems: 'flex-start',
  },
  alertIcon: { fontSize: 30, marginRight: 12 },
  alertBody: { flex: 1 },
  alertTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  alertSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 22 },

  // Map
  mapCard: {
    backgroundColor: '#031b12', borderRadius: 22, height: 260, overflow: 'hidden', marginBottom: 14,
  },
  gridOverlay: { flex: 1, backgroundColor: '#031b12' },
  shelf: {
    position: 'absolute', width: 64, height: 34, borderRadius: 8,
    backgroundColor: '#0f5132', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1f7a4f',
  },
  shelfActive: {
    position: 'absolute', width: 70, height: 40, borderRadius: 10,
    backgroundColor: '#4caf50', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#7dff93',
  },
  shelfNext: {
    position: 'absolute', width: 64, height: 34, borderRadius: 8,
    backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fbbf24',
  },
  shelfText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  routeHorizontal: {
    position: 'absolute', borderWidth: 2, borderStyle: 'dashed', borderColor: '#facc15',
  },
  routeVertical: {
    position: 'absolute', borderWidth: 2, borderStyle: 'dashed', borderColor: '#facc15',
  },
  workerDot: {
    position: 'absolute', width: 24, height: 24, borderRadius: 14,
    backgroundColor: '#e11d48', alignItems: 'center', justifyContent: 'center',
  },
  workerInner: { width: 10, height: 10, borderRadius: 10, backgroundColor: '#fff' },

  // Pick Card
  pickCard: { backgroundColor: '#fff', borderRadius: 24, padding: 18 },
  pickTitle: { color: '#888', fontSize: 18, fontWeight: '800', marginBottom: 14 },
  pickRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#ececec',
  },
  stepCircle: {
    width: 34, height: 34, borderRadius: 18, backgroundColor: '#d4d4d4',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  stepCircleDone: { backgroundColor: '#16a34a' },
  stepCircleActive: { backgroundColor: '#f59e0b' },
  stepText: { color: '#666', fontWeight: '800' },
  stepTextDone: { color: '#fff' },
  pickInfo: { flex: 1 },
  pickShelf: { fontSize: 18, fontWeight: '800', color: '#222' },
  pickProduct: { color: '#999', fontSize: 14, marginTop: 2 },
  pickDistance: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
  pickDone: { color: '#16a34a' },

  // Bottom bar
  bottomBar: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  arriveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 18, alignItems: 'center',
  },
  arriveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
