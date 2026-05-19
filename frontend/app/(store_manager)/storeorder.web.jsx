import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreCart } from '../../contexts/StoreCartContext';
import { Alert } from '../../utils/appAlert';
import { 
  getProducts, 
  createOrder, 
  getClientOrders, 
  getClientStatistics, 
  cancelClientOrder, 
  getProfile, 
  updateProfile,
  changeCustomerPassword,
  logout as apiLogout
} from '../../constants/services/api';
import { getOrderStatusMeta, canCustomerCancelOrder } from '../../constants/orderStatus';
import { validateNewPassword, PASSWORD_HINT } from '../../constants/passwordPolicy';

// Theme Colors
const ORANGE_THEME = {
  primary: '#F26522', // Kingfood iconic orange
  primaryDark: '#D84B06',
  accent: '#FF9800',
  success: '#388E3C',
  bgLight: '#FFF5F0',
  border: '#FDD8C4',
  textDark: '#1E293B',
  textMuted: '#64748b',
};

export default function StoreOrderWebScreen() {
  const { userName, logout } = useAuth();
  const { cart, addToCart, removeFromCart, clearCart } = useStoreCart();

  const [activeTab, setActiveTab] = useState('order');

  // Draft checking invoice modal state
  const [showDraftInvoiceModal, setShowDraftInvoiceModal] = useState(false);
  const [draftInvoiceNumber, setDraftInvoiceNumber] = useState('');
  const [draftInvoiceDate, setDraftInvoiceDate] = useState('');

  // Products catalog
  const [productCatalog, setProductCatalog] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Order submission
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // History orders
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Quick Add SKU
  const [quickSkuText, setQuickSkuText] = useState('');

  // Statistics
  const [statsOrders, setStatsOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [activePreset, setActivePreset] = useState('month');

  // Account
  const [profileUser, setProfileUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phoneNumber: '' });
  
  // Password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // Favorites list
  const [favoritesList, setFavoritesList] = useState([]);

  // Promotions
  const [promotionsList] = useState([
    {
      id: 'promo-1',
      title: 'Lễ hội trái cây mùa hè',
      desc: 'Giảm giá cực đậm 15% mặt hàng Cam Sành tươi ngon loại 1.',
      badge: 'GIẢM 15%',
      targetSku: 'FRUIT-CAM-SANH',
      bannerBg: '#fff3e0',
      tagColor: '#e65100',
    },
    {
      id: 'promo-2',
      title: 'Tuần lễ Sữa tươi Organic',
      desc: 'Bổ sung dinh dưỡng cho gia đình, mua 10 lốc sữa tươi TH True Milk tặng ngay 1 lốc sữa chua.',
      badge: 'MUA 10 TẶNG 1',
      targetSku: 'MILK-TH-TRUE',
      bannerBg: '#e3f2fd',
      tagColor: '#0d47a1',
    },
    {
      id: 'promo-3',
      title: 'Bão deal nước ngọt giải khát',
      desc: 'Ưu đãi mua sỉ Coca-Cola lon tiện lợi phục vụ mùa nóng bức.',
      badge: 'CÀNG MUA CÀNG RẺ',
      targetSku: 'BEV-COCA-COLA',
      bannerBg: '#ffebee',
      tagColor: '#c62828',
    }
  ]);

  // Store Rack Incident Logger
  const [storeIncidents, setStoreIncidents] = useState([
    { id: 1, product: 'Cam Sành Kingfood', type: 'Dập nát khi vận chuyển', severity: 'Cao', status: 'pending', date: '2026-05-19' },
    { id: 2, product: 'Sữa TH True Milk', type: 'Móp méo vỏ hộp', severity: 'Trung bình', status: 'resolved', date: '2026-05-18' }
  ]);
  const [incidentForm, setIncidentForm] = useState({ product: '', type: 'Thiếu hàng trưng bày', severity: 'Trung bình', details: '' });
  const [submittingIncident, setSubmittingIncident] = useState(false);

  // Supplier Support Desk
  const [supportTickets, setSupportTickets] = useState([
    { id: 101, topic: 'Sai lệch số lượng đơn hàng #12', type: 'Giao hàng', date: '2026-05-19', status: 'processing' },
    { id: 102, topic: 'Lỗi thanh toán hóa đơn sỉ', type: 'Thanh toán', date: '2026-05-15', status: 'resolved' }
  ]);
  const [supportForm, setSupportForm] = useState({ topic: '', type: 'Giao nhận', message: '' });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // BRAND NEW RETAIL REPLENISHMENT EXPIRED EXPANSIONS
  
  // 1. Demand forecast lists
  const [forecastList] = useState([
    { name: 'Cam Sành Kingfood', sku: 'FRUIT-CAM-SANH', salesRate: '45kg/tuần', stock: 5, timeLimit: '1 ngày', recommendQty: 40, unit: 'kg' },
    { name: 'Sữa tươi TH True Milk Organic', sku: 'MILK-TH-TRUE', salesRate: '60 hộp/tuần', stock: 8, timeLimit: '1 ngày', recommendQty: 50, unit: 'hộp' },
    { name: 'Coca-Cola Lon 320ml', sku: 'BEV-COCA-COLA', salesRate: '120 lon/tuần', stock: 95, timeLimit: '5 ngày', recommendQty: 30, unit: 'lon' },
    { name: 'Bánh Quy Oreo Socola', sku: 'SNK-OREO', salesRate: '80 hộp/tuần', stock: 68, timeLimit: '6 ngày', recommendQty: 20, unit: 'hộp' }
  ]);

  // 2. Shelf Freshness & Expiration status tracking
  const [shelfFreshness, setShelfFreshness] = useState([
    { id: 1, name: 'Cam Sành Kingfood', expiryDate: '2026-05-21', daysLeft: 2, status: 'critical', price: 35000 },
    { id: 2, name: 'Sữa tươi TH True Milk Organic', expiryDate: '2026-05-24', daysLeft: 5, status: 'warning', price: 42000 },
    { id: 3, name: 'Bánh Quy Oreo Socola', expiryDate: '2026-09-18', daysLeft: 120, status: 'safe', price: 28000 }
  ]);

  // Initial loads
  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoadingProducts(true);
      const res = await getProducts();
      const products = Array.isArray(res) ? res : (res?.items || res?.data || []);
      const mappedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku || `SKU-${p.id}`,
        unit: p.unit || 'cái',
        price: typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0),
        image: p.image || '',
        category: p.category?.name || 'Khác',
      }));
      setProductCatalog(mappedProducts);
      
      if (mappedProducts.length > 0) {
        setFavoritesList(mappedProducts.slice(0, 3));
      }
    } catch (err) {
      console.log('Catalog error:', err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchHistory = async (silent = false) => {
    try {
      if (!silent) setLoadingOrders(true);
      const res = await getClientOrders();
      const fetchedOrders = Array.isArray(res) ? res : [];
      setOrders(fetchedOrders);
      if (selectedOrder) {
        const updated = fetchedOrders.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      console.log('History error:', err.message);
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  const fetchStats = async (start = startDate, end = endDate, silent = false) => {
    try {
      if (!silent) setLoadingStats(true);
      const res = await getClientStatistics(start, end);
      setStatsOrders(res?.orders || []);
      setTopProducts(res?.topProducts || []);
    } catch (err) {
      console.log('Stats error:', err.message);
    } finally {
      if (!silent) setLoadingStats(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setLoadingProfile(true);
      const res = await getProfile();
      if (res) {
        setProfileUser(res);
        setProfileForm({ name: res.name || '', phoneNumber: res.phoneNumber || '' });
      }
    } catch (err) {
      console.log('Profile error:', err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      fetchHistory();
    } else if (tab === 'stats') {
      fetchStats();
    } else if (tab === 'profile') {
      fetchProfileData();
    }
  };

  // Quick SKU input
  const handleQuickSkuAdd = () => {
    if (!quickSkuText.trim()) return;
    const match = productCatalog.find(p => p.sku.toLowerCase() === quickSkuText.trim().toLowerCase());
    if (match) {
      addToCart(match);
      setQuickSkuText('');
      Alert.alert('Thành công', `Đã thêm nhanh sản phẩm "${match.name}" vào giỏ.`);
    } else {
      Alert.alert('Không tìm thấy', `Không tìm thấy sản phẩm nào có SKU khớp với [${quickSkuText}]`);
    }
  };

  const handleToggleFavorite = (product) => {
    const isFav = favoritesList.find(f => f.id === product.id);
    if (isFav) {
      setFavoritesList(prev => prev.filter(f => f.id !== product.id));
    } else {
      setFavoritesList(prev => [...prev, product]);
    }
  };

  // Helper for real-time date/time formatting
  const getFormattedDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Open Draft Invoice preview modal
  const handleOpenDraftInvoice = () => {
    if (cart.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi xuất hoá đơn.');
      return;
    }
    const rand = Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const yStr = now.getFullYear();
    const mStr = String(now.getMonth() + 1).padStart(2, '0');
    const dStr = String(now.getDate()).padStart(2, '0');
    
    setDraftInvoiceNumber(`KF-WMS-${yStr}-${mStr}-${dStr}-${rand}`);
    setDraftInvoiceDate(getFormattedDateTime());
    setShowDraftInvoiceModal(true);
  };

  // Print detailed invoice / Export to PDF
  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank', 'width=950,height=850');
    if (!printWindow) {
      Alert.alert('Trình chặn Pop-up', 'Vui lòng bật quyền hiển thị Pop-up cho trang web này để in/xuất hóa đơn kiểm tra.');
      return;
    }
    
    const itemsHtml = cart.map((item, idx) => `
      <tr style="border-bottom: 1px solid #cbd5e1; height: 38px;">
        <td style="text-align: center; padding: 6px;">${idx + 1}</td>
        <td style="font-weight: 700; padding: 6px;">${item.product.name}</td>
        <td style="font-family: monospace; padding: 6px;">${item.product.sku}</td>
        <td style="text-align: center; padding: 6px;">${item.product.unit}</td>
        <td style="text-align: right; padding: 6px;">${item.product.price.toLocaleString()}đ</td>
        <td style="text-align: center; font-weight: bold; padding: 6px;">${item.qty}</td>
        <td style="text-align: right; font-weight: bold; padding: 6px;">${(item.product.price * item.qty).toLocaleString()}đ</td>
      </tr>
    `).join('');

    const subtotal = totalAmount;
    const vat = totalAmount * 0.08;
    const total = totalAmount * 1.08;

    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn kiểm tra ${draftInvoiceNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #0f172a; padding: 40px; margin: 0; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
            .brand-name { font-size: 15px; font-weight: 900; letter-spacing: 0.5px; }
            .brand-addr, .brand-contact { font-size: 11px; color: #475569; margin-top: 3px; }
            .stamp { border: 2px solid #e53935; border-radius: 6px; padding: 4px 10px; font-weight: 900; color: #e53935; text-transform: uppercase; transform: rotate(-3deg); display: inline-block; margin-bottom: 6px; font-size: 11px; }
            .meta-label { font-size: 11px; color: #475569; margin-top: 3px; }
            .title { font-size: 20px; font-weight: 900; text-align: center; margin-top: 15px; }
            .subtitle { font-size: 10px; color: #64748b; text-align: center; font-weight: bold; margin-top: 4px; margin-bottom: 25px; }
            .details-grid { display: flex; gap: 20px; margin-bottom: 25px; }
            .details-block { flex: 1; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 14px; background-color: #f8fafc; }
            .block-title { font-size: 10px; font-weight: 900; color: #64748b; margin-bottom: 6px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; }
            .details-text { font-size: 11px; color: #334155; line-height: 1.5; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden; margin-bottom: 25px; }
            th { background-color: #f1f5f9; border-bottom: 1.5px solid #0f172a; padding: 8px; font-size: 10px; font-weight: 900; text-align: left; text-transform: uppercase; }
            td { padding: 8px; font-size: 11px; }
            .summary-block { display: flex; gap: 20px; margin-bottom: 25px; }
            .qr-block { flex: 1; display: flex; align-items: center; gap: 12px; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background-color: #f8fafc; }
            .qr-desc { font-size: 10px; color: #64748b; line-height: 1.4; }
            .calcs { width: 300px; }
            .calc-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
            .calc-row-total { display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; border-top: 1.5px solid #0f172a; padding-top: 6px; margin-top: 6px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
            .sign-node { width: 22%; text-align: center; }
            .sign-role { font-size: 11px; font-weight: 900; }
            .sign-hint { font-size: 9px; color: #64748b; margin-top: 2px; }
            .sign-gap { height: 60px; }
            .sign-name { font-size: 10px; font-weight: 800; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand-name">CÔNG TY CỔ PHẦN KINGFOOD MARKET</div>
              <div class="brand-addr">Địa chỉ: 12 Hùng Vương, Phường 4, Quận 5, TP. Hồ Chí Minh</div>
              <div class="brand-contact">Tổng đài sỉ: 1900 6363 · Email: wholesale@kingfoodmarket.com</div>
            </div>
            <div style="text-align: right;">
              <div class="stamp">HÓA ĐƠN NHÁP KIỂM TRA</div>
              <div class="meta-label">Số hóa đơn: <b>${draftInvoiceNumber}</b></div>
              <div class="meta-label">Ngày lập: <b>${draftInvoiceDate}</b></div>
            </div>
          </div>
          <div style="border-top: 1.5px solid #0f172a; border-bottom: 1px solid #cbd5e1; height: 3px; margin-bottom: 15px;"></div>
          
          <div class="title">HÓA ĐƠN BÁN SỈ & KÊ KHAI BÀN GIAO HÀNG HÓA</div>
          <div class="subtitle">(DRAFT WHOLESALE COMMERCIAL & QC CHECKLIST INVOICE)</div>

          <div class="details-grid">
            <div class="details-block">
              <div class="block-title">ĐƠN VỊ CUNG CẤP (SELLER):</div>
              <div class="details-text"><b>TỔNG KHO VẬN HÀNH LOGISTICS WMS KINGFOOD</b></div>
              <div class="details-text">Người lập đơn: Quản trị hệ thống WMS</div>
              <div class="details-text">Kho xuất hàng: Zone Alpha - Kho sỉ Tân Bình</div>
            </div>
            <div class="details-block">
              <div class="block-title">ĐƠN VỊ MUA HÀNG (BUYER):</div>
              <div class="details-text"><b>CHI NHÁNH SIÊU THỊ KINGFOOD MARKET</b></div>
              <div class="details-text">Người nhận đại diện: Quản lý ${userName}</div>
              <div class="details-text">Ghi chú giao nhận: ${deliveryAddress || 'Giao nhận tiêu chuẩn WMS chặng cuối'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">STT</th>
                <th>Tên sản phẩm sỉ</th>
                <th style="width: 90px;">SKU</th>
                <th style="width: 60px; text-align: center;">Đơn vị</th>
                <th style="width: 90px; text-align: right;">Đơn giá</th>
                <th style="width: 60px; text-align: center;">Số lượng</th>
                <th style="width: 110px; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary-block" style="justify-content: flex-end; display: flex;">
            <div style="flex: 1;"></div>
            <div class="calcs">
              <div class="calc-row">
                <span>Cộng tiền hàng (Subtotal):</span>
                <b>${subtotal.toLocaleString()}đ</b>
              </div>
              <div class="calc-row">
                <span>Thuế suất giá trị gia tăng (VAT 8%):</span>
                <b>${vat.toLocaleString()}đ</b>
              </div>
              <div class="calc-row-total">
                <span>TỔNG CỘNG TIỀN THANH TOÁN (TOTAL):</span>
                <span style="color: #F26522;">${total.toLocaleString()}đ</span>
              </div>
            </div>
          </div>

          <div style="border-top: 1px dashed #cbd5e1; margin-top: 30px; margin-bottom: 15px;"></div>

          <div class="signatures" style="display: flex; justify-content: space-around;">
            <div class="sign-node" style="width: 40%; text-align: center;">
              <div class="sign-role">Người Giao Hàng (Thủ Kho / Tài Xế)</div>
              <div class="sign-hint">(Ký, ghi rõ họ tên)</div>
              <div class="sign-gap" style="height: 60px;"></div>
              <div class="sign-name">Trưởng ca WMS / Đội xe tải</div>
            </div>
            <div class="sign-node" style="width: 40%; text-align: center;">
              <div class="sign-role">Người Nhận Hàng (Cửa Hàng)</div>
              <div class="sign-hint">(Ký, ghi rõ họ tên)</div>
              <div class="sign-gap" style="height: 60px;"></div>
              <div class="sign-name">Quản lý ${userName}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Submit order checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmittingOrder(true);
    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.qty,
      }));
      await createOrder({ items, address: deliveryAddress });
      Alert.alert('Thành công', 'Đơn đặt hàng chi nhánh đã được gửi trực tiếp đến hệ thống tổng kho WMS!');
      clearCart();
      setDeliveryAddress('');
      handleTabChange('history');
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo đơn hàng');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Reorder history order
  const handleReorder = (order) => {
    clearCart();
    order.orderDetails?.forEach(detail => {
      if (detail.product) {
        const prod = {
          id: detail.product.id,
          name: detail.product.name,
          sku: detail.product.sku,
          price: parseFloat(detail.price) || 0,
          unit: detail.product.unit || 'cái',
        };
        for (let i = 0; i < detail.quantity; i++) {
          addToCart(prod);
        }
      }
    });
    handleTabChange('order');
    Alert.alert('Sao chép thành công', `Đã đưa ${order.orderDetails?.length || 0} sản phẩm từ đơn #${order.id} vào giỏ hàng mới.`);
  };



  // Cancel order request
  const handleCancelOrder = async (order) => {
    Alert.alert(
      'Yêu cầu huỷ đơn',
      `Bạn chắc chắn muốn huỷ lệnh soạn đơn hàng #${order.id}?`,
      [
        { text: 'Huỷ bỏ', style: 'cancel' },
        {
          text: 'Xác nhận huỷ',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelClientOrder(order.id);
              Alert.alert('Thành công', 'Lệnh soạn đơn hàng đã được huỷ bỏ.');
              fetchHistory(true);
            } catch (err) {
              Alert.alert('Thất bại', err.message || 'Không thể huỷ đơn');
            }
          }
        }
      ]
    );
  };

  // Stats Presets
  const applyPreset = (preset) => {
    setActivePreset(preset);
    const d = new Date();
    let start = '';
    const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    if (preset === 'today') {
      start = end;
    } else if (preset === 'week') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      start = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;
    } else if (preset === 'month') {
      start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }
    
    setStartDate(start);
    setEndDate(end);
    fetchStats(start, end);
  };

  const handleStatsFilter = () => {
    setActivePreset('');
    fetchStats(startDate, endDate);
  };

  // Edit store profiles
  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) return;
    try {
      await updateProfile(profileForm);
      Alert.alert('Thành công', 'Đã cập nhật thông tin chi nhánh Kingfood Market thành công.');
      setEditingProfile(false);
      fetchProfileData();
    } catch (err) {
      Alert.alert('Thất bại', err.message || 'Lỗi lưu thông tin');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    const passwordError = validateNewPassword(newPassword);
    if (passwordError) {
      Alert.alert('Mật khẩu không hợp lệ', passwordError);
      return;
    }
    setChangingPass(true);
    try {
      await changeCustomerPassword({ oldPassword, newPassword });
      Alert.alert('Thành công', 'Đổi mật khẩu tài khoản chi nhánh thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Lỗi đổi mật khẩu');
    } finally {
      setChangingPass(false);
    }
  };

  const handleCreateIncident = async () => {
    if (!incidentForm.product.trim() || !incidentForm.details.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Tên sản phẩm và Chi tiết sự cố.');
      return;
    }
    setSubmittingIncident(true);
    setTimeout(() => {
      setStoreIncidents(prev => [
        {
          id: prev.length + 1,
          product: incidentForm.product.trim(),
          type: incidentForm.type,
          severity: incidentForm.severity,
          status: 'pending',
          date: new Date().toISOString().split('T')[0]
        },
        ...prev
      ]);
      setIncidentForm({ product: '', type: 'Thiếu hàng trưng bày', severity: 'Trung bình', details: '' });
      setSubmittingIncident(false);
      Alert.alert('Đã tiếp nhận sự cố', 'Báo cáo sự cố kệ hàng đã được chuyển tiếp trực tiếp đến Bộ phận vận hành kho WMS.');
    }, 800);
  };

  const handleCreateTicket = async () => {
    if (!supportForm.topic.trim() || !supportForm.message.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền tiêu đề và nội dung yêu cầu.');
      return;
    }
    setSubmittingTicket(true);
    setTimeout(() => {
      setSupportTickets(prev => [
        {
          id: prev.length + 101,
          topic: supportForm.topic.trim(),
          type: supportForm.type,
          date: new Date().toISOString().split('T')[0],
          status: 'processing'
        },
        ...prev
      ]);
      setSupportForm({ topic: '', type: 'Giao nhận', message: '' });
      setSubmittingTicket(false);
      Alert.alert('Khởi tạo Ticket hỗ trợ', 'Yêu cầu hỗ trợ đã được chuyển tiếp đến Tổng đài điều phối Kingfood.');
    }, 800);
  };

  // RETAIL EXPANSION INTERACTIVE ACTIONS
  
  // 1. One-click Auto replenishment cart filler
  const handleApplyForecastReplenish = () => {
    forecastList.forEach(item => {
      // Find corresponding product catalog item
      const match = productCatalog.find(p => p.sku === item.sku);
      if (match) {
        // Add recommended quantity
        for (let i = 0; i < item.recommendQty; i++) {
          addToCart(match);
        }
      }
    });
    Alert.alert('Tiếp tế tự động', 'Đã tự động tính toán nhu cầu và thêm toàn bộ số lượng đề xuất bổ sung hàng hoá vào Giỏ hàng chi nhánh thành công!');
    handleTabChange('order');
  };

  // 2. Shelf product Markdown clearance promo
  const handleMarkdownShelf = (id) => {
    setShelfFreshness(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, price: Math.round(s.price * 0.8), status: 'safe', expiryDate: 'Đã thanh lý 20%' };
      }
      return s;
    }));
    Alert.alert('Áp dụng Markdown thành công', 'Hệ thống đã in Barcode chiết khấu 20% xả hàng cận hạn. Mức giá mới đã được cập nhật trực tiếp tại kệ chi nhánh!');
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      // fallback
    } finally {
      logout();
      router.replace('/login');
    }
  };

  // Total calculations
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  const categories = ['All', ...new Set(productCatalog.map(p => p.category))];

  const filteredProducts = productCatalog.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.webContainer}>
      
      {/* HTML specific print directives */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, .webContainer {
            background-color: #fff !important;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            background-color: #fff !important;
            padding: 30px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* 1. Kingfood Orange Sidebar */}
      <View style={[styles.sidebar, { className: 'no-print' }]}>
        <View style={styles.sidebarHeader}>
          <View style={styles.logoCircle}>
            <Ionicons name="storefront" size={24} color={ORANGE_THEME.primary} />
          </View>
          <View>
            <Text style={styles.brandTitle}>Kingfood Market</Text>
            <Text style={styles.brandSubtitle}>Cửa hàng Chi nhánh</Text>
          </View>
        </View>

        <View style={styles.menuGroup}>
          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'order' && styles.menuItemActive]} 
            onPress={() => handleTabChange('order')}
          >
            <Ionicons name="cart" size={20} color={activeTab === 'order' ? '#fff' : ORANGE_THEME.textMuted} />
            <Text style={[styles.menuLabel, activeTab === 'order' && styles.menuLabelActive]}>Lên đơn hàng mới</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'history' && styles.menuItemActive]} 
            onPress={() => handleTabChange('history')}
          >
            <Ionicons name="document-text" size={20} color={activeTab === 'history' ? '#fff' : ORANGE_THEME.textMuted} />
            <Text style={[styles.menuLabel, activeTab === 'history' && styles.menuLabelActive]}>Lịch sử đơn đặt</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'stats' && styles.menuItemActive]} 
            onPress={() => handleTabChange('stats')}
          >
            <Ionicons name="analytics" size={20} color={activeTab === 'stats' ? '#fff' : ORANGE_THEME.textMuted} />
            <Text style={[styles.menuLabel, activeTab === 'stats' && styles.menuLabelActive]}>Báo cáo chi tiêu</Text>
          </TouchableOpacity>

          {/* ADVANCED BRAND NEW OPERATIONS TAB 1: CURATED AUTO-REPLENISHMENT FORECAST */}
          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'replenishment-forecast' && styles.menuItemActive]} 
            onPress={() => handleTabChange('replenishment-forecast')}
          >
            <Ionicons name="bulb" size={20} color={activeTab === 'replenishment-forecast' ? '#fff' : ORANGE_THEME.textMuted} />
            <Text style={[styles.menuLabel, activeTab === 'replenishment-forecast' && styles.menuLabelActive]}>Dự phóng đặt hàng</Text>
          </TouchableOpacity>

          {/* ADVANCED BRAND NEW OPERATIONS TAB 2: SHELF EXPIRATION MARKDOWN BARCODES */}
          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'shelf-life' && styles.menuItemActive]} 
            onPress={() => handleTabChange('shelf-life')}
          >
            <Ionicons name="time" size={20} color={activeTab === 'shelf-life' ? '#fff' : ORANGE_THEME.textMuted} />
            <Text style={[styles.menuLabel, activeTab === 'shelf-life' && styles.menuLabelActive]}>Hạn dùng kệ hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'favorites' && styles.menuItemActive]} 
            onPress={() => handleTabChange('favorites')}
          >
            <Ionicons name="heart" size={20} color={activeTab === 'favorites' ? '#fff' : ORANGE_THEME.textMuted} />
            <Text style={[styles.menuLabel, activeTab === 'favorites' && styles.menuLabelActive]}>Danh mục Thường đặt</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'promotions' && styles.menuItemActive]} 
            onPress={() => handleTabChange('promotions')}
          >
            <Ionicons name="flame" size={20} color={activeTab === 'promotions' ? '#fff' : ORANGE_THEME.textMuted} />
            <Text style={[styles.menuLabel, activeTab === 'promotions' && styles.menuLabelActive]}>Ưu đãi & Khuyến mãi</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'store-incidents' && styles.menuItemActive]} 
            onPress={() => handleTabChange('store-incidents')}
          >
            <Ionicons name="warning" size={20} color={activeTab === 'store-incidents' ? '#fff' : ORANGE_THEME.textMuted} />
            <Text style={[styles.menuLabel, activeTab === 'store-incidents' && styles.menuLabelActive]}>Báo sự cố kệ hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'support' && styles.menuItemActive]} 
            onPress={() => handleTabChange('support')}
          >
            <Ionicons name="chatbubbles" size={20} color={activeTab === 'support' ? '#fff' : ORANGE_THEME.textMuted} />
            <Text style={[styles.menuLabel, activeTab === 'support' && styles.menuLabelActive]}>Tổng đài hỗ trợ</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'profile' && styles.menuItemActive]} 
            onPress={() => handleTabChange('profile')}
          >
            <Ionicons name="person" size={20} color={activeTab === 'profile' ? '#fff' : ORANGE_THEME.textMuted} />
            <Text style={[styles.menuLabel, activeTab === 'profile' && styles.menuLabelActive]}>Hồ sơ & Bảo mật</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sidebarFooter}>
          <View style={styles.managerCard}>
            <View style={styles.managerAvatar}>
              <Text style={styles.managerAvatarText}>KF</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.managerName} numberOfLines={1}>{userName}</Text>
              <Text style={styles.managerRole}>Quản lý Chi nhánh</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.logoutBtnText}>Đăng xuất Cửa hàng</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Main content area */}
      <View style={styles.mainContent}>
        <View style={[styles.topbar, { className: 'no-print' }]}>
          <View>
            <Text style={styles.topbarHeading}>Chào ngày mới, {userName}! 🛒</Text>
            <Text style={styles.topbarSub}>Đặt mua hàng tươi ngon, đồng bộ năng suất trực tiếp đến tổng kho.</Text>
          </View>
          <View style={styles.topbarRight}>
            <View style={styles.greenLiveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Cổng mua hàng online</Text>
            </View>
          </View>
        </View>

        {/* Dynamic tabs render */}
        <View style={styles.workspace}>
          
          {/* TAB 1: ORDER WORKSPACE */}
          {activeTab === 'order' && (
            <View style={styles.splitLayout}>
              
              {/* Product Catalog list left side */}
              <View style={styles.catalogSide}>
                
                {/* Search banner */}
                <View style={styles.searchBannerCard}>
                  <View style={styles.orangeGradientBanner}>
                    <Text style={styles.bannerHeadline}>Kingfood Market Supplier Portal</Text>
                    <Text style={styles.bannerSubtext}>Lên đơn thực phẩm nhanh chóng, giao hàng chuẩn xác trong 24 giờ tới chi nhánh.</Text>
                  </View>

                  <View style={styles.filterControllerRow}>
                    <View style={styles.searchBar}>
                      <Ionicons name="search" size={18} color={ORANGE_THEME.textMuted} style={{ marginRight: 10 }} />
                      <TextInput 
                        style={styles.searchInputWeb}
                        placeholder="Tìm sản phẩm theo tên hoặc mã SKU sản phẩm..."
                        value={search}
                        onChangeText={setSearch}
                      />
                    </View>

                    {/* Chips scroll */}
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                      {categories.map(cat => (
                        <TouchableOpacity 
                          key={cat} 
                          style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                          onPress={() => setSelectedCategory(cat)}
                        >
                          <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                            {cat === 'All' ? 'Tất cả danh mục' : cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Catalog scroll */}
                {loadingProducts ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="large" color={ORANGE_THEME.primary} />
                    <Text style={{ marginTop: 12, color: ORANGE_THEME.textMuted }}>Đang tải danh mục thực phẩm...</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.catalogItemsScroll} contentContainerStyle={styles.catalogGrid}>
                    {filteredProducts.length === 0 ? (
                      <View style={styles.emptySearch}>
                        <Ionicons name="basket-outline" size={64} color="#e2e8f0" />
                        <Text style={{ marginTop: 16, fontSize: 15, fontWeight: '700', color: ORANGE_THEME.textMuted }}>Không tìm thấy sản phẩm nào phù hợp</Text>
                      </View>
                    ) : (
                      filteredProducts.map(product => {
                        const inCart = cart.find(c => c.product.id === product.id);
                        const isFav = favoritesList.find(f => f.id === product.id);
                        return (
                          <View key={product.id} style={styles.productCard}>
                            {/* Favorite Heart Badge */}
                            <TouchableOpacity style={styles.favoriteHeartBadge} onPress={() => handleToggleFavorite(product)}>
                              <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? "#e53935" : ORANGE_THEME.textMuted} />
                            </TouchableOpacity>

                            {product.image ? (
                              <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
                            ) : (
                              <View style={styles.productImagePlaceholder}>
                                <Ionicons name="nutrition" size={32} color={ORANGE_THEME.primary} />
                              </View>
                            )}

                            <View style={styles.productCardInfo}>
                              <Text style={styles.productCategoryLabel}>{product.category}</Text>
                              <Text style={styles.productNameLabel} numberOfLines={2}>{product.name}</Text>
                              <Text style={styles.productSkuLabel}>SKU: {product.sku}</Text>
                              
                              <View style={styles.productPriceActionRow}>
                                <Text style={styles.productPriceVal}>
                                  {product.price.toLocaleString()}đ
                                  <Text style={styles.unitLabel}> / {product.unit}</Text>
                                </Text>

                                {inCart ? (
                                  <View style={styles.cardQtyController}>
                                    <TouchableOpacity style={styles.qtyBtnSmall} onPress={() => removeFromCart(product.id)}>
                                      <Text style={styles.qtyBtnTextSmall}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.qtyValSmall}>{inCart.qty}</Text>
                                    <TouchableOpacity style={styles.qtyBtnSmall} onPress={() => addToCart(product)}>
                                      <Text style={styles.qtyBtnTextSmall}>+</Text>
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <TouchableOpacity style={styles.addBtnSmall} onPress={() => addToCart(product)}>
                                    <Ionicons name="add" size={14} color="#fff" />
                                    <Text style={styles.addBtnTextSmall}>Thêm</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </ScrollView>
                )}

              </View>

              {/* Shopping Cart panel right side */}
              <View style={styles.cartSide}>
                <View style={styles.cartSideHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.cartIconCircle}>
                      <Ionicons name="basket" size={20} color="#fff" />
                    </View>
                    <Text style={styles.cartSideTitle}>Giỏ hàng chi nhánh</Text>
                  </View>
                  <Text style={styles.cartBadgeWeb}>{totalItems} SKU</Text>
                </View>

                {/* SKU DIRECT INPUT QUICK-ADD */}
                <View style={styles.quickSkuPanel}>
                  <Text style={styles.quickSkuLabel}>Thêm nhanh bằng mã SKU:</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput 
                      style={styles.quickSkuInput}
                      placeholder="Nhập mã SKU (Ví dụ: SKU-1)"
                      value={quickSkuText}
                      onChangeText={setQuickSkuText}
                      onSubmitEditing={handleQuickSkuAdd}
                    />
                    <TouchableOpacity style={styles.quickSkuBtn} onPress={handleQuickSkuAdd}>
                      <Ionicons name="add" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                {cart.length === 0 ? (
                  <View style={styles.cartEmptyContainer}>
                    <Ionicons name="cart-outline" size={72} color="#fdd8c4" style={{ marginBottom: 16 }} />
                    <Text style={styles.cartEmptyText}>Chưa chọn hàng hóa nào</Text>
                    <Text style={styles.cartEmptySub}>Hãy nhấn vào nút "Thêm" của các sản phẩm ở bên trái để đưa thực phẩm vào giỏ hàng chi nhánh.</Text>
                  </View>
                ) : (
                  <>
                    <ScrollView style={styles.cartItemsScrollWeb}>
                      {cart.map(item => (
                        <View key={item.product.id} style={styles.cartRowWeb}>
                          <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.cartRowName} numberOfLines={1}>{item.product.name}</Text>
                            <Text style={styles.cartRowPrice}>{(item.product.price).toLocaleString()}đ · Hộp x{item.qty}</Text>
                          </View>
                          <View style={styles.cartRowControls}>
                            <TouchableOpacity style={styles.qtyArrow} onPress={() => removeFromCart(item.product.id)}>
                              <Text style={styles.qtyArrowText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.qtyArrowVal}>{item.qty}</Text>
                            <TouchableOpacity style={styles.qtyArrow} onPress={() => addToCart(item.product)}>
                              <Text style={styles.qtyArrowText}>+</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.cartRowSub}>{(item.product.price * item.qty).toLocaleString()}đ</Text>
                        </View>
                      ))}
                    </ScrollView>

                    <View style={styles.cartFooterCheckout}>
                      <Text style={styles.checkoutLabelWeb}>Ghi chú giao nhận / Chỉ định nhận hàng:</Text>
                      <TextInput 
                        style={styles.checkoutInputWeb}
                        placeholder="Nhập ghi chú (Ví dụ: Giao sảnh A, giao lúc 8:00 sáng...)"
                        value={deliveryAddress}
                        onChangeText={setDeliveryAddress}
                      />

                      <View style={styles.checkoutDivider} />

                      <View style={styles.priceSummaryRow}>
                        <Text style={styles.summaryLabel}>Tổng trị giá tiền hàng:</Text>
                        <Text style={styles.summaryValue}>{totalAmount.toLocaleString()}đ</Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                        <TouchableOpacity 
                          style={[styles.checkoutActionBtn, { flex: 1, backgroundColor: '#475569' }]} 
                          onPress={handleOpenDraftInvoice}
                        >
                          <Ionicons name="receipt" size={18} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={styles.checkoutActionBtnText}>Xuất HĐ Kiểm Tra</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.checkoutActionBtn, { flex: 1 }, submittingOrder && { opacity: 0.7 }]} 
                          onPress={handleCheckout}
                          disabled={submittingOrder}
                        >
                          {submittingOrder ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="bag-check" size={18} color="#fff" style={{ marginRight: 6 }} />
                              <Text style={styles.checkoutActionBtnText}>Gửi Đơn Hàng</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}
              </View>

            </View>
          )}

          {/* TAB 2: ORDER HISTORY WORKSPACE */}
          {activeTab === 'history' && (
            <View style={styles.splitLayout}>
              
              {/* Orders History List left column */}
              <View style={[styles.catalogSide, { flex: 4, backgroundColor: '#fff', borderRightWidth: 1.5, borderRightColor: '#f1f5f9' }]}>
                <View style={styles.panelTitleRow}>
                  <Text style={styles.panelTitleHeading}>Hành trình đơn đặt hàng</Text>
                  <TouchableOpacity style={styles.refreshBtnRow} onPress={() => fetchHistory()}>
                    <Ionicons name="refresh" size={14} color={ORANGE_THEME.primary} style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: ORANGE_THEME.primary }}>Tải lại</Text>
                  </TouchableOpacity>
                </View>

                {loadingOrders ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="large" color={ORANGE_THEME.primary} />
                  </View>
                ) : orders.length === 0 ? (
                  <View style={styles.loadingWrapper}>
                    <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
                    <Text style={{ color: ORANGE_THEME.textMuted, marginTop: 12 }}>Chi nhánh chưa tạo đơn đặt hàng nào.</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.historyListScroll}>
                    {orders.map(order => {
                      const meta = getOrderStatusMeta(order.status);
                      const isSelected = selectedOrder?.id === order.id;
                      const dateText = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '';

                      return (
                        <TouchableOpacity 
                          key={order.id} 
                          style={[styles.historyCard, isSelected && styles.historyCardSelected]}
                          onPress={() => setSelectedOrder(order)}
                        >
                          <View style={styles.historyCardHeader}>
                            <Text style={styles.historyCardId}>Đơn đặt hàng #{order.id}</Text>
                            <View style={[styles.statusBadgeWeb, { backgroundColor: meta.bg }]}>
                              <Text style={[styles.statusBadgeTextWeb, { color: meta.color }]}>{meta.label}</Text>
                            </View>
                          </View>
                          
                          <View style={styles.historyCardMeta}>
                            <Text style={styles.historyCardMetaText}><Ionicons name="calendar-outline" /> {dateText}</Text>
                            <Text style={styles.historyCardMetaText}><Ionicons name="cube-outline" /> {order.orderDetails?.length || 0} sản phẩm</Text>
                          </View>

                          <View style={styles.historyCardFooter}>
                            <Text style={styles.historyCardTotalLabel}>Thanh toán:</Text>
                            <Text style={styles.historyCardTotalVal}>{(parseFloat(order.totalPrice) || 0).toLocaleString()}đ</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Order Inspect detailed invoice right column */}
              <View style={[styles.cartSide, { flex: 6, backgroundColor: '#f8fafc' }]}>
                {selectedOrder ? (
                  <View style={styles.invoiceWrapper} id="print-area">
                    
                    {/* Invoice header */}
                    <View style={styles.invoiceHeaderRow}>
                      <View>
                        <Text style={styles.invoiceHeading}>CHI TIẾT HÓA ĐƠN ĐẶT HÀNG</Text>
                        <Text style={styles.invoiceSubtext}>Mã đơn hàng: #{selectedOrder.id} · Đặt ngày: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</Text>
                      </View>

                      {/* Web-only action items */}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        
                        <TouchableOpacity style={[styles.cancelBtnWeb, { backgroundColor: ORANGE_THEME.primary }]} onPress={() => handleReorder(selectedOrder)}>
                          <Ionicons name="copy-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                          <Text style={styles.cancelBtnTextWeb}>Đặt lại đơn này</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.cancelBtnWeb, { backgroundColor: '#475569' }]} onPress={handlePrintInvoice}>
                          <Ionicons name="print-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                          <Text style={styles.cancelBtnTextWeb}>In Hóa Đơn</Text>
                        </TouchableOpacity>

                        {canCustomerCancelOrder(selectedOrder.status) && (
                          <TouchableOpacity style={[styles.cancelBtnWeb, { backgroundColor: '#e53935' }]} onPress={() => handleCancelOrder(selectedOrder)}>
                            <Ionicons name="close-circle-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.cancelBtnTextWeb}>Yêu cầu huỷ đơn</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* INTERACTIVE TRACKING LIFECYCLE STEPPER */}
                    <View style={styles.stepperContainer}>
                      <Text style={styles.stepperLabel}>Tiến trình đơn đặt hàng:</Text>
                      <View style={styles.stepperRow}>
                        
                        <View style={styles.stepNode}>
                          <View style={[styles.stepDotCircle, selectedOrder.status === 'pending' || selectedOrder.status === 'processing' || selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? styles.stepDotActive : {}]}>
                            <Ionicons name="time" size={16} color="#fff" />
                          </View>
                          <Text style={styles.stepDotLabel}>Chờ duyệt</Text>
                        </View>

                        <View style={[styles.stepperLine, selectedOrder.status === 'processing' || selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? styles.stepperLineActive : {}]} />

                        <View style={styles.stepNode}>
                          <View style={[styles.stepDotCircle, selectedOrder.status === 'processing' || selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? styles.stepDotActive : {}]}>
                            <Ionicons name="construct" size={16} color="#fff" />
                          </View>
                          <Text style={styles.stepDotLabel}>Đang soạn</Text>
                        </View>

                        <View style={[styles.stepperLine, selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? styles.stepperLineActive : {}]} />

                        <View style={styles.stepNode}>
                          <View style={[styles.stepDotCircle, selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? styles.stepDotActive : {}]}>
                            <Ionicons name="paper-plane" size={16} color="#fff" />
                          </View>
                          <Text style={styles.stepDotLabel}>Đang giao</Text>
                        </View>

                        <View style={[styles.stepperLine, selectedOrder.status === 'delivered' ? styles.stepperLineActive : {}]} />

                        <View style={styles.stepNode}>
                          <View style={[styles.stepDotCircle, selectedOrder.status === 'delivered' ? styles.stepDotActive : {}]}>
                            <Ionicons name="checkmark-circle" size={16} color="#fff" />
                          </View>
                          <Text style={styles.stepDotLabel}>Đã giao</Text>
                        </View>

                      </View>
                    </View>

                    {/* Meta panels */}
                    <View style={styles.invoiceStatsRow}>
                      <View style={styles.invoiceStatBox}>
                        <Text style={styles.statBoxLabel}>Trạng thái hiện hành</Text>
                        <Text style={[styles.statBoxValue, { color: getOrderStatusMeta(selectedOrder.status).color, fontWeight: '800' }]}>
                          {getOrderStatusMeta(selectedOrder.status).label}
                        </Text>
                      </View>

                      <View style={styles.invoiceStatBox}>
                        <Text style={styles.statBoxLabel}>Tổng giá trị tiền hàng</Text>
                        <Text style={[styles.statBoxValue, { color: ORANGE_THEME.primary, fontWeight: '800' }]}>
                          {(parseFloat(selectedOrder.totalPrice) || 0).toLocaleString()}đ
                        </Text>
                      </View>
                    </View>

                    <View style={styles.invoiceDeliveryCard}>
                      <Text style={styles.invoiceCardLabel}>Chỉ dẫn giao nhận / Ghi chú đơn hàng:</Text>
                      <Text style={styles.invoiceCardVal}>{selectedOrder.address || 'Không ghi chú.'}</Text>
                    </View>

                    {/* Table display */}
                    <View style={{ flex: 1, marginTop: 12 }}>
                      <Text style={styles.invoiceCardLabel}>Bảng chi tiết hàng hoá:</Text>
                      
                      <View style={styles.invoiceTableHeader}>
                        <Text style={[styles.thCell, { flex: 2.5 }]}>Tên sản phẩm thực phẩm</Text>
                        <Text style={[styles.thCell, { flex: 1 }]}>SKU</Text>
                        <Text style={[styles.thCell, { flex: 0.8, textAlign: 'center' }]}>Số lượng</Text>
                        <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>Đơn giá</Text>
                        <Text style={[styles.thCell, { flex: 1.5, textAlign: 'right' }]}>Thành tiền</Text>
                      </View>

                      <ScrollView style={styles.invoiceTableBody}>
                        {selectedOrder.orderDetails?.map((item, index) => {
                          const p = parseFloat(item.price) || 0;
                          const subTotal = p * item.quantity;
                          return (
                            <View key={item.id || index} style={styles.invoiceTableRow}>
                              <Text style={[styles.tdCell, { flex: 2.5, fontWeight: '600' }]} numberOfLines={1}>
                                {item.product?.name || 'Sản phẩm'}
                              </Text>
                              <Text style={[styles.tdCell, { flex: 1, color: ORANGE_THEME.textMuted }]}>
                                {item.product?.sku || '—'}
                              </Text>
                              <Text style={[styles.tdCell, { flex: 0.8, textAlign: 'center', fontWeight: 'bold' }]}>
                                {item.quantity}
                              </Text>
                              <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right' }]}>
                                {p.toLocaleString()}đ
                              </Text>
                              <Text style={[styles.tdCell, { flex: 1.5, textAlign: 'right', fontWeight: 'bold', color: ORANGE_THEME.primary }]}>
                                {subTotal.toLocaleString()}đ
                              </Text>
                            </View>
                          );
                        })}
                      </ScrollView>
                    </View>

                  </View>
                ) : (
                  <View style={styles.invoicePlaceholderContainer}>
                    <Ionicons name="document-text" size={80} color="#fdd8c4" style={{ marginBottom: 16 }} />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: ORANGE_THEME.textDark }}>Chưa chọn đơn hàng cụ thể</Text>
                    <Text style={{ fontSize: 12, color: ORANGE_THEME.textMuted, marginTop: 4, textAlign: 'center' }}>Nhấn vào đơn hàng bất kỳ trong lịch sử đặt hàng bên trái để xem đầy đủ chi tiết hoá đơn.</Text>
                  </View>
                )}
              </View>

            </View>
          )}

          {/* TAB 3: SPENDING ANALYTICS WORKSPACE */}
          {activeTab === 'stats' && (
            <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 32 }}>
              
              {/* Date controller panel */}
              <View style={styles.statsControllerBox}>
                <View style={styles.statsPanelTitleRow}>
                  <Ionicons name="funnel-outline" size={18} color={ORANGE_THEME.primary} />
                  <Text style={styles.statsControllerHeading}>Lọc báo cáo chi tiêu đơn hàng</Text>
                </View>

                <View style={styles.filterFormRow}>
                  <View style={styles.filterFormGroup}>
                    <Text style={styles.filterInputLabel}>Từ ngày đặt</Text>
                    <TextInput 
                      style={styles.filterInputWeb}
                      placeholder="YYYY-MM-DD"
                      value={startDate}
                      onChangeText={setStartDate}
                    />
                  </View>

                  <View style={styles.filterFormGroup}>
                    <Text style={styles.filterInputLabel}>Đến ngày đặt</Text>
                    <TextInput 
                      style={styles.filterInputWeb}
                      placeholder="YYYY-MM-DD"
                      value={endDate}
                      onChangeText={setEndDate}
                    />
                  </View>

                  <TouchableOpacity style={styles.submitFilterBtn} onPress={handleStatsFilter}>
                    <Ionicons name="search" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 4 }}>Lọc báo cáo</Text>
                  </TouchableOpacity>

                  <View style={styles.presetGroupRow}>
                    <TouchableOpacity 
                      style={[styles.presetBtnWeb, activePreset === 'today' && styles.presetBtnActiveWeb]} 
                      onPress={() => applyPreset('today')}
                    >
                      <Text style={[styles.presetBtnText, activePreset === 'today' && styles.presetBtnTextActive]}>Hôm nay</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.presetBtnWeb, activePreset === 'week' && styles.presetBtnActiveWeb]} 
                      onPress={() => applyPreset('week')}
                    >
                      <Text style={[styles.presetBtnText, activePreset === 'week' && styles.presetBtnTextActive]}>Tuần này</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.presetBtnWeb, activePreset === 'month' && styles.presetBtnActiveWeb]} 
                      onPress={() => applyPreset('month')}
                    >
                      <Text style={[styles.presetBtnText, activePreset === 'month' && styles.presetBtnTextActive]}>Tháng này</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Loader or Stats layout */}
              {loadingStats ? (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="large" color={ORANGE_THEME.primary} />
                </View>
              ) : (
                <>
                  <View style={styles.statsKpiGrid}>
                    <View style={styles.statsKpiCard}>
                      <Ionicons name="cart-outline" size={24} color={ORANGE_THEME.primary} style={styles.kpiCardIcon} />
                      <Text style={styles.kpiCardLabel}>Tổng Số Đơn Đặt</Text>
                      <Text style={styles.kpiCardValue}>{statsOrders.length} đơn</Text>
                    </View>

                    <View style={styles.statsKpiCard}>
                      <Ionicons name="cash-outline" size={24} color={ORANGE_THEME.success} style={styles.kpiCardIcon} />
                      <Text style={styles.kpiCardLabel}>Tổng Tiền Chi Tiêu sỉ</Text>
                      <Text style={styles.kpiCardValue}>
                        {statsOrders.reduce((sum, o) => sum + (parseFloat(o.totalPrice) || 0), 0).toLocaleString()}đ
                      </Text>
                    </View>

                    <View style={styles.statsKpiCard}>
                      <Ionicons name="checkmark-done-circle" size={24} color="#0284c7" style={styles.kpiCardIcon} />
                      <Text style={styles.kpiCardLabel}>Đơn Soạn Hoàn Thành</Text>
                      <Text style={styles.kpiCardValue}>
                        {statsOrders.filter(o => o.status === 'delivered').length} / {statsOrders.length} đơn
                      </Text>
                    </View>
                  </View>

                  <View style={styles.analyticalCardsGrid}>
                    <View style={styles.analyticPanelCard}>
                      <View style={styles.statsCardHeadingRowWeb}>
                        <Ionicons name="trophy-outline" size={18} color={ORANGE_THEME.primary} />
                        <Text style={styles.analyticCardTitle}>Top SKU nhập hàng sỉ nhiều nhất</Text>
                      </View>

                      {topProducts.length === 0 ? (
                        <View style={styles.statsEmptyStateWeb}>
                          <Text style={{ color: ORANGE_THEME.textMuted }}>Không có dữ liệu SKU sỉ nào.</Text>
                        </View>
                      ) : (
                        <View style={styles.topProductsListWeb}>
                          {topProducts.slice(0, 5).map((item, index) => (
                            <View key={index} style={styles.topProductItemRowWeb}>
                              <View style={[styles.topRankBadge, index === 0 ? styles.rankGold : index === 1 ? styles.rankSilver : index === 2 ? styles.rankBronze : {}]}>
                                <Text style={styles.topRankText}>{index + 1}</Text>
                              </View>
                              <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.topProductName}>{item.name}</Text>
                                <Text style={styles.topProductDetails}>Tổng số lượng đặt sỉ: {item.totalQty} cái/hộp</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={[styles.analyticPanelCard, { flex: 1.5 }]}>
                      <View style={styles.statsCardHeadingRowWeb}>
                        <Ionicons name="list" size={18} color={ORANGE_THEME.primary} />
                        <Text style={styles.analyticCardTitle}>Danh sách hóa đơn kê khai</Text>
                      </View>

                      {statsOrders.length === 0 ? (
                        <View style={styles.statsEmptyStateWeb}>
                          <Text style={{ color: ORANGE_THEME.textMuted }}>Chưa phát sinh hóa đơn trong kỳ.</Text>
                        </View>
                      ) : (
                        <View style={styles.reportsTableWeb}>
                          <View style={styles.reportsTableHeaderWeb}>
                            <Text style={[styles.rthCell, { flex: 1 }]}>ID đơn</Text>
                            <Text style={[styles.rthCell, { flex: 2.5 }]}>Ngày khởi tạo</Text>
                            <Text style={[styles.rthCell, { flex: 2 }]}>Trạng thái</Text>
                            <Text style={[styles.rthCell, { flex: 2, textAlign: 'right' }]}>Trị giá đơn</Text>
                          </View>

                          {statsOrders.map(order => (
                            <View key={order.id} style={styles.reportsTableRowWeb}>
                              <Text style={[styles.rtdCell, { flex: 1, fontWeight: 'bold' }]}>#{order.id}</Text>
                              <Text style={[styles.rtdCell, { flex: 2.5 }]}>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</Text>
                              <Text style={[styles.rtdCell, { flex: 2, color: getOrderStatusMeta(order.status).color, fontWeight: '800' }]}>
                                {getOrderStatusMeta(order.status).label}
                              </Text>
                              <Text style={[styles.rtdCell, { flex: 2, textAlign: 'right', fontWeight: 'bold', color: ORANGE_THEME.primary }]}>
                                {(parseFloat(order.totalPrice) || 0).toLocaleString()}đ
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          )}

          {/* ADVANCED BRAND NEW OPERATIONS TAB 1: CURATED AUTO-REPLENISHMENT FORECAST VIEW */}
          {activeTab === 'replenishment-forecast' && (
            <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 28 }}>
              <View style={[styles.profileHeadingRow, { justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="bulb" size={24} color={ORANGE_THEME.primary} />
                  <Text style={styles.profileSectionTitle}>Dự phóng Tiêu Thụ & Tự động Đề Xuất Đặt Hàng Chi Nhánh</Text>
                </View>
                
                <TouchableOpacity style={styles.submitFilterBtn} onPress={handleApplyForecastReplenish}>
                  <Ionicons name="cart-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '850' }}>Tự động tiếp tế vào giỏ hàng</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tableWebContainer}>
                <View style={styles.tableWebHeader}>
                  <Text style={[styles.thCell, { flex: 3 }]}>Sản phẩm thực phẩm</Text>
                  <Text style={[styles.thCell, { flex: 2 }]}>Mã SKU</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Tần suất tiêu thụ</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Tồn kho tại kệ chi nhánh</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Dự báo hết hàng</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Đề xuất đặt sỉ bổ sung</Text>
                </View>

                {forecastList.map((item, idx) => {
                  const isUrgent = item.stock < 15;
                  return (
                    <View key={idx} style={styles.tableWebRow}>
                      <Text style={[styles.tdCell, { flex: 3, fontWeight: '900' }]}>{item.name}</Text>
                      <Text style={[styles.tdCell, { flex: 2, fontFamily: 'monospace' }]}>{item.sku}</Text>
                      <Text style={[styles.tdCell, { flex: 2, textAlign: 'center', fontWeight: '700' }]}>{item.salesRate}</Text>
                      <Text style={[styles.tdCell, { flex: 2, textAlign: 'center', fontWeight: '800', color: isUrgent ? '#d32f2f' : '#334155' }]}>
                        {item.stock} {item.unit}
                      </Text>
                      <View style={[styles.tdCell, { flex: 2, alignItems: 'center' }]}>
                        <View style={[styles.alertPill, { backgroundColor: isUrgent ? '#ffebee' : '#f1f5f9' }]}>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: isUrgent ? '#d32f2f' : '#475569' }}>
                            {item.timeLimit}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.tdCell, { flex: 2, textAlign: 'center', fontWeight: '900', color: ORANGE_THEME.primary }]}>
                        +{item.recommendQty} {item.unit}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* ADVANCED BRAND NEW OPERATIONS TAB 2: SHELF EXPIRATION MARKDOWN BARCODES VIEW */}
          {activeTab === 'shelf-life' && (
            <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 28 }}>
              <View style={styles.profileHeadingRow}>
                <Ionicons name="time" size={24} color={ORANGE_THEME.primary} />
                <Text style={styles.profileSectionTitle}>Quản lý Hạn Sử Dụng Hàng Trưng Bày tại Chi Nhánh</Text>
              </View>

              <View style={styles.tableWebContainer}>
                <View style={styles.tableWebHeader}>
                  <Text style={[styles.thCell, { flex: 3 }]}>Sản phẩm tại kệ</Text>
                  <Text style={[styles.thCell, { flex: 2 }]}>Hạn sử dụng ghi nhận</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Số ngày còn lại</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Độ an toàn thực phẩm</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'right' }]}>Giá bán hiện tại</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Markdown Xả Kho 20%</Text>
                </View>

                {shelfFreshness.map((s, idx) => {
                  const isCritical = s.status === 'critical';
                  const isWarning = s.status === 'warning';

                  return (
                    <View key={idx} style={styles.tableWebRow}>
                      <Text style={[styles.tdCell, { flex: 3, fontWeight: '900' }]}>{s.name}</Text>
                      <Text style={[styles.tdCell, { flex: 2, fontFamily: 'monospace' }]}>{s.expiryDate}</Text>
                      <Text style={[styles.tdCell, { flex: 2, textAlign: 'center', fontWeight: '800' }]}>
                        {s.daysLeft} ngày
                      </Text>
                      <View style={[styles.tdCell, { flex: 2, alignItems: 'center' }]}>
                        <View style={[styles.alertPill, { backgroundColor: isCritical ? '#ffebee' : isWarning ? '#fff3e0' : '#e8f5e9' }]}>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: isCritical ? '#d32f2f' : isWarning ? '#e65100' : '#2e7d32' }}>
                            {isCritical ? 'CẬN HẠN KHẨN!' : isWarning ? 'Lưu ý cận hạn' : 'Tươi ngon'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.tdCell, { flex: 2, textAlign: 'right', fontWeight: '850', color: ORANGE_THEME.primary }]}>
                        {s.price.toLocaleString()}đ
                      </Text>
                      <View style={[styles.tdCell, { flex: 2, alignItems: 'center' }]}>
                        {s.expiryDate === 'Đã thanh lý 20%' ? (
                          <Text style={{ fontSize: 12, color: ORANGE_THEME.success, fontWeight: '850' }}>Đang xả hàng</Text>
                        ) : (
                          <TouchableOpacity style={[styles.resolveActionBtn, { backgroundColor: isCritical || isWarning ? '#e65100' : '#94a3b8' }]} onPress={() => handleMarkdownShelf(s.id)}>
                            <Ionicons name="pricetag-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.resolveActionBtnText}>Chiết khấu 20%</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* TAB 4: CURATED FAVORITES CATALOG */}
          {activeTab === 'favorites' && (
            <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 28 }}>
              <View style={styles.profileHeadingRow}>
                <Ionicons name="heart" size={24} color="#e53935" />
                <Text style={styles.profileSectionTitle}>Danh mục sản phẩm chi nhánh thường xuyên đặt hàng sỉ</Text>
              </View>

              {favoritesList.length === 0 ? (
                <View style={styles.loadingWrapper}>
                  <Ionicons name="heart-dislike-outline" size={64} color="#ccc" />
                  <Text style={{ color: ORANGE_THEME.textMuted, marginTop: 12 }}>Chưa lưu sản phẩm thường đặt nào.</Text>
                </View>
              ) : (
                <View style={styles.catalogGrid}>
                  {favoritesList.map(product => {
                    const inCart = cart.find(c => c.product.id === product.id);
                    return (
                      <View key={product.id} style={styles.productCard}>
                        {product.image ? (
                          <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.productImagePlaceholder}>
                            <Ionicons name="nutrition" size={32} color={ORANGE_THEME.primary} />
                          </View>
                        )}

                        <View style={styles.productCardInfo}>
                          <Text style={styles.productCategoryLabel}>{product.category}</Text>
                          <Text style={styles.productNameLabel} numberOfLines={2}>{product.name}</Text>
                          <Text style={styles.productSkuLabel}>SKU: {product.sku}</Text>
                          
                          <View style={styles.productPriceActionRow}>
                            <Text style={styles.productPriceVal}>{product.price.toLocaleString()}đ</Text>

                            {inCart ? (
                              <View style={styles.cardQtyController}>
                                <TouchableOpacity style={styles.qtyBtnSmall} onPress={() => removeFromCart(product.id)}>
                                  <Text style={styles.qtyBtnTextSmall}>−</Text>
                                </TouchableOpacity>
                                <Text style={styles.qtyValSmall}>{inCart.qty}</Text>
                                <TouchableOpacity style={styles.qtyBtnSmall} onPress={() => addToCart(product)}>
                                  <Text style={styles.qtyBtnTextSmall}>+</Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity style={styles.addBtnSmall} onPress={() => addToCart(product)}>
                                <Ionicons name="add" size={14} color="#fff" />
                                <Text style={styles.addBtnTextSmall}>Thêm</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )}

          {/* TAB 5: SPECIAL PROMOTIONS */}
          {activeTab === 'promotions' && (
            <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 32, gap: 24 }}>
              <View style={styles.profileHeadingRow}>
                <Ionicons name="flame" size={24} color={ORANGE_THEME.primary} />
                <Text style={styles.profileHeadingTitle}>Chiến dịch Ưu Đãi & Khuyến Mãi Hàng Sỉ Đang Áp Dụng</Text>
              </View>

              {promotionsList.map(promo => {
                const targetProd = productCatalog.find(p => p.sku === promo.targetSku);
                return (
                  <View key={promo.id} style={[styles.promoCardWeb, { backgroundColor: promo.bannerBg }]}>
                    <View style={{ flex: 1, justifyContent: 'space-between' }}>
                      <View>
                        <View style={[styles.alertPill, { backgroundColor: promo.tagColor, alignSelf: 'flex-start', marginBottom: 12 }]}>
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{promo.badge}</Text>
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '950', color: ORANGE_THEME.textDark }}>{promo.title}</Text>
                        <Text style={{ fontSize: 13, color: ORANGE_THEME.textMuted, marginTop: 8, lineHeight: 18 }}>{promo.desc}</Text>
                      </View>

                      {targetProd && (
                        <TouchableOpacity 
                          style={[styles.checkoutActionBtn, { backgroundColor: promo.tagColor, width: 180, marginTop: 20 }]}
                          onPress={() => {
                            addToCart(targetProd);
                            Alert.alert('Khuyến mãi', `Đã áp dụng ưu đãi sỉ cho SKU "${targetProd.name}" thành công!`);
                          }}
                        >
                          <Ionicons name="gift" size={16} color="#fff" style={{ marginRight: 4 }} />
                          <Text style={styles.checkoutActionBtnText}>Nhận Ưu Đãi Ngay</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={{ width: 140, height: 140, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="sparkles" size={54} color={promo.tagColor} />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* TAB 6: RACK INCIDENT LOGGER */}
          {activeTab === 'store-incidents' && (
            <View style={styles.splitLayout}>
              
              <View style={[styles.catalogSide, { flex: 6, backgroundColor: '#fff', borderRightWidth: 1.5, borderRightColor: '#e2e8f0', padding: 24 }]}>
                <View style={styles.profileHeadingRow}>
                  <Ionicons name="warning-outline" size={24} color={ORANGE_THEME.primary} />
                  <Text style={styles.profileSectionTitle}>Nhật ký Báo cáo Sự cố kệ hàng & Vận chuyển</Text>
                </View>

                <ScrollView style={{ flex: 1 }}>
                  <View style={styles.tableWebContainer}>
                    <View style={styles.tableWebHeader}>
                      <Text style={[styles.thCell, { flex: 1.5 }]}>ID sự cố</Text>
                      <Text style={[styles.thCell, { flex: 3.5 }]}>Sản phẩm bị ảnh hưởng</Text>
                      <Text style={[styles.thCell, { flex: 2.5 }]}>Phân loại sự cố</Text>
                      <Text style={[styles.thCell, { flex: 1.5, textAlign: 'center' }]}>Mức độ</Text>
                      <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Trạng thái WMS</Text>
                    </View>

                    {storeIncidents.map(inc => (
                      <View key={inc.id} style={styles.tableWebRow}>
                        <Text style={[styles.tdCell, { flex: 1.5, fontWeight: 'bold' }]}>#RACK-{inc.id}</Text>
                        <Text style={[styles.tdCell, { flex: 3.5, fontWeight: '700' }]}>{inc.product}</Text>
                        <Text style={[styles.tdCell, { flex: 2.5 }]}>{inc.type}</Text>
                        <Text style={[styles.tdCell, { flex: 1.5, textAlign: 'center', fontWeight: 'bold', color: inc.severity === 'Cao' ? '#d32f2f' : '#f57c00' }]}>{inc.severity}</Text>
                        <View style={[styles.tdCell, { flex: 2, alignItems: 'center' }]}>
                          <View style={[styles.alertPill, { backgroundColor: inc.status === 'resolved' ? '#e8f5e9' : '#fff3e0' }]}>
                            <Text style={{ fontSize: 10, fontWeight: '850', color: inc.status === 'resolved' ? '#2e7d32' : '#e65100' }}>
                              {inc.status === 'resolved' ? 'Đã xử lý' : 'Đang chờ xử lý'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={[styles.cartSide, { flex: 4, padding: 24 }]}>
                <View style={styles.profileHeadingRow}>
                  <Ionicons name="create-outline" size={22} color={ORANGE_THEME.primary} />
                  <Text style={styles.profileSectionTitle}>Gửi Báo Cáo Sự Cố Mới</Text>
                </View>

                <View style={{ gap: 14 }}>
                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Tên sản phẩm bị lỗi: *</Text>
                    <TextInput 
                      style={styles.profileFormInputWeb}
                      placeholder="Nhập tên sản phẩm thực phẩm sỉ..."
                      value={incidentForm.product}
                      onChangeText={t => setIncidentForm(f => ({ ...f, product: t }))}
                    />
                  </View>

                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Phân loại sự cố kệ kho sỉ: *</Text>
                    <select 
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '10px',
                        fontSize: '13px',
                        color: ORANGE_THEME.textDark,
                        outline: 'none',
                      }}
                      value={incidentForm.type}
                      onChange={e => setIncidentForm(f => ({ ...f, type: e.target.value }))}
                    >
                      <option value="Thiếu hàng trưng bày">Thiếu hàng trưng bày tại kệ sỉ</option>
                      <option value="Dập nát khi vận chuyển">Dập nát / Hỏng hóc khi vận chuyển</option>
                      <option value="Sai lệch hạn sử dụng">Hàng giao sai lệch hạn sử dụng</option>
                      <option value="Khác">Phân loại khác</option>
                    </select>
                  </View>

                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Mức độ khẩn cấp sự cố: *</Text>
                    <select 
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '10px',
                        fontSize: '13px',
                        color: ORANGE_THEME.textDark,
                        outline: 'none',
                      }}
                      value={incidentForm.severity}
                      onChange={e => setIncidentForm(f => ({ ...f, severity: e.target.value }))}
                    >
                      <option value="Thấp">Thấp (Chờ xử lý thường)</option>
                      <option value="Trung bình">Trung bình (Xử lý trong ngày)</option>
                      <option value="Cao">Cao (Khẩn cấp xử lý ngay)</option>
                    </select>
                  </View>

                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Chi tiết ghi chú:</Text>
                    <TextInput 
                      style={styles.profileFormInputWeb}
                      placeholder="Mô tả cụ thể sự cố (vị trí kệ, số lượng hỏng...)"
                      value={incidentForm.details}
                      onChangeText={t => setIncidentForm(f => ({ ...f, details: t }))}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.checkoutActionBtn, submittingIncident && { opacity: 0.7 }]}
                    onPress={handleCreateIncident}
                    disabled={submittingIncident}
                  >
                    {submittingIncident ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="paper-plane" size={16} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.checkoutActionBtnText}>Gửi Báo Cáo Lên Tổng Kho WMS</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          )}

          {/* TAB 7: SUPPLIER HELPDESK SUPPORT TICKETS */}
          {activeTab === 'support' && (
            <View style={styles.splitLayout}>
              
              <View style={[styles.catalogSide, { flex: 6, backgroundColor: '#fff', borderRightWidth: 1.5, borderRightColor: '#e2e8f0', padding: 24 }]}>
                <View style={styles.profileHeadingRow}>
                  <Ionicons name="chatbubbles-outline" size={24} color={ORANGE_THEME.primary} />
                  <Text style={styles.profileSectionTitle}>Danh sách Ticket hỗ trợ Tổng đài đối tác</Text>
                </View>

                <ScrollView style={{ flex: 1 }}>
                  <View style={styles.tableWebContainer}>
                    <View style={styles.tableWebHeader}>
                      <Text style={[styles.thCell, { flex: 1.5 }]}>Mã Ticket</Text>
                      <Text style={[styles.thCell, { flex: 4 }]}>Tiêu đề chủ đề thảo luận</Text>
                      <Text style={[styles.thCell, { flex: 2 }]}>Loại thắc mắc</Text>
                      <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Gửi ngày</Text>
                      <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Trạng thái ticket</Text>
                    </View>

                    {supportTickets.map(tk => (
                      <View key={tk.id} style={styles.tableWebRow}>
                        <Text style={[styles.tdCell, { flex: 1.5, fontWeight: 'bold' }]}>#TKT-{tk.id}</Text>
                        <Text style={[styles.tdCell, { flex: 4, fontWeight: '700' }]}>{tk.topic}</Text>
                        <Text style={[styles.tdCell, { flex: 2 }]}>{tk.type}</Text>
                        <Text style={[styles.tdCell, { flex: 2, textAlign: 'center', color: ORANGE_THEME.textMuted }]}>{tk.date}</Text>
                        <View style={[styles.tdCell, { flex: 2, alignItems: 'center' }]}>
                          <View style={[styles.alertPill, { backgroundColor: tk.status === 'resolved' ? '#e8f5e9' : '#e0f2fe' }]}>
                            <Text style={{ fontSize: 10, fontWeight: '850', color: tk.status === 'resolved' ? '#2e7d32' : '#0284c7' }}>
                              {tk.status === 'resolved' ? 'Đã giải đáp' : 'Đang xử lý'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={[styles.cartSide, { flex: 4, padding: 24 }]}>
                <View style={styles.profileHeadingRow}>
                  <Ionicons name="add-circle-outline" size={22} color={ORANGE_THEME.primary} />
                  <Text style={styles.profileSectionTitle}>Tạo Ticket Yêu Cầu Hỗ Trợ</Text>
                </View>

                <View style={{ gap: 14 }}>
                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Tiêu đề thắc mắc: *</Text>
                    <TextInput 
                      style={styles.profileFormInputWeb}
                      placeholder="Nhập chủ đề cần giải quyết sỉ..."
                      value={supportForm.topic}
                      onChangeText={t => setSupportForm(f => ({ ...f, topic: t }))}
                    />
                  </View>

                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Phân loại yêu cầu hỗ trợ: *</Text>
                    <select 
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '10px',
                        fontSize: '13px',
                        color: ORANGE_THEME.textDark,
                        outline: 'none',
                      }}
                      value={supportForm.type}
                      onChange={e => setSupportForm(f => ({ ...f, type: e.target.value }))}
                    >
                      <option value="Giao nhận">Vấn đề Giao nhận / Vận chuyển sỉ</option>
                      <option value="Thanh toán">Đối chiếu công nợ / Thanh toán sỉ</option>
                      <option value="Hệ thống">Lỗi ứng dụng / Tài khoản đăng nhập</option>
                      <option value="Khác">Vấn đề hỗ trợ khác</option>
                    </select>
                  </View>

                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Nội dung thảo luận: *</Text>
                    <TextInput 
                      style={styles.profileFormInputWeb}
                      placeholder="Mô tả cụ thể thắc mắc gửi cho Tổng đài..."
                      value={supportForm.message}
                      onChangeText={t => setSupportForm(f => ({ ...f, message: t }))}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.checkoutActionBtn, submittingTicket && { opacity: 0.7 }]}
                    onPress={handleCreateTicket}
                    disabled={submittingTicket}
                  >
                    {submittingTicket ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="chatbubbles" size={16} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.checkoutActionBtnText}>Khởi Tạo Ticket Liên Hệ</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          )}

          {/* TAB 8: STORE SETTINGS PROFILE */}
          {activeTab === 'profile' && (
            <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 32 }}>
              {loadingProfile ? (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="large" color={ORANGE_THEME.primary} />
                </View>
              ) : (
                <View style={styles.profileLayoutWeb}>
                  
                  {/* Left panel: Info detail */}
                  <View style={styles.profileInfoCard}>
                    <View style={styles.profileHeadingRow}>
                      <Ionicons name="business" size={24} color={ORANGE_THEME.primary} />
                      <Text style={styles.profileHeadingTitle}>Thông tin đại diện Cửa hàng chi nhánh Kingfood</Text>
                    </View>

                    <View style={styles.profileAvatarBox}>
                      <View style={styles.profileAvatarIconCircle}>
                        <Ionicons name="storefront" size={32} color="#fff" />
                      </View>
                      <Text style={styles.avatarStoreName}>{profileUser?.name || 'Đại diện Cửa hàng'}</Text>
                      <Text style={styles.avatarBranchTag}>Chi nhánh: {profileUser?.branch?.name || 'Kingfood Market'}</Text>
                    </View>

                    <View style={{ gap: 16 }}>
                      <View style={styles.profileFormGroup}>
                        <Text style={styles.profileInputLabelWeb}>Họ tên người quản lý: *</Text>
                        {editingProfile ? (
                          <TextInput 
                            style={styles.profileFormInputWeb}
                            value={profileForm.name}
                            onChangeText={t => setProfileForm(f => ({ ...f, name: t }))}
                          />
                        ) : (
                          <Text style={styles.profileTextValWeb}>{profileUser?.name || '—'}</Text>
                        )}
                      </View>

                      <View style={styles.profileFormGroup}>
                        <Text style={styles.profileInputLabelWeb}>Mật danh / Email đăng nhập sỉ:</Text>
                        <Text style={[styles.profileTextValWeb, { fontFamily: 'monospace', color: ORANGE_THEME.textMuted }]}>{profileUser?.email || '—'}</Text>
                      </View>

                      <View style={styles.profileFormGroup}>
                        <Text style={styles.profileInputLabelWeb}>Số điện thoại liên lạc chi nhánh:</Text>
                        {editingProfile ? (
                          <TextInput 
                            style={styles.profileFormInputWeb}
                            value={profileForm.phoneNumber}
                            onChangeText={t => setProfileForm(f => ({ ...f, phoneNumber: t }))}
                          />
                        ) : (
                          <Text style={styles.profileTextValWeb}>{profileUser?.phoneNumber || '—'}</Text>
                        )}
                      </View>

                      <View style={styles.profileFormGroup}>
                        <Text style={styles.profileInputLabelWeb}>Địa chỉ phân phối mặc định:</Text>
                        <Text style={styles.profileTextValWeb}>{profileUser?.branch?.address || '—'}</Text>
                      </View>

                      {/* Edit actions row */}
                      <View style={styles.profileActionsRow}>
                        {editingProfile ? (
                          <>
                            <TouchableOpacity style={[styles.profileBtnWeb, styles.btnCancelWeb]} onPress={() => setEditingProfile(false)}>
                              <Text style={styles.btnCancelText}>Hủy bỏ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.profileBtnWeb, styles.btnSaveWeb]} onPress={handleSaveProfile}>
                              <Text style={styles.btnSaveText}>Lưu cấu hình</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <TouchableOpacity style={[styles.profileBtnWeb, styles.btnEditWeb]} onPress={() => setEditingProfile(true)}>
                            <Ionicons name="create-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.btnEditText}>Thay đổi thông tin</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                  </View>

                  {/* Right panel: Password change */}
                  <View style={styles.profilePasswordCard}>
                    <View style={styles.profileHeadingRow}>
                      <Ionicons name="lock-closed-outline" size={24} color={ORANGE_THEME.primary} />
                      <Text style={styles.profileHeadingTitle}>Thay đổi mật khẩu tài khoản sỉ</Text>
                    </View>

                    <Text style={styles.pwdHintCard}><Ionicons name="information-circle" /> {PASSWORD_HINT}</Text>

                    <View style={styles.profileFormGroup}>
                      <Text style={styles.profileInputLabel}>Mật khẩu hiện tại:</Text>
                      <TextInput 
                        style={styles.profileFormInputWeb}
                        secureTextEntry={true}
                        placeholder="Mật khẩu cũ"
                        value={oldPassword}
                        onChangeText={setOldPassword}
                      />
                    </View>

                    <View style={styles.profileFormGroup}>
                      <Text style={styles.profileInputLabel}>Mật khẩu mới:</Text>
                      <TextInput 
                        style={styles.profileFormInputWeb}
                        secureTextEntry={true}
                        placeholder="Mật khẩu mới"
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                    </View>

                    <View style={styles.profileFormGroup}>
                      <Text style={styles.profileInputLabel}>Xác nhận mật khẩu mới:</Text>
                      <TextInput 
                        style={styles.profileFormInputWeb}
                        secureTextEntry={true}
                        placeholder="Nhập lại mật khẩu mới"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                    </View>

                    <TouchableOpacity 
                      style={[styles.btnChangePwdAction, changingPass && { opacity: 0.7 }]}
                      onPress={handleChangePassword}
                      disabled={changingPass}
                    >
                      {changingPass ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="shield-checkmark" size={16} color="#fff" style={{ marginRight: 4 }} />
                          <Text style={styles.btnChangePwdActionText}>Xác nhận Đổi mật khẩu</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                </View>
              )}
            </ScrollView>
          )}

        </View>
      </View>

      {/* 3. DRAFT INVOICE PREVIEW OVERLAY */}
      {showDraftInvoiceModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalPaperContainer}>
            
            {/* Modal Control actions (no-print) */}
            <View style={[styles.modalActionsBar, { className: 'no-print' }]}>
              <Text style={styles.modalTitleText}>Xem trước Hóa đơn Kiểm tra (Draft Invoice)</Text>
              
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: '#475569' }]} onPress={handlePrintInvoice}>
                  <Ionicons name="print" size={16} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>In Hóa Đơn</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: '#3b82f6' }]} onPress={handlePrintInvoice}>
                  <Ionicons name="download" size={16} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Tải file PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: ORANGE_THEME.primary }]} onPress={() => {
                  setShowDraftInvoiceModal(false);
                  handleCheckout();
                }}>
                  <Ionicons name="bag-check" size={16} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Duyệt & Đặt luôn</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: '#94a3b8' }]} onPress={() => setShowDraftInvoiceModal(false)}>
                  <Ionicons name="close" size={16} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Premium Tax Invoice Paper */}
            <ScrollView style={styles.invoicePaperScroll} id="print-area">
              <View style={styles.invoicePaper}>
                
                {/* Header brand and Metadata */}
                <View style={styles.paperHeader}>
                  <View style={{ flex: 1.5 }}>
                    <Text style={styles.paperBrandName}>CÔNG TY CỔ PHẦN KINGFOOD MARKET</Text>
                    <Text style={styles.paperBrandAddress}>Địa chỉ: 12 Hùng Vương, Phường 4, Quận 5, TP. Hồ Chí Minh</Text>
                    <Text style={styles.paperBrandContact}>Tổng đài sỉ: 1900 6363 · Email: wholesale@kingfoodmarket.com</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <View style={styles.draftStamp}>
                      <Text style={styles.draftStampText}>HÓA ĐƠN NHÁP KIỂM TRA</Text>
                    </View>
                    <Text style={styles.paperMetaLabel}>Số hóa đơn: <Text style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{draftInvoiceNumber}</Text></Text>
                    <Text style={styles.paperMetaLabel}>Ngày lập: <Text style={{ fontWeight: 'bold' }}>{draftInvoiceDate}</Text></Text>
                  </View>
                </View>

                <View style={styles.paperDividerDouble} />

                {/* Title */}
                <Text style={styles.paperTitle}>HÓA ĐƠN BÁN SỈ & KÊ KHAI BÀN GIAO HÀNG HÓA</Text>
                <Text style={styles.paperSubtitle}>(DRAFT WHOLESALE COMMERCIAL & QC CHECKLIST INVOICE)</Text>

                {/* Delivery and Customer Details */}
                <View style={styles.paperDetailsGrid}>
                  <View style={styles.detailsBlock}>
                    <Text style={styles.detailsBlockTitle}>ĐƠN VỊ CUNG CẤP (SELLER):</Text>
                    <Text style={styles.detailsText}><Text style={{ fontWeight: 'bold' }}>TỔNG KHO VẬN HÀNH LOGISTICS WMS KINGFOOD</Text></Text>
                    <Text style={styles.detailsText}>Người lập đơn: Quản trị hệ thống WMS</Text>
                    <Text style={styles.detailsText}>Kho xuất hàng: Zone Alpha - Kho sỉ Tân Bình</Text>
                  </View>

                  <View style={styles.detailsBlock}>
                    <Text style={styles.detailsBlockTitle}>ĐƠN VỊ MUA HÀNG (BUYER):</Text>
                    <Text style={styles.detailsText}><Text style={{ fontWeight: 'bold' }}>CHI NHÁNH SIÊU THỊ KINGFOOD MARKET</Text></Text>
                    <Text style={styles.detailsText}>Người nhận đại diện: Quản lý {userName}</Text>
                    <Text style={styles.detailsText}>Ghi chú giao nhận: {deliveryAddress || 'Giao nhận tiêu chuẩn WMS chặng cuối'}</Text>
                  </View>
                </View>

                {/* Item List Table */}
                <View style={styles.paperTableContainer}>
                  <View style={styles.paperTableHeader}>
                    <Text style={[styles.pTh, { flex: 0.5, textAlign: 'center' }]}>STT</Text>
                    <Text style={[styles.pTh, { flex: 3 }]}>Tên sản phẩm sỉ</Text>
                    <Text style={[styles.pTh, { flex: 1 }]}>SKU</Text>
                    <Text style={[styles.pTh, { flex: 1, textAlign: 'center' }]}>Đơn vị</Text>
                    <Text style={[styles.pTh, { flex: 1.2, textAlign: 'right' }]}>Đơn giá</Text>
                    <Text style={[styles.pTh, { flex: 1, textAlign: 'center' }]}>Số lượng</Text>
                    <Text style={[styles.pTh, { flex: 1.5, textAlign: 'right' }]}>Thành tiền</Text>
                  </View>

                  {cart.map((item, idx) => (
                    <View key={item.product.id} style={styles.paperTableRow}>
                      <Text style={[styles.pTd, { flex: 0.5, textAlign: 'center' }]}>{idx + 1}</Text>
                      <Text style={[styles.pTd, { flex: 3, fontWeight: '700' }]}>{item.product.name}</Text>
                      <Text style={[styles.pTd, { flex: 1, fontFamily: 'monospace' }]}>{item.product.sku}</Text>
                      <Text style={[styles.pTd, { flex: 1, textAlign: 'center' }]}>{item.product.unit}</Text>
                      <Text style={[styles.pTd, { flex: 1.2, textAlign: 'right' }]}>{(item.product.price).toLocaleString()}đ</Text>
                      <Text style={[styles.pTd, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>{item.qty}</Text>
                      <Text style={[styles.pTd, { flex: 1.5, textAlign: 'right', fontWeight: 'bold' }]}>{(item.product.price * item.qty).toLocaleString()}đ</Text>
                    </View>
                  ))}
                </View>

                {/* Summary Section */}
                <View style={[styles.paperSummaryBlock, { justifyContent: 'flex-end' }]}>
                  <View style={{ flex: 1 }} />

                  <View style={styles.paperTotalCalculations}>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Cộng tiền hàng (Subtotal):</Text>
                      <Text style={styles.calcVal}>{totalAmount.toLocaleString()}đ</Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Thuế suất giá trị gia tăng (VAT 8%):</Text>
                      <Text style={styles.calcVal}>{(totalAmount * 0.08).toLocaleString()}đ</Text>
                    </View>
                    <View style={styles.calcRowTotal}>
                      <Text style={styles.calcLabelTotal}>TỔNG CỘNG TIỀN THANH TOÁN (TOTAL):</Text>
                      <Text style={styles.calcValTotal}>{(totalAmount * 1.08).toLocaleString()}đ</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.paperDivider} />

                {/* Signatures block */}
                <View style={styles.signaturesContainer}>
                  <View style={[styles.signNode, { flex: 1, alignItems: 'center' }]}>
                    <Text style={styles.signRole}>Người Giao Hàng (Thủ Kho / Tài Xế)</Text>
                    <Text style={styles.signHint}>(Ký, ghi rõ họ tên)</Text>
                    <View style={styles.signGap} />
                    <Text style={styles.signName}>Trưởng ca WMS / Đội xe tải</Text>
                  </View>

                  <View style={[styles.signNode, { flex: 1, alignItems: 'center' }]}>
                    <Text style={styles.signRole}>Người Nhận Hàng (Cửa Hàng)</Text>
                    <Text style={styles.signHint}>(Ký, ghi rõ họ tên)</Text>
                    <View style={styles.signGap} />
                    <Text style={styles.signName}>Quản lý {userName}</Text>
                  </View>
                </View>

              </View>
            </ScrollView>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  
  // Left Sidebar
  sidebar: {
    width: 290,
    backgroundColor: '#fff',
    borderRightWidth: 1.5,
    borderRightColor: '#e2e8f0',
    paddingVertical: 28,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 36,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ORANGE_THEME.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: ORANGE_THEME.border,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: ORANGE_THEME.textDark,
  },
  brandSubtitle: {
    fontSize: 11,
    color: ORANGE_THEME.primary,
    marginTop: 2,
    fontWeight: '700',
  },
  menuGroup: {
    flex: 1,
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: ORANGE_THEME.primary,
    shadowColor: ORANGE_THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ORANGE_THEME.textMuted,
  },
  menuLabelActive: {
    color: '#fff',
  },
  sidebarFooter: {
    borderTopWidth: 1.5,
    borderTopColor: '#f1f5f9',
    paddingTop: 20,
    gap: 16,
  },
  managerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
  },
  managerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ORANGE_THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  managerAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  managerName: {
    fontSize: 13,
    fontWeight: '800',
    color: ORANGE_THEME.textDark,
  },
  managerRole: {
    fontSize: 10,
    color: ORANGE_THEME.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: ORANGE_THEME.primary,
    gap: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Main content area
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
  },
  topbar: {
    height: 90,
    backgroundColor: '#fff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  topbarHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: ORANGE_THEME.textDark,
  },
  topbarSub: {
    fontSize: 12,
    color: ORANGE_THEME.textMuted,
    marginTop: 4,
  },
  topbarRight: {
    flexDirection: 'row',
  },
  greenLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#388E3C',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#388E3C',
  },

  workspace: {
    flex: 1,
    overflow: 'hidden',
  },

  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },

  // Split Layout
  splitLayout: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
  },
  catalogSide: {
    flex: 6.5,
    backgroundColor: '#fbfcfd',
    flexDirection: 'column',
  },
  searchBannerCard: {
    backgroundColor: '#fff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
  },
  orangeGradientBanner: {
    padding: 24,
    backgroundColor: ORANGE_THEME.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: ORANGE_THEME.border,
  },
  bannerHeadline: {
    fontSize: 16,
    fontWeight: '950',
    color: ORANGE_THEME.primary,
  },
  bannerSubtext: {
    fontSize: 12,
    color: ORANGE_THEME.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  filterControllerRow: {
    padding: 16,
    flexDirection: 'column',
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  searchInputWeb: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: ORANGE_THEME.textDark,
    outlineWidth: 0,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  categoryChipActive: {
    backgroundColor: ORANGE_THEME.bgLight,
    borderColor: ORANGE_THEME.primary,
  },
  categoryChipText: {
    fontSize: 11,
    color: ORANGE_THEME.textMuted,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: ORANGE_THEME.primary,
    fontWeight: '900',
  },
  catalogItemsScroll: {
    flex: 1,
  },
  catalogGrid: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  emptySearch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  productCard: {
    width: '31.5%',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  favoriteHeartBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f8fafc',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: ORANGE_THEME.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCardInfo: {
    padding: 14,
  },
  productCategoryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: ORANGE_THEME.primary,
    textTransform: 'uppercase',
  },
  productNameLabel: {
    fontSize: 13,
    fontWeight: '850',
    color: ORANGE_THEME.textDark,
    marginTop: 4,
    height: 36,
  },
  productSkuLabel: {
    fontSize: 10,
    color: ORANGE_THEME.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  productPriceActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  productPriceVal: {
    fontSize: 14,
    fontWeight: '900',
    color: ORANGE_THEME.primary,
  },
  unitLabel: {
    fontSize: 10,
    color: ORANGE_THEME.textMuted,
    fontWeight: '600',
  },
  addBtnSmall: {
    backgroundColor: ORANGE_THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 2,
  },
  addBtnTextSmall: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  cardQtyController: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE_THEME.bgLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
  },
  qtyBtnSmall: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnTextSmall: {
    fontSize: 14,
    fontWeight: '900',
    color: ORANGE_THEME.primary,
  },
  qtyValSmall: {
    fontSize: 11,
    fontWeight: '850',
    color: ORANGE_THEME.textDark,
    paddingHorizontal: 6,
  },

  // Cart Side
  cartSide: {
    flex: 3.5,
    backgroundColor: '#fff',
    flexDirection: 'column',
    borderLeftWidth: 1.5,
    borderLeftColor: '#e2e8f0',
  },
  cartSideHeader: {
    padding: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ORANGE_THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cartSideTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: ORANGE_THEME.textDark,
  },
  cartBadgeWeb: {
    backgroundColor: ORANGE_THEME.bgLight,
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    color: ORANGE_THEME.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '800',
  },
  quickSkuPanel: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1.5,
    borderBottomColor: '#cbd5e1',
  },
  quickSkuLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: ORANGE_THEME.textMuted,
    marginBottom: 6,
  },
  quickSkuInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    outlineWidth: 0,
  },
  quickSkuBtn: {
    backgroundColor: ORANGE_THEME.primary,
    borderRadius: 10,
    width: 38,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartEmptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  cartEmptyText: {
    fontSize: 15,
    fontWeight: '850',
    color: ORANGE_THEME.textDark,
  },
  cartEmptySub: {
    fontSize: 12,
    color: ORANGE_THEME.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  cartItemsScrollWeb: {
    flex: 1,
    padding: 16,
  },
  cartRowWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cartRowName: {
    fontSize: 12,
    fontWeight: '800',
    color: ORANGE_THEME.textDark,
  },
  cartRowPrice: {
    fontSize: 11,
    color: ORANGE_THEME.textMuted,
    marginTop: 2,
  },
  cartRowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    marginRight: 10,
  },
  qtyArrow: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyArrowText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#475569',
  },
  qtyArrowVal: {
    fontSize: 11,
    fontWeight: '800',
    color: ORANGE_THEME.textDark,
    paddingHorizontal: 4,
  },
  cartRowSub: {
    fontSize: 12,
    fontWeight: '900',
    color: ORANGE_THEME.primary,
  },
  cartFooterCheckout: {
    padding: 24,
    borderTopWidth: 1.5,
    borderTopColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  checkoutLabelWeb: {
    fontSize: 11,
    fontWeight: '800',
    color: ORANGE_THEME.textMuted,
    marginBottom: 6,
  },
  checkoutInputWeb: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    color: ORANGE_THEME.textDark,
    outlineWidth: 0,
    marginBottom: 16,
  },
  checkoutDivider: {
    height: 1.5,
    backgroundColor: '#cbd5e1',
    marginBottom: 16,
  },
  priceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: ORANGE_THEME.textDark,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '950',
    color: ORANGE_THEME.primary,
  },
  checkoutActionBtn: {
    backgroundColor: ORANGE_THEME.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  checkoutActionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  // History List
  panelTitleRow: {
    padding: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitleHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: ORANGE_THEME.textDark,
  },
  refreshBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyListScroll: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fbfcfd',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  historyCardSelected: {
    borderColor: ORANGE_THEME.primary,
    backgroundColor: ORANGE_THEME.bgLight,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyCardId: {
    fontSize: 13,
    fontWeight: '900',
    color: ORANGE_THEME.textDark,
  },
  statusBadgeWeb: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusBadgeTextWeb: {
    fontSize: 10,
    fontWeight: '800',
  },
  historyCardMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  historyCardMetaText: {
    fontSize: 11,
    color: ORANGE_THEME.textMuted,
  },
  historyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    alignItems: 'center',
  },
  historyCardTotalLabel: {
    fontSize: 11,
    color: ORANGE_THEME.textMuted,
  },
  historyCardTotalVal: {
    fontSize: 13,
    fontWeight: '900',
    color: ORANGE_THEME.primary,
  },

  // Invoice Detailed
  invoiceWrapper: {
    flex: 1,
    padding: 28,
    flexDirection: 'column',
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: ORANGE_THEME.primary,
    marginBottom: 20,
  },
  invoiceHeading: {
    fontSize: 16,
    fontWeight: '950',
    color: ORANGE_THEME.textDark,
  },
  invoiceSubtext: {
    fontSize: 11,
    color: ORANGE_THEME.textMuted,
    marginTop: 4,
  },
  cancelBtnWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelBtnTextWeb: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },

  // STEPPER TIMELINE ACCORDION
  stepperContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginBottom: 16,
  },
  stepperLabel: {
    fontSize: 11,
    fontWeight: '850',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  stepNode: {
    alignItems: 'center',
    zIndex: 2,
  },
  stepDotCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: ORANGE_THEME.primary,
  },
  stepDotLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: ORANGE_THEME.textDark,
    marginTop: 6,
  },
  stepperLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#cbd5e1',
    marginHorizontal: -10,
    zIndex: 1,
  },
  stepperLineActive: {
    backgroundColor: ORANGE_THEME.primary,
  },

  invoiceStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  invoiceStatBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: ORANGE_THEME.textMuted,
    textTransform: 'uppercase',
  },
  statBoxValue: {
    fontSize: 14,
    marginTop: 6,
  },
  invoiceDeliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginBottom: 16,
  },
  invoiceCardLabel: {
    fontSize: 11,
    fontWeight: '850',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  invoiceCardVal: {
    fontSize: 13,
    color: ORANGE_THEME.textDark,
    lineHeight: 18,
  },
  invoiceTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  invoiceTableBody: {
    flex: 1,
    marginTop: 4,
  },
  invoiceTableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tdCell: {
    fontSize: 12,
    color: ORANGE_THEME.textDark,
  },

  // Stats Dashboard
  statsControllerBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginBottom: 24,
  },
  statsPanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  statsControllerHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: ORANGE_THEME.textDark,
  },
  filterFormRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 14,
  },
  filterFormGroup: {
    width: 150,
  },
  filterInputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: ORANGE_THEME.textMuted,
    marginBottom: 6,
  },
  filterInputWeb: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: ORANGE_THEME.textDark,
    outlineWidth: 0,
  },
  submitFilterBtn: {
    backgroundColor: ORANGE_THEME.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
  },
  presetGroupRow: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 16,
    alignSelf: 'center',
  },
  presetBtnWeb: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  presetBtnActiveWeb: {
    backgroundColor: ORANGE_THEME.bgLight,
    borderColor: ORANGE_THEME.primary,
  },
  presetBtnText: {
    fontSize: 11,
    color: ORANGE_THEME.textMuted,
    fontWeight: '700',
  },
  presetBtnTextActive: {
    color: ORANGE_THEME.primary,
    fontWeight: '900',
  },

  statsKpiGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statsKpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  kpiCardIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
    opacity: 0.8,
  },
  kpiCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: ORANGE_THEME.textMuted,
    textTransform: 'uppercase',
  },
  kpiCardValue: {
    fontSize: 26,
    fontWeight: '950',
    color: ORANGE_THEME.textDark,
    marginTop: 10,
  },

  analyticalCardsGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  analyticPanelCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  statsCardHeadingRowWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
  },
  analyticCardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: ORANGE_THEME.textDark,
  },
  statsEmptyStateWeb: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topProductsListWeb: {
    flexDirection: 'column',
    gap: 12,
  },
  topProductItemRowWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fbfcfd',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  topRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankGold: { backgroundColor: '#ffd700' },
  rankSilver: { backgroundColor: '#c0c0c0' },
  rankBronze: { backgroundColor: '#cd7f32' },
  topRankText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
  },
  topProductName: {
    fontSize: 13,
    fontWeight: '800',
    color: ORANGE_THEME.textDark,
  },
  topProductDetails: {
    fontSize: 11,
    color: ORANGE_THEME.textMuted,
    marginTop: 2,
  },
  reportsTableWeb: {
    flexDirection: 'column',
  },
  reportsTableHeaderWeb: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 8,
    marginBottom: 6,
  },
  rthCell: {
    fontSize: 11,
    fontWeight: '800',
    color: ORANGE_THEME.textMuted,
    textTransform: 'uppercase',
  },
  reportsTableRowWeb: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  rtdCell: {
    fontSize: 12,
    color: ORANGE_THEME.textDark,
  },

  promoCardWeb: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },

  profileLayoutWeb: {
    flexDirection: 'row',
    gap: 24,
  },
  profileInfoCard: {
    flex: 1.2,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  profilePasswordCard: {
    flex: 0.8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignSelf: 'flex-start',
  },
  profileAvatarBox: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fbfcfd',
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileAvatarIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ORANGE_THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarStoreName: {
    fontSize: 16,
    fontWeight: '900',
    color: ORANGE_THEME.textDark,
  },
  avatarBranchTag: {
    fontSize: 12,
    color: ORANGE_THEME.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  profileFormGroup: {
    marginBottom: 16,
  },
  profileInputLabelWeb: {
    fontSize: 11,
    fontWeight: '800',
    color: ORANGE_THEME.textMuted,
    marginBottom: 6,
  },
  profileInputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: ORANGE_THEME.textMuted,
    marginBottom: 6,
  },
  profileFormInputWeb: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: ORANGE_THEME.textDark,
    outlineWidth: 0,
  },
  profileTextValWeb: {
    fontSize: 13,
    fontWeight: '700',
    color: ORANGE_THEME.textDark,
    paddingVertical: 4,
  },
  profileActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  profileBtnWeb: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnEditWeb: {
    backgroundColor: ORANGE_THEME.primary,
    flexDirection: 'row',
  },
  btnEditText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  btnCancelWeb: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  btnCancelText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
  btnSaveWeb: {
    backgroundColor: ORANGE_THEME.success,
  },
  btnSaveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  pwdHintCard: {
    fontSize: 11,
    color: '#e65100',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: ORANGE_THEME.primary,
    lineHeight: 16,
    marginBottom: 20,
  },
  btnChangePwdAction: {
    backgroundColor: ORANGE_THEME.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  btnChangePwdActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '855',
  },
  thCell: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableWebContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
  },
  tableWebHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#cbd5e1',
  },
  tableWebRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  resolveActionBtn: {
    backgroundColor: ORANGE_THEME.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resolveActionBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  // Modal styling for Draft Checking Invoice
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: 40,
  },
  modalPaperContainer: {
    width: '80%',
    maxWidth: 900,
    height: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  modalActionsBar: {
    padding: 20,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1.5,
    borderBottomColor: '#cbd5e1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleText: {
    fontSize: 15,
    fontWeight: '900',
    color: ORANGE_THEME.textDark,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  invoicePaperScroll: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  invoicePaper: {
    backgroundColor: '#fff',
    padding: 48,
    margin: 20,
    borderRadius: 8,
    minHeight: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paperBrandName: {
    fontSize: 15,
    fontWeight: '950',
    color: '#0f172a',
  },
  paperBrandAddress: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  paperBrandContact: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  draftStamp: {
    borderWidth: 2,
    borderColor: '#e53935',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 12,
    transform: [{ rotate: '-3deg' }],
  },
  draftStampText: {
    fontSize: 12,
    fontWeight: '950',
    color: '#e53935',
    textTransform: 'uppercase',
  },
  paperMetaLabel: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  paperDividerDouble: {
    height: 4,
    borderTopWidth: 2,
    borderBottomWidth: 1,
    borderColor: '#0f172a',
    marginVertical: 20,
  },
  paperDivider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 24,
  },
  paperTitle: {
    fontSize: 20,
    fontWeight: '950',
    color: '#0f172a',
    textAlign: 'center',
  },
  paperSubtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 28,
  },
  paperDetailsGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 28,
  },
  detailsBlock: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
  },
  detailsBlockTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 6,
  },
  detailsText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginTop: 2,
  },
  paperTableContainer: {
    borderWidth: 1.5,
    borderColor: '#0f172a',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 28,
  },
  paperTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#0f172a',
  },
  pTh: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
  },
  paperTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
  },
  pTd: {
    fontSize: 12,
    color: '#334155',
  },
  paperSummaryBlock: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 28,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
  },
  mockQrCode: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  qrTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
  },
  qrDesc: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 14,
    marginTop: 4,
  },
  paperTotalCalculations: {
    width: 320,
    alignSelf: 'flex-start',
    gap: 8,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcLabel: {
    fontSize: 12,
    color: '#475569',
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  calcRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderColor: '#0f172a',
    paddingTop: 8,
    marginTop: 4,
  },
  calcLabelTotal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
  },
  calcValTotal: {
    fontSize: 15,
    fontWeight: '950',
    color: ORANGE_THEME.primary,
  },
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  signNode: {
    width: '22%',
    alignItems: 'center',
  },
  signRole: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
  },
  signHint: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  signGap: {
    height: 64,
  },
  signName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
});
