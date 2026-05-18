import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getProducts, createOrder } from '../../constants/services/api';

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
              console.log('Catalog fetched response:', JSON.stringify(res, null, 2));
              const products = Array.isArray(res) ? res : (res?.data || []);
              setProductCatalog(products.map(p => ({
                  id: p.id,
                  name: p.name,
                  sku: p.sku || `SKU-${p.id}`,
                  unit: p.unit || 'cái',
                  price: typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0),
                  image: p.image || '',
              })));
          } catch (err) {
              console.log('Catalog fetch error:', err.message);
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
                  Alert.alert('Thành công', 'Đơn hàng đã được gửi đến kho');
                  setCart([]);
              } catch (err) {
                  Alert.alert('Lỗi', err.message || 'Không đặt được hàng');
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
          <Ionicons name="settings-outline" size={22} color="#222" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Đặt hàng</Text>
          <Text style={[styles.headerSub, { fontWeight: 'bold', color: '#222' }]}>{userName} · Kingfood Q.7</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/storestatistics')}>
          <Ionicons name="stats-chart-outline" size={22} color="#222" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm sản phẩm..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
            importantForAutofill="no"
            textContentType="oneTimeCode"
          />
        </View>

        {/* Danh mục sản phẩm */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="cart-outline" size={20} color="#222" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
        </View>

        {loadingProducts ? (
          <ActivityIndicator color={COLORS.primary} size="large" />
        ) : (
          filteredProducts.map(product => (
            <TouchableOpacity
              key={product.id}
              style={styles.productRow}
              onPress={() => addToCart(product)}
            >
              {product.image ? (
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="basket-outline" size={22} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productSku}>{product.sku}</Text>
                <Text style={styles.productPrice}>{product.price.toLocaleString()}đ / {product.unit}</Text>
              </View>
              <View style={styles.productAdd}>
                <Text style={styles.productAddBtn}>+</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="document-text-outline" size={18} color="#222" style={{ marginRight: 6 }} />
            <Text style={styles.cartDetailTitle}>Giỏ hàng</Text>
          </View>
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
          <Ionicons name="cart" size={22} color={COLORS.primary} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, styles.navActive]}>Đặt hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/storestatistics')}>
          <Ionicons name="stats-chart-outline" size={22} color="#aaa" style={{ marginBottom: 2 }} />
          <Text style={styles.navLabel}>Thống kê</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/setting')}>
          <Ionicons name="settings-outline" size={22} color="#aaa" style={{ marginBottom: 2 }} />
          <Text style={styles.navLabel}>Cài đặt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/customerprofile')}>
          <Ionicons name="person-outline" size={22} color="#aaa" style={{ marginBottom: 2 }} />
          <Text style={styles.navLabel}>Cá nhân</Text>
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
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, paddingHorizontal: 14, marginBottom: 12,
    borderWidth: 1.5, borderColor: COLORS.accent, height: 52,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#222',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  productRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 8, gap: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
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
  cartDetailTitle: { fontSize: 13, fontWeight: '700', color: '#222' },
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
