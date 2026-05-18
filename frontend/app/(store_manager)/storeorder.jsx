import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getProducts, createOrder } from '../../constants/services/api';

const productCatalog = [
  { id: '1', name: 'Bánh Quy Hải Hà 200g', sku: 'KF-00123', unit: 'Hộp', price: 8500 },
  { id: '2', name: 'Nước tương Chinsu 500ml', sku: 'KF-00456', unit: 'Chai', price: 12500 },
  { id: '3', name: 'Mì gói Hảo Hảo tôm 75g', sku: 'KF-00789', unit: 'Gói', price: 3500 },
  { id: '4', name: 'Snack Oshi Tôm 68g', sku: 'KF-01024', unit: 'Gói', price: 5000 },
  { id: '5', name: 'Dầu ăn Neptune 1L', sku: 'KF-01100', unit: 'Chai', price: 32000 },
  { id: '6', name: 'Coca Cola 330ml', sku: 'KF-01300', unit: 'Lon', price: 8000 },
  { id: '7', name: 'Bột ngọt Ajinomoto 200g', sku: 'KF-01400', unit: 'Gói', price: 7500 },
  { id: '8', name: 'Dầu gội Sunsilk 180ml', sku: 'KF-01500', unit: 'Chai', price: 18000 },
];

export default function StoreOrderScreen() {
  const [productCatalog, setProductCatalog] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { userName } = useAuth();
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const filteredProducts = productCatalog.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );
useEffect(() => {
    async function fetchCatalog() {
        try {
            const res = await getProducts();
            const products = Array.isArray(res) ? res : [];
            if (products.length > 0) {
                setProductCatalog(products.map(p => ({
                    id: p._id,
                    name: p.name,
                    sku: p.sku,
                    unit: p.unit || 'cái',
                    price: p.price || 0,
                })));
            }
        } catch (err) {
            // productCatalog vẫn là [] → filteredProducts = []
        } finally {
            setLoadingProducts(false);
        }
    }
    fetchCatalog();
}, []);
  const addToCart = (product) => {
    setCart(prev => {
      const exist = prev.find(c => c.product.id === product.id);
      if (exist) {
        return prev.map(c =>
          c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const exist = prev.find(c => c.product.id === productId);
      if (exist && exist.qty > 1) {
        return prev.map(c =>
          c.product.id === productId ? { ...c, qty: c.qty - 1 } : c
        );
      }
      return prev.filter(c => c.product.id !== productId);
    });
  };

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
  const totalAmount = cart.reduce((sum, c) => sum + c.qty * c.product.price, 0);

  const submitOrder = () => {
    if (cart.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm sản phẩm trước khi đặt hàng');
      return;
    }
    Alert.alert(
      'Xác nhận đặt hàng',
      `Bạn sắp đặt ${totalItems} sản phẩm với tổng tiền ${totalAmount.toLocaleString()}đ?\n\nĐơn hàng sẽ được gửi đến kho Kingfood.`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xác nhận',
onPress: async () => {
    setSubmitting(true);
    try {
        await createOrder(
            cart.map(c => ({
                productId: c.product.id,
                quantity: c.qty,
            }))
        );
                  Alert.alert('✅ Thành công', 'Đơn hàng đã được gửi đến kho');
                  setCart([]);
              } catch (err) {
                  Alert.alert('❌ Lỗi', err.message || 'Không đặt được hàng');
              } finally {
                  setSubmitting(false);
              }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/setting')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Đặt hàng</Text>
          <Text style={styles.headerSub}>{userName} · Kingfood Q.7</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/storestatistics')}>
          <Text style={styles.statIcon}>📊</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Tìm sản phẩm..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />

        {/* Danh mục sản phẩm */}
        <Text style={styles.sectionTitle}>🛒 Danh mục sản phẩm</Text>
        {filteredProducts.map(product => (
          <TouchableOpacity
            key={product.id}
            style={styles.productRow}
            onPress={() => addToCart(product)}
          >
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productSku}>{product.sku}</Text>
              <Text style={styles.productPrice}>{product.price.toLocaleString()}đ / {product.unit}</Text>
            </View>
            <View style={styles.productAdd}>
              <Text style={styles.productAddBtn}>+</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Cart Bottom Bar */}
      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartCount}>{totalItems} sản phẩm</Text>
            <Text style={styles.cartTotal}>{totalAmount.toLocaleString()}đ</Text>
          </View>
          <TouchableOpacity
            style={[styles.orderBtn, submitting && { opacity: 0.7 }]}
            onPress={submitOrder}
            disabled={submitting}
          >
            <Text style={styles.orderBtnText}>
              {submitting
                ? 'Đang gửi...'
                : `Đặt hàng · ${totalItems} SP · ${totalAmount.toLocaleString()}đ`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cart detail modal (inline) */}
      {cart.length > 0 && (
        <View style={styles.cartDetail}>
          <Text style={styles.cartDetailTitle}>🧾 Giỏ hàng</Text>
          {cart.map(item => (
            <View key={item.product.id} style={styles.cartItem}>
              <Text style={styles.cartItemName} numberOfLines={1}>{item.product.name}</Text>
              <View style={styles.cartQtyRow}>
                <TouchableOpacity onPress={() => removeFromCart(item.product.id)}>
                  <Text style={styles.qtyBtn}>−</Text>
                </TouchableOpacity>
                <Text style={styles.cartQty}>{item.qty}</Text>
                <TouchableOpacity onPress={() => addToCart(item.product)}>
                  <Text style={styles.qtyBtn}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📋</Text>
          <Text style={[styles.navLabel, styles.navActive]}>Đặt hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/storestatistics')}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navLabel}>Thống kê</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/setting')}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Cài đặt</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f1' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  settingsIcon: { fontSize: 22 },
  statIcon: { fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  scroll: { flex: 1, padding: 16 },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, fontSize: 14,
    marginBottom: 12, borderWidth: 1.5, borderColor: COLORS.accent,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 10 },
  productRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 8, gap: 12,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 13, fontWeight: '600', color: '#222' },
  productSku: { fontSize: 11, color: '#888', marginTop: 2 },
  productPrice: { fontSize: 12, color: COLORS.primary, fontWeight: '700', marginTop: 4 },
  productAdd: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  productAddBtn: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: -2 },
  cartBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 14, borderTopWidth: 1, borderTopColor: '#eee', gap: 12,
  },
  cartInfo: { flex: 1 },
  cartCount: { fontSize: 13, fontWeight: '600', color: '#222' },
  cartTotal: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  cartBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cartBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  orderBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 20,
    paddingVertical: 12,
  },
  orderBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  cartDetail: {
    backgroundColor: '#fff', padding: 14, borderTopWidth: 1, borderTopColor: '#eee',
    maxHeight: 200,
  },
  cartDetailTitle: { fontSize: 13, fontWeight: '700', color: '#222', marginBottom: 8 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 6,
  },
  cartItemName: { fontSize: 12, color: '#444', flex: 1, marginRight: 10 },
  cartQtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { fontSize: 20, fontWeight: '700', color: COLORS.primary, width: 28, textAlign: 'center' },
  cartQty: { fontSize: 14, fontWeight: '700', color: '#222', minWidth: 20, textAlign: 'center' },
  bottomNav: {
    flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 10, color: '#aaa', marginTop: 2 },
  navActive: { color: COLORS.primary, fontWeight: '600' },
});
