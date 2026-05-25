import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
import { Alert } from '../../utils/appAlert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreCart } from '../../contexts/StoreCartContext';
import { getProducts, createOrder, getPublicCategories, getCachedData } from '../../constants/services/api';
import { OrderConfirmModal, OrderSuccessOverlay } from '../../components/OrderCheckoutOverlay';
import { notifyOrdersRefresh } from '../../utils/ordersRefresh';
import { playSound } from '../../utils/soundService';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { translateProductName, translateCategoryName, translateUnit } from '../../utils/translator';

const CART_LIST_MAX_HEIGHT = 152;

// Static Vietnamese accent-insensitive helper
const removeAccents = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

// Static Word boundary matching helper
const matchesSearch = (text, search) => {
  const normalizedText = removeAccents(text.toLowerCase());
  const normalizedSearch = removeAccents(search.trim().toLowerCase());
  if (!normalizedSearch) return true;
  
  const searchWords = normalizedSearch.split(/\s+/).filter(Boolean);
  if (searchWords.length === 0) return true;
  
  const textWords = normalizedText.split(/\s+/).filter(Boolean);
  
  return searchWords.every(sWord => 
    textWords.some(tWord => tWord.startsWith(sWord))
  );
};

// Custom debounce utility
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const TRANSLATIONS = {
  vi: {
    order: 'Đặt hàng',
    stats: 'Thống kê',
    settings: 'Cài đặt',
    profile: 'Cá nhân',
    searchPlaceholder: 'Tìm sản phẩm...',
    all: 'Tất cả',
    catalog: 'Danh mục sản phẩm',
    items: 'sản phẩm',
    sp: 'SP',
    total: 'Tổng cộng',
    cart: 'Giỏ hàng',
    loading: 'Đang tải danh mục thực phẩm...',
    noProducts: 'Không tìm thấy sản phẩm nào phù hợp',
    sending: 'Đang gửi...',
    emptyCartTitle: 'Giỏ hàng trống',
    emptyCartMsg: 'Vui lòng thêm sản phẩm trước khi đặt hàng',
    errorTitle: 'Lỗi',
    orderFailMsg: 'Không đặt được hàng',
  },
  en: {
    order: 'Order',
    stats: 'Statistics',
    settings: 'Settings',
    profile: 'Profile',
    searchPlaceholder: 'Search products...',
    all: 'All',
    catalog: 'Product Catalog',
    items: 'products',
    sp: 'Items',
    total: 'Total',
    cart: 'Cart',
    loading: 'Loading products catalog...',
    noProducts: 'No matching products found',
    sending: 'Sending...',
    emptyCartTitle: 'Empty Cart',
    emptyCartMsg: 'Please add products to your cart before placing an order',
    errorTitle: 'Error',
    orderFailMsg: 'Failed to place order',
  }
};

// Isolated Uncontrolled SearchBar component to prevent parent re-renders and any Telex IME conflicts
const SearchBar = ({ onSearch, isDark, placeholder }) => {
  const debouncedSearch = useMemo(() => {
    return debounce(onSearch, 500);
  }, [onSearch]);

  return (
    <View style={[styles.searchContainer, isDark && { backgroundColor: '#1e1e1e', borderColor: '#2d2d2d' }]}>
      <Ionicons name="search-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
      <TextInput
        style={[styles.searchInput, isDark && { color: '#f3f4f6' }]}
        placeholder={placeholder}
        placeholderTextColor="#666"
        onChangeText={debouncedSearch}
        autoCapitalize="none"
        autoCorrect={true}
        spellCheck={false}
      />
    </View>
  );
};

export default function StoreOrderScreen() {
  const { darkMode, language } = useAppPreferences();
  
  const cachedProdData = getCachedData('/public/products?limit=100');
  const cachedCatData = getCachedData('/public/categories?limit=100');

  const initialProducts = useMemo(() => {
    const products = Array.isArray(cachedProdData) ? cachedProdData : (cachedProdData?.items || cachedProdData?.data || []);
    return products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku || `SKU-${p.id}`,
        unit: p.unit || 'cái',
        price: typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0),
        image: p.image || '',
        categoryId: p.categoryId || p.category_id || p.category?.id || null,
    }));
  }, [cachedProdData]);

  const initialCategories = useMemo(() => {
    return Array.isArray(cachedCatData) ? cachedCatData : (cachedCatData?.items || cachedCatData?.data || []);
  }, [cachedCatData]);

  const [productCatalog, setProductCatalog] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(initialProducts.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { userName } = useAuth();
  const { cart, addToCart, removeFromCart, clearCart, persistCart, updateCartQty } = useStoreCart();
  const insets = useSafeAreaInsets();
  const [searchDebounced, setSearchDebounced] = useState('');
  const [cartExpanded, setCartExpanded] = useState(true);

  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (!persistCart) {
        clearCart();
      }
    });
    return unsubscribe;
  }, [navigation, persistCart, clearCart]);

  const handleSearch = useCallback((text) => {
    setSearchDebounced(text);
  }, []);
  
  const filteredProducts = useMemo(() => {
    return productCatalog.filter(p => {
      const matchSearch = matchesSearch(p.name, searchDebounced) || matchesSearch(p.sku, searchDebounced);
      const matchCategory = selectedCategoryId === null || Number(p.categoryId) === Number(selectedCategoryId);
      return matchSearch && matchCategory;
    });
  }, [productCatalog, searchDebounced, selectedCategoryId]);

  useEffect(() => {
      async function fetchCatalog() {
          try {
              const [prodRes, catRes] = await Promise.all([
                  getProducts(),
                  getPublicCategories().catch(() => null)
              ]);
              console.log('Catalog fetched response:', JSON.stringify(prodRes, null, 2));
              const products = Array.isArray(prodRes) ? prodRes : (prodRes?.items || prodRes?.data || []);
              setProductCatalog(products.map(p => ({
                  id: p.id,
                  name: p.name,
                  sku: p.sku || `SKU-${p.id}`,
                  unit: p.unit || 'cái',
                  price: typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0),
                  image: p.image || '',
                  categoryId: p.categoryId || p.category_id || p.category?.id || null,
              })));

              const cats = Array.isArray(catRes) ? catRes : (catRes?.items || catRes?.data || []);
              setCategories(cats);
          } catch (err) {
              console.log('Catalog fetch error:', err.message);
          } finally {
              setLoadingProducts(false);
          }
      }
      fetchCatalog();
  }, []);

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
  const totalAmount = cart.reduce((sum, c) => sum + c.qty * c.product.price, 0);

  const openConfirm = () => {
    if (cart.length === 0) {
      Alert.alert(t.emptyCartTitle, t.emptyCartMsg);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmOrder = async () => {
    setSubmitting(true);
    try {
      await createOrder(
        cart.map(c => ({
          productId: c.product.id,
          quantity: c.qty,
        }))
      );
      setShowConfirm(false);
      clearCart();
      notifyOrdersRefresh();
      setShowSuccess(true);
      playSound('success'); // Play physical success sound!
    } catch (err) {
      Alert.alert(t.errorTitle, err.message || t.orderFailMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const hasCart = cart.length > 0;

  const t = TRANSLATIONS[language] || TRANSLATIONS.vi;
  const activeBg = darkMode ? '#121212' : '#f0f4f1';
  const activeCardBg = darkMode ? '#1e1e1e' : '#fff';
  const activeTextColor = darkMode ? '#f3f4f6' : '#222';
  const activeTextGrayColor = darkMode ? '#9ca3af' : '#888';
  const activeBorderColor = darkMode ? '#2d2d2d' : '#eee';

  if (loadingProducts) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={{ marginTop: 12, color: activeTextGrayColor }}>{t.loading}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBg }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: activeCardBg, borderBottomColor: activeBorderColor }]}>
        <TouchableOpacity onPress={() => router.push('/setting')}>
          <Ionicons name="settings-outline" size={22} color={activeTextColor} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: activeTextColor }]}>{t.order}</Text>
          <Text style={[styles.headerSub, { fontWeight: 'bold', color: activeTextGrayColor }]}>{userName} · Kingfood Q.7</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/storestatistics')}>
          <Ionicons name="stats-chart-outline" size={22} color={activeTextColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search */}
        <SearchBar onSearch={handleSearch} isDark={darkMode} placeholder={t.searchPlaceholder} />

        {/* Category Filter Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={[
              styles.categoryCap,
              { backgroundColor: activeCardBg, borderColor: activeBorderColor },
              selectedCategoryId === null && styles.categoryCapActive
            ]}
            onPress={() => setSelectedCategoryId(null)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.categoryCapText,
                { color: activeTextGrayColor },
                selectedCategoryId === null && styles.categoryCapTextActive
              ]}
            >
              {t.all}
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isActive = selectedCategoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCap,
                  { backgroundColor: activeCardBg, borderColor: activeBorderColor },
                  isActive && styles.categoryCapActive
                ]}
                onPress={() => setSelectedCategoryId(cat.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryCapText,
                    { color: activeTextGrayColor },
                    isActive && styles.categoryCapTextActive
                  ]}
                >
                  {translateCategoryName(cat.name, language)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Danh mục sản phẩm */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="cart-outline" size={20} color={activeTextColor} style={{ marginRight: 6 }} />
          <Text style={[styles.sectionTitle, { color: activeTextColor }]}>{t.catalog}</Text>
        </View>

        {filteredProducts.length === 0 ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Ionicons name="alert-circle-outline" size={40} color={activeTextGrayColor} />
            <Text style={{ marginTop: 12, color: activeTextGrayColor, textAlign: 'center' }}>{t.noProducts}</Text>
          </View>
        ) : (
          filteredProducts.map(product => (
            <TouchableOpacity
              key={product.id}
              style={[styles.productRow, { backgroundColor: activeCardBg }]}
              onPress={() => addToCart(product)}
            >
              {product.image ? (
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.imagePlaceholder, darkMode && { backgroundColor: '#2d2d2d' }]}>
                  <Ionicons name="basket-outline" size={22} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: activeTextColor }]}>{translateProductName(product.name, language)}</Text>
                <Text style={styles.productPrice}>{product.price.toLocaleString()}{language === 'en' ? ' VND' : 'đ'} / {translateUnit(product.unit, language)}</Text>
              </View>
              <View style={styles.productAdd}>
                <Text style={styles.productAddBtn}>+</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {hasCart && (
        <View style={[styles.cartFooter, { backgroundColor: activeCardBg, borderTopColor: activeBorderColor }]}>
          <View style={styles.cartBar}>
            <View style={styles.cartInfo}>
              <Text style={[styles.cartCount, { color: activeTextColor }]}>{totalItems} {t.items}</Text>
              <Text style={styles.cartTotal}>{totalAmount.toLocaleString()}{language === 'en' ? ' VND' : 'đ'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.orderBtn, submitting && { opacity: 0.7 }]}
              onPress={openConfirm}
              disabled={submitting || showSuccess}
            >
              <Text style={styles.orderBtnText} numberOfLines={1}>
                {submitting
                  ? t.sending
                  : `${t.order} · ${totalItems} ${t.sp} · ${totalAmount.toLocaleString()}${language === 'en' ? ' VND' : 'đ'}`}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.cartDetailHeader, { borderTopColor: activeBorderColor }]}
            onPress={() => setCartExpanded(v => !v)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={18} color={activeTextColor} style={{ marginRight: 6 }} />
              <Text style={[styles.cartDetailTitle, { color: activeTextColor }]}>{t.cart} ({cart.length})</Text>
            </View>
            <Ionicons
              name={cartExpanded ? 'chevron-down' : 'chevron-up'}
              size={18}
              color={activeTextGrayColor}
            />
          </TouchableOpacity>

          {cartExpanded && (
            <ScrollView
              style={{ maxHeight: CART_LIST_MAX_HEIGHT }}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              bounces={false}
            >
              {cart.map(item => (
                <View key={item.product.id} style={[styles.cartItem, { borderTopColor: activeBorderColor }]}>
                  <Text style={[styles.cartItemName, { color: activeTextColor }]} numberOfLines={2}>{translateProductName(item.product.name, language)}</Text>
                  <View style={styles.cartQtyRow}>
                    <TouchableOpacity onPress={() => removeFromCart(item.product.id)} hitSlop={8}>
                      <Text style={styles.qtyBtn}>−</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[
                        styles.cartQtyInput,
                        {
                          color: activeTextColor,
                          backgroundColor: darkMode ? '#2d2d2d' : '#f5f5f5',
                          borderColor: activeBorderColor,
                        }
                      ]}
                      value={String(item.qty)}
                      onChangeText={(val) => {
                        const cleanVal = val.replace(/[^0-9]/g, '');
                        const parsed = cleanVal === '' ? 0 : parseInt(cleanVal, 10);
                        updateCartQty(item.product.id, parsed);
                      }}
                      onBlur={() => {
                        if (item.qty === 0) {
                          removeFromCart(item.product.id);
                        }
                      }}
                      keyboardType="number-pad"
                      selectTextOnFocus
                    />
                    <TouchableOpacity onPress={() => addToCart(item.product)} hitSlop={8}>
                      <Text style={styles.qtyBtn}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      <OrderConfirmModal
        visible={showConfirm}
        totalItems={totalItems}
        totalAmount={totalAmount}
        submitting={submitting}
        onCancel={() => !submitting && setShowConfirm(false)}
        onConfirm={handleConfirmOrder}
      />

      <OrderSuccessOverlay
        visible={showSuccess}
        onDone={() => setShowSuccess(false)}
      />

      <View style={[styles.bottomNav, { backgroundColor: activeCardBg, borderTopColor: activeBorderColor, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="cart" size={22} color={COLORS.primary} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, styles.navActive]}>{t.order}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/storestatistics')}>
          <Ionicons name="stats-chart-outline" size={22} color={activeTextGrayColor} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, { color: activeTextGrayColor }]}>{t.stats}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/setting')}>
          <Ionicons name="settings-outline" size={22} color={activeTextGrayColor} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, { color: activeTextGrayColor }]}>{t.settings}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/customerprofile')}>
          <Ionicons name="person-outline" size={22} color={activeTextGrayColor} style={{ marginBottom: 2 }} />
          <Text style={[styles.navLabel, { color: activeTextGrayColor }]}>{t.profile}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  settingsIcon: { fontSize: 22 },
  statIcon: { fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },
  cartFooter: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  cartDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
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
    backgroundColor: COLORS.warningBg,
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
    flexDirection: 'row', alignItems: 'center',
    padding: 14, paddingBottom: 10, gap: 12,
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
    flexShrink: 1,
    maxWidth: '58%',
    backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 12,
  },
  orderBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  cartDetailTitle: { fontSize: 13, fontWeight: '700', color: '#222' },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: '#f3f3f3',
  },
  cartItemName: { fontSize: 12, color: '#444', flex: 1, marginRight: 10 },
  cartQtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { fontSize: 20, fontWeight: '700', color: COLORS.primary, width: 28, textAlign: 'center' },
  cartQtyInput: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 44,
    height: 32,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  bottomNav: {
    flexDirection: 'row', backgroundColor: '#fff', paddingTop: 10, paddingBottom: 6,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 10, color: '#aaa', marginTop: 2 },
  navActive: { color: COLORS.primary, fontWeight: '600' },
  categoryScroll: {
    marginBottom: 14,
  },
  categoryContainer: {
    gap: 8,
    paddingRight: 16,
  },
  categoryCap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryCapActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  categoryCapText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  categoryCapTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
});
