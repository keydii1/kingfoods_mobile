import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Alert } from '../../utils/appAlert';
import { 
  getDashboardStatus, 
  getIncidents, 
  resolveIncident, 
  getOrders, 
  updateOrderStatus, 
  getUsers, 
  createUser, 
  deleteUser, 
  getCustomers,
  changeUserPassword,
  getLocations,
  createLocation,
  deleteLocation,
  getContainers,
  createContainer,
  deleteContainer,
  traceContainer,
  getProducts,
  createProduct,
  deleteProduct,
  assignPickingTask,
  logout as apiLogout
} from '../../constants/services/api';
import { getOrderStatusMeta } from '../../constants/orderStatus';
import { validateNewPassword, PASSWORD_HINT } from '../../constants/passwordPolicy';

// Theme Colors
const GREEN_THEME = {
  primary: '#1E5E3A', // Deep green WMS style
  primaryLight: '#E8F5E9',
  sidebarDark: '#0F172A', // Dark Slate sidebar
  accent: '#4CAF50',
  error: '#D32F2F',
  border: '#C8E6C9',
  bgLight: '#F4F7F5',
  textDark: '#1E293B',
  textMuted: '#64748B',
};

export default function ManagerDashboardWebScreen() {
  const { userName, logout } = useAuth();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Core stats states
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Orders states
  const [ordersList, setOrdersList] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ordersFilter, setOrdersFilter] = useState('all');
  const [orderSearchText, setOrderSearchText] = useState('');

  // Incidents states
  const [incidentsList, setIncidentsList] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);

  // Store lists states
  const [storesList, setStoresList] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);

  // Team states
  const [teamList, setTeamList] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  
  // Register worker Form
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [workerForm, setWorkerForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'staff',
    phoneNumber: '',
    assignedLocationId: '',
  });
  const [submittingWorker, setSubmittingWorker] = useState(false);

  // Profile Change Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // A. Locations states
  const [locationsList, setLocationsList] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationForm, setLocationForm] = useState({ name: '', zone: 'A', code: '' });
  const [submittingLocation, setSubmittingLocation] = useState(false);

  // B. Containers states
  const [containersList, setContainersList] = useState([]);
  const [loadingContainers, setLoadingContainers] = useState(false);
  const [containerForm, setContainerForm] = useState({ code: '', description: '', status: 'empty' });
  const [submittingContainer, setSubmittingContainer] = useState(false);
  const [tracedContainerData, setTracedContainerData] = useState(null);
  const [tracingCode, setTracingCode] = useState('');
  const [loadingTrace, setLoadingTrace] = useState(false);

  // C. Products Inventory states
  const [productsList, setProductsList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', sku: '', category: 'Bánh Kẹo', price: '', unit: 'Hộp', image: '' });
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // D. Picking Dispatch states
  const [dispatchForm, setDispatchForm] = useState({ userId: '', orderId: '' });
  const [dispatchingTask, setDispatchingTask] = useState(false);
  const [selectedPickingOrderId, setSelectedPickingOrderId] = useState('');
  const [pickingAssignments, setPickingAssignments] = useState({}); // productId -> { staffId: number, quantity: number }

  // Live Warehouse Stock Levels Mock State
  const [warehouseStocks, setWarehouseStocks] = useState({
    'FRUIT-CAM-SANH': 8, // Low Stock Alert!
    'MILK-TH-TRUE': 12, // Low Stock Alert!
    'BEV-COCA-COLA': 120,
    'SNK-OREO': 230,
    'FRUIT-TAO-DO': 14, // Low Stock Alert!
  });

  // Picker Gamified Efficiency Metrics
  const [pickerEfficiencies] = useState([
    { name: 'Nguyễn Văn Hải', speed: '1.9 phút/đơn', accuracy: '99.9%', tasks: 148, rank: 'gold' },
    { name: 'Trần Thị Hằng', speed: '2.3 phút/đơn', accuracy: '99.5%', tasks: 125, rank: 'silver' },
    { name: 'Phạm Minh Đức', speed: '2.7 phút/đơn', accuracy: '98.8%', tasks: 104, rank: 'bronze' },
    { name: 'Lê Hoàng Sơn', speed: '3.1 phút/đơn', accuracy: '98.5%', tasks: 92, rank: 'standard' }
  ]);

  // Interactive Zone Map Blueprint Occupancy
  const [shelfOccupancies, setShelfOccupancies] = useState([
    { shelf: 'A1', desc: 'Bánh Kẹo khô', rate: 95, color: '#D32F2F', label: 'Quá tải (>90%)' },
    { shelf: 'A2', desc: 'Gia vị sỉ', rate: 82, color: '#1E5E3A', label: 'Bình thường' },
    { shelf: 'B1', desc: 'Bia lon', rate: 45, color: '#1E5E3A', label: 'Bình thường' },
    { shelf: 'B2', desc: 'Nước lọc sỉ', rate: 12, color: '#475569', label: 'Trống rộng' },
    { shelf: 'C1', desc: 'Cam Sành / Trái cây', rate: 88, color: '#1E5E3A', label: 'Bình thường' },
    { shelf: 'D1', desc: 'Sữa tươi các loại', rate: 93, color: '#D32F2F', label: 'Quá tải (>90%)' }
  ]);

  // BRAND NEW WMS DISPATCH ROUTING STATES
  const [selectedTruck, setSelectedTruck] = useState('BKS-51D-290.45 (Xe Tải ISUZU 2.5 Tấn)');
  const [routingResult, setRoutingResult] = useState(null);
  const [runningRouting, setRunningRouting] = useState(false);

  // BRAND NEW supplier wholesale PO replenishment forecast
  const [poForecastList] = useState([
    { name: 'Cam Sành Kingfood', sku: 'FRUIT-CAM-SANH', monthlyUsage: '1,200kg', currentStock: 75, limitDays: '3 ngày', recommendedPO: '1,500kg' },
    { name: 'Sữa tươi TH True Milk Organic', sku: 'MILK-TH-TRUE', monthlyUsage: '1,800 hộp', currentStock: 92, limitDays: '4 ngày', recommendedPO: '2,000 hộp' },
    { name: 'Bánh Quy Oreo Socola', sku: 'SNK-OREO', monthlyUsage: '800 hộp', currentStock: 540, limitDays: '20 ngày', recommendedPO: '500 hộp' }
  ]);
  const [issuingPO, setIssuingPO] = useState({});

  // Fetch logic
  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async (silent = false) => {
    try {
      if (!silent) setLoadingOverview(true);
      const statsRes = await getDashboardStatus();
      setDashboardStats(statsRes);
      
      const incidentsRes = await getIncidents();
      setIncidentsList(Array.isArray(incidentsRes) ? incidentsRes : []);
    } catch (err) {
      console.log('Overview error:', err.message);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoadingOrders(true);
      const res = await getOrders();
      const list = Array.isArray(res) ? res : [];
      setOrdersList(list);

      if (selectedOrder) {
        const updated = list.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      console.log('Orders error:', err.message);
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  const fetchIncidents = async (silent = false) => {
    try {
      if (!silent) setLoadingIncidents(true);
      const res = await getIncidents();
      setIncidentsList(Array.isArray(res) ? res : []);
    } catch (err) {
      console.log('Incidents error:', err.message);
    } finally {
      if (!silent) setLoadingIncidents(false);
    }
  };

  const fetchStores = async (silent = false) => {
    try {
      if (!silent) setLoadingStores(true);
      const res = await getCustomers();
      setStoresList(Array.isArray(res) ? res : []);
    } catch (err) {
      console.log('Stores error:', err.message);
    } finally {
      if (!silent) setLoadingStores(false);
    }
  };

  const fetchTeam = async (silent = false) => {
    try {
      if (!silent) setLoadingTeam(true);
      const res = await getUsers();
      setTeamList(Array.isArray(res) ? res : []);
      fetchLocationsList(true);
    } catch (err) {
      console.log('Team error:', err.message);
    } finally {
      if (!silent) setLoadingTeam(false);
    }
  };

  const fetchLocationsList = async (silent = false) => {
    try {
      if (!silent) setLoadingLocations(true);
      const res = await getLocations();
      setLocationsList(Array.isArray(res) ? res : []);
    } catch (err) {
      console.log('Locations error:', err.message);
    } finally {
      if (!silent) setLoadingLocations(false);
    }
  };

  const fetchContainersList = async (silent = false) => {
    try {
      if (!silent) setLoadingContainers(true);
      const res = await getContainers();
      setContainersList(Array.isArray(res) ? res : []);
    } catch (err) {
      console.log('Containers error:', err.message);
    } finally {
      if (!silent) setLoadingContainers(false);
    }
  };

  const fetchProductsList = async (silent = false) => {
    try {
      if (!silent) setLoadingProducts(true);
      const res = await getProducts();
      const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
      setProductsList(items);
    } catch (err) {
      console.log('Products error:', err.message);
    } finally {
      if (!silent) setLoadingProducts(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      fetchOverviewData();
    } else if (tab === 'orders') {
      fetchOrders();
    } else if (tab === 'incidents') {
      fetchIncidents();
    } else if (tab === 'stores') {
      fetchStores();
    } else if (tab === 'team') {
      fetchTeam();
    } else if (tab === 'locations') {
      fetchLocationsList();
    } else if (tab === 'containers') {
      fetchContainersList();
    } else if (tab === 'products') {
      fetchProductsList();
    } else if (tab === 'picking') {
      fetchOrders();
      fetchTeam();
    }
  };

  const handleResolveIncident = async (id) => {
    try {
      await resolveIncident(id);
      Alert.alert('Thành công', 'Đã ghi nhận khắc phục sự cố và bổ sung hàng hóa thành công!');
      fetchIncidents(true);
      fetchOverviewData(true);
    } catch (err) {
      Alert.alert('Thất bại', err.message || 'Không thể xử lý sự cố');
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      Alert.alert('Cập nhật thành công', `Đơn hàng #${id} đã chuyển sang [${getOrderStatusMeta(status).label}]`);
      fetchOrders(true);
      fetchOverviewData(true);
    } catch (err) {
      Alert.alert('Thất bại', err.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleCreateWorker = async () => {
    if (!workerForm.username.trim() || !workerForm.password.trim() || !workerForm.name.trim() || !workerForm.email.trim() || !workerForm.assignedLocationId) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường và chọn Khu vực kệ kho *');
      return;
    }
    setSubmittingWorker(true);
    try {
      await createUser({
        ...workerForm,
        assignedLocationId: parseInt(workerForm.assignedLocationId) || null,
      });
      Alert.alert('Thành công', `Tài khoản picker "${workerForm.name}" đã được tạo hoạt động!`);
      setWorkerForm({ username: '', password: '', name: '', email: '', role: 'staff', phoneNumber: '', assignedLocationId: '' });
      setShowAddWorker(false);
      fetchTeam();
    } catch (err) {
      Alert.alert('Lỗi khởi tạo', err.message || 'Không thể tạo tài khoản');
    } finally {
      setSubmittingWorker(false);
    }
  };

  const handleDeleteWorker = (worker) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn thu hồi tài khoản picker ${worker.name || worker.fullName || worker.username}?`,
      [
        { text: 'Huỷ bỏ', style: 'cancel' },
        { 
          text: 'Thu hồi', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(worker.id);
              Alert.alert('Thành công', 'Đã xóa tài khoản khỏi hệ thống roster.');
              fetchTeam();
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa tài khoản');
            }
          }
        }
      ]
    );
  };

  // Locations management
  const handleCreateLocation = async () => {
    if (!locationForm.name.trim() || !locationForm.code.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đủ Tên vị trí và Mã vạch kệ hàng');
      return;
    }
    setSubmittingLocation(true);
    try {
      await createLocation(locationForm);
      Alert.alert('Thành công', `Đã cấu hình toạ độ kệ hàng "${locationForm.name}" thành công.`);
      setLocationForm({ name: '', zone: 'A', code: '' });
      fetchLocationsList();
    } catch (err) {
      Alert.alert('Thất bại', err.message || 'Không thể tạo vị trí');
    } finally {
      setSubmittingLocation(false);
    }
  };

  const handleDeleteLocation = (id) => {
    Alert.alert(
      'Thu hồi vị trí kệ',
      'Bạn muốn gỡ bỏ toạ độ kệ hàng sỉ này khỏi hệ thống WMS?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Gỡ bỏ',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLocation(id);
              Alert.alert('Thành công', 'Đã gỡ kệ hàng khỏi live sơ đồ.');
              fetchLocationsList();
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể xoá vị trí');
            }
          }
        }
      ]
    );
  };

  // Containers management
  const handleCreateContainer = async () => {
    if (!containerForm.code.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền Mã Thùng hàng Tote');
      return;
    }
    setSubmittingContainer(true);
    try {
      await createContainer(containerForm);
      Alert.alert('Thành công', `Tote chứa "${containerForm.code}" đã được kích hoạt.`);
      setContainerForm({ code: '', description: '', status: 'empty' });
      fetchContainersList();
    } catch (err) {
      Alert.alert('Thất bại', err.message || 'Không thể tạo container');
    } finally {
      setSubmittingContainer(false);
    }
  };

  const handleDeleteContainer = (id) => {
    Alert.alert(
      'Thu hồi Container',
      'Bạn chắc chắn muốn huỷ bỏ tote này khỏi ca soạn hàng?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Thu hồi',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContainer(id);
              Alert.alert('Thành công', 'Đã thu hồi container.');
              fetchContainersList();
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể xoá container');
            }
          }
        }
      ]
    );
  };

  const handleTraceContainer = async (code) => {
    setTracingCode(code);
    setLoadingTrace(true);
    try {
      const res = await traceContainer(code);
      setTracedContainerData(res || { items: [] });
    } catch (err) {
      Alert.alert('Trace lỗi', err.message || 'Không thể truy vết container');
    } finally {
      setLoadingTrace(false);
    }
  };

  // Products management
  const handleCreateProduct = async () => {
    if (!productForm.name.trim() || !productForm.sku.trim() || !productForm.price) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ Tên, Mã SKU, Đơn giá hàng sỉ');
      return;
    }
    setSubmittingProduct(true);
    try {
      await createProduct({
        ...productForm,
        price: parseFloat(productForm.price),
      });
      Alert.alert('Thành công', `Đã cấu hình mặt hàng sỉ mới "${productForm.name}" thành công.`);
      setProductForm({ name: '', sku: '', category: 'Bánh Kẹo', price: '', unit: 'Hộp', image: '' });
      fetchProductsList();
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo sản phẩm');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = (id) => {
    Alert.alert(
      'Xoá sản phẩm',
      'Bạn muốn loại bỏ sản phẩm này khỏi danh mục phân phối sỉ chi nhánh?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(id);
              Alert.alert('Thành công', 'Đã loại bỏ sản phẩm khỏi danh mục.');
              fetchProductsList();
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể xoá sản phẩm');
            }
          }
        }
      ]
    );
  };

  // Restock logic simulation
  const handleRestockSku = (sku) => {
    setWarehouseStocks(prev => ({
      ...prev,
      [sku]: 200
    }));
    Alert.alert('Khởi động Restock sỉ', `Đã nhập thêm thành công +200 sản phẩm mã SKU [${sku}] vào kho sỉ tổng.`);
  };

  // Optimize weight shelf relocation simulation
  const handleOptimizeShelves = () => {
    setShelfOccupancies(prev => prev.map(s => {
      if (s.shelf === 'A1') return { ...s, rate: 70, color: '#1E5E3A', label: 'Đã tối ưu' };
      if (s.shelf === 'B2') return { ...s, rate: 37, color: '#1E5E3A', label: 'Bình thường' };
      return s;
    }));
    Alert.alert('Tối ưu hóa sức chứa', 'Hệ thống đã đề xuất picker di chuyển 25% trọng lượng bánh kẹo khô sang Kệ B2 trống. Trạng thái phân khu kệ kho đã cân bằng thành công!');
  };

  // PICKING DISPATCH CHORE — DYNAMIC AND INTERACTIVE SPLIT TASK
  const handleAssignInteractiveTask = async () => {
    if (!selectedPickingOrderId) {
      Alert.alert('Lỗi', 'Vui lòng lựa chọn một đơn hàng chi nhánh đang xử lý để phân công nhặt hàng.');
      return;
    }

    const order = ordersList.find(o => o.id === parseInt(selectedPickingOrderId));
    if (!order) {
      Alert.alert('Lỗi', 'Đơn hàng không hợp lệ hoặc không tồn tại.');
      return;
    }

    const tasks = [];
    const details = order.orderDetails || [];

    for (const item of details) {
      const productId = item.productId;
      const assign = pickingAssignments[productId];
      
      const isChecked = assign?.checked !== false; // checked by default
      if (!isChecked) continue;

      const staffId = assign?.staffId;
      if (!staffId) {
        Alert.alert('Lỗi phân công', `Vui lòng chọn Nhân viên Picker chịu trách nhiệm soạn sản phẩm: ${item.product?.name || 'Sản phẩm'}`);
        return;
      }

      const quantity = parseInt(assign?.quantity || item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        Alert.alert('Lỗi phân công', `Số lượng soạn sản phẩm "${item.product?.name}" phải là số nguyên lớn hơn 0.`);
        return;
      }

      if (quantity > item.quantity) {
        Alert.alert('Lỗi phân công', `Số lượng soạn sản phẩm "${item.product?.name}" không thể lớn hơn số lượng khách đã đặt (${item.quantity}).`);
        return;
      }

      tasks.push({
        productId,
        staffId: parseInt(staffId),
        quantity
      });
    }

    if (tasks.length === 0) {
      Alert.alert('Lỗi phân công', 'Vui lòng chọn ít nhất một sản phẩm trong đơn để phân công nhặt hàng.');
      return;
    }

    setDispatchingTask(true);
    try {
      await assignPickingTask({
        orderId: order.id,
        tasks
      });
      Alert.alert('Phân công thành công', `Đã chia tách và tạo thành công ${tasks.length} lệnh nhặt hàng (Picking Tasks) trực tiếp gửi đến thiết bị của các nhân viên được phân công!`);
      setSelectedPickingOrderId('');
      setPickingAssignments({});
      fetchOverviewData(true);
      fetchOrders(true);
    } catch (err) {
      Alert.alert('Lỗi phân công', err.message || 'Không thể tạo phân chia nhiệm vụ nhặt hàng.');
    } finally {
      setDispatchingTask(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đủ mật khẩu cũ, mật khẩu mới');
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
      await changeUserPassword({ oldPassword, newPassword });
      Alert.alert('Thành công', 'Đã đổi mật khẩu quản trị WMS thành công');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err?.message || '';
      const friendly = msg.toLowerCase().includes('old password') ? 'Mật khẩu cũ không đúng!' : msg || 'Lỗi đổi mật khẩu';
      Alert.alert('Lỗi', friendly);
    } finally {
      setChangingPass(false);
    }
  };

  // DYNAMIC REPLENISHMENT & ROUTING INTERACTIVE CHOOSERS
  
  // 1. Dispatch route optimizer
  const handleRunRouteOptimizer = () => {
    setRunningRouting(true);
    setTimeout(() => {
      setRoutingResult({
        truck: selectedTruck,
        totalDistance: '24.5 km',
        eta: '75 phút',
        fuelSavings: '18.4% so với lộ trình thường',
        stops: [
          { name: '1. Tổng Kho WMS Kingfood (Điểm xuất phát)', time: '08:00 AM' },
          { name: '2. Chi nhánh Kingfood Market Quận 7 (185 SKU sỉ)', time: '08:25 AM' },
          { name: '3. Chi nhánh Kingfood Market Quận 4 (90 SKU sỉ)', time: '08:45 AM' },
          { name: '4. Chi nhánh Kingfood Market Quận 1 (110 SKU sỉ)', time: '09:15 AM' }
        ]
      });
      setRunningRouting(false);
      Alert.alert('Tối ưu hóa AI hoàn tất', 'Thuật toán Traveling Salesman đã tổ chức lại lộ trình xếp dỡ xe tải. Đã in phiếu xuất hàng kèm bản đồ lộ trình.');
    }, 1200);
  };

  // 2. Issue Bulk Supplier PO
  const handleIssueSupplierPO = (sku) => {
    setIssuingPO(prev => ({ ...prev, [sku]: true }));
    setTimeout(() => {
      setIssuingPO(prev => ({ ...prev, [sku]: false }));
      Alert.alert('Bản ghi PO Nhà cung cấp', `Đã tự động gửi yêu cầu đặt mua bổ sung +1,000 đơn vị mặt hàng [${sku}] đến Tổng kho Nhà cung cấp. Chứng từ PO đã được lưu trữ.`);
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      // fallback
    } finally {
      logout();
      router.replace('/admin-login');
    }
  };

  const stats = dashboardStats || {};
  const totals = stats.totals || {};
  const totalPickedSku = totals.itemsPicked ?? 0;
  const pendingOrders = totals.pendingOrders ?? 0;
  const activeWorkers = stats.staffPerformance?.length ?? 0;

  const filteredOrders = ordersList.filter(order => {
    const matchesSearch = 
      String(order.id).includes(orderSearchText) ||
      (order.customer?.name || '').toLowerCase().includes(orderSearchText.toLowerCase()) ||
      (order.customer?.branch?.name || '').toLowerCase().includes(orderSearchText.toLowerCase());
    const matchesFilter = ordersFilter === 'all' || order.status === ordersFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.webContainer}>
      
      {/* 1. Dark Slate Command Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <View style={styles.logoBadge}>
            <Ionicons name="cube" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.brandTitle}>WMS Command</Text>
            <Text style={styles.brandSubtitle}>Warehouse Operations</Text>
          </View>
        </View>

        <View style={styles.menuGroup}>
          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'overview' && styles.menuItemActive]} 
            onPress={() => handleTabChange('overview')}
          >
            <Ionicons name="stats-chart" size={18} color={activeTab === 'overview' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'overview' && styles.menuLabelActive]}>Tổng quan Kho</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'orders' && styles.menuItemActive]} 
            onPress={() => handleTabChange('orders')}
          >
            <Ionicons name="document-text" size={18} color={activeTab === 'orders' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'orders' && styles.menuLabelActive]}>Đơn đặt hàng</Text>
          </TouchableOpacity>

          {/* ADVANCED DYNAMIC OPTIMIZATION MODULE 1: DISPATCH ROUTING PLANNER */}
          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'delivery-routing' && styles.menuItemActive]} 
            onPress={() => handleTabChange('delivery-routing')}
          >
            <Ionicons name="navigate" size={18} color={activeTab === 'delivery-routing' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'delivery-routing' && styles.menuLabelActive]}>Tối ưu Giao hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'picking' && styles.menuItemActive]} 
            onPress={() => handleTabChange('picking')}
          >
            <Ionicons name="git-pull-request" size={18} color={activeTab === 'picking' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'picking' && styles.menuLabelActive]}>Điều phối Picking</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'products' && styles.menuItemActive]} 
            onPress={() => handleTabChange('products')}
          >
            <Ionicons name="basket" size={18} color={activeTab === 'products' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'products' && styles.menuLabelActive]}>Danh mục SKU</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'locations' && styles.menuItemActive]} 
            onPress={() => handleTabChange('locations')}
          >
            <Ionicons name="map" size={18} color={activeTab === 'locations' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'locations' && styles.menuLabelActive]}>Vị trí Kệ hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'containers' && styles.menuItemActive]} 
            onPress={() => handleTabChange('containers')}
          >
            <Ionicons name="cube-outline" size={18} color={activeTab === 'containers' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'containers' && styles.menuLabelActive]}>Thùng hàng & Tote</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'inventory-control' && styles.menuItemActive]} 
            onPress={() => handleTabChange('inventory-control')}
          >
            <Ionicons name="alert-circle" size={18} color={activeTab === 'inventory-control' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'inventory-control' && styles.menuLabelActive]}>Kiểm kê & Báo cạn</Text>
          </TouchableOpacity>

          {/* ADVANCED DYNAMIC OPTIMIZATION MODULE 2: SUPPLY FORECAST ADMIN PO */}
          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'demand-forecast-admin' && styles.menuItemActive]} 
            onPress={() => handleTabChange('demand-forecast-admin')}
          >
            <Ionicons name="trending-up" size={18} color={activeTab === 'demand-forecast-admin' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'demand-forecast-admin' && styles.menuLabelActive]}>Dự báo PO sỉ</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'picker-efficiency' && styles.menuItemActive]} 
            onPress={() => handleTabChange('picker-efficiency')}
          >
            <Ionicons name="speedometer" size={18} color={activeTab === 'picker-efficiency' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'picker-efficiency' && styles.menuLabelActive]}>Hiệu suất Picker</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'warehouse-map' && styles.menuItemActive]} 
            onPress={() => handleTabChange('warehouse-map')}
          >
            <Ionicons name="grid" size={18} color={activeTab === 'warehouse-map' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'warehouse-map' && styles.menuLabelActive]}>Bản đồ Kệ live</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'incidents' && styles.menuItemActive]} 
            onPress={() => handleTabChange('incidents')}
          >
            <Ionicons name="warning" size={18} color={activeTab === 'incidents' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'incidents' && styles.menuLabelActive]}>Sự cố kệ hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'stores' && styles.menuItemActive]} 
            onPress={() => handleTabChange('stores')}
          >
            <Ionicons name="business" size={18} color={activeTab === 'stores' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'stores' && styles.menuLabelActive]}>Danh sách Cửa hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'team' && styles.menuItemActive]} 
            onPress={() => handleTabChange('team')}
          >
            <Ionicons name="people" size={18} color={activeTab === 'team' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'team' && styles.menuLabelActive]}>Quản lý Nhân sự</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, activeTab === 'settings' && styles.menuItemActive]} 
            onPress={() => handleTabChange('settings')}
          >
            <Ionicons name="settings" size={18} color={activeTab === 'settings' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.menuLabel, activeTab === 'settings' && styles.menuLabelActive]}>Cấu hình WMS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sidebarFooter}>
          <View style={styles.adminCard}>
            <View style={styles.adminAvatar}>
              <Ionicons name="shield" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminName} numberOfLines={1}>{userName}</Text>
              <Text style={styles.adminRole}>Quản trị hệ thống</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.logoutBtnText}>Đăng xuất WMS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Main content area */}
      <View style={styles.mainContent}>
        
        {/* Header bar */}
        <View style={styles.topbar}>
          <View>
            <Text style={styles.topbarHeading}>
              {activeTab === 'overview' && 'Trung tâm Báo cáo & Điều hành Live Kho'}
              {activeTab === 'orders' && 'Bảng xử lý đơn đặt hàng chi nhánh'}
              {activeTab === 'incidents' && 'Sự cố phát sinh & Báo thiếu SKU kệ hàng'}
              {activeTab === 'stores' && 'Hành lang chi nhánh Kingfood Market'}
              {activeTab === 'team' && 'Quản trị điều phối nhân sự nhặt hàng'}
              {activeTab === 'settings' && 'Thông số hệ thống & Đổi mật khẩu Admin'}
              {activeTab === 'locations' && 'Toạ độ Vị trí Kệ kho & Khu vực lưu trữ'}
              {activeTab === 'containers' && 'Truy vết Containers / Thùng hàng chứa sản phẩm'}
              {activeTab === 'products' && 'Quản trị Danh mục Sản phẩm & Cấu hình giá SKU'}
              {activeTab === 'picking' && 'Bàn điều hành Phân phối & Giao việc nhặt hàng'}
              {activeTab === 'inventory-control' && 'Hệ thống Cảnh báo hết hàng & Tiếp tế kho sỉ'}
              {activeTab === 'picker-efficiency' && 'Roster Hiệu suất hoạt động & Gamification Picker'}
              {activeTab === 'warehouse-map' && 'Sơ đồ Live sức chứa & Slotting kệ kho vật lý'}
              {activeTab === 'delivery-routing' && 'Điều phối & Tối ưu Lộ trình Giao hàng sỉ'}
              {activeTab === 'demand-forecast-admin' && 'Dự báo Cung cầu & Đơn mua hàng PO Nhà cung cấp'}
            </Text>
            <Text style={styles.topbarSub}>
              {activeTab === 'overview' && 'Giám sát chi tiết sơ đồ kho hàng, năng suất nhân viên và tổng đơn hàng.'}
              {activeTab === 'orders' && 'Tiếp nhận đơn hàng, duyệt trạng thái từ chờ duyệt sang đang soạn, xuất kho hoặc hoàn thành.'}
              {activeTab === 'incidents' && 'Xử lý báo cáo thiếu hàng khẩn cấp để đảm bảo tính sẵn có của chuỗi cung ứng.'}
              {activeTab === 'stores' && 'Quản lý thông tin tài khoản đăng nhập, điện thoại và email của các đại diện cửa hàng.'}
              {activeTab === 'team' && 'Đăng ký tài khoản nhân viên picker mới và phân phối khu vực (Zone) hoạt động.'}
              {activeTab === 'settings' && 'Trình kết nối máy chủ API WMS, mã phiên bản hệ thống và mật khẩu bảo mật.'}
              {activeTab === 'locations' && 'Thiết lập danh sách kệ hàng, vị trí lưu kho vật lý theo từng Zone phục vụ picking.'}
              {activeTab === 'containers' && 'Quản lý mã vạch tote, trace sản phẩm nằm trong container theo thời gian thực.'}
              {activeTab === 'products' && 'Thêm, sửa, hoặc loại bỏ các loại hàng hóa thực phẩm tươi ngon trong danh mục.'}
              {activeTab === 'picking' && 'Bổ nhiệm lệnh nhặt hàng từ đơn đặt hàng chi nhánh cho nhân viên Picker phù hợp.'}
              {activeTab === 'inventory-control' && 'Kiểm soát số lượng tồn kho sỉ của các SKU để lên phương án restock kịp thời.'}
              {activeTab === 'picker-efficiency' && 'Đánh giá tốc độ nhặt, độ chính xác (%) và khen thưởng nhân viên xuất sắc.'}
              {activeTab === 'warehouse-map' && 'Bản đồ trực quan hóa công suất các giá đỡ Zone kệ hàng WMS.'}
              {activeTab === 'delivery-routing' && 'Tổ chức đội xe tải sỉ, sắp xếp thứ tự giao hàng tối ưu AI cho các chi nhánh.'}
              {activeTab === 'demand-forecast-admin' && 'Báo cáo cung cầu 30 ngày tới, phát hành PO khẩn để tiếp ứng tổng kho sỉ.'}
            </Text>
          </View>

          <View style={styles.topbarRight}>
            <View style={styles.liveSystemBadge}>
              <View style={styles.liveSystemDot} />
              <Text style={styles.liveSystemText}>Logistics Server Online</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Workspace render */}
        <View style={styles.workspace}>
          
          {/* TAB 1: ADMIN OVERVIEW COCKPIT */}
          {activeTab === 'overview' && (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28 }}>
              {loadingOverview ? (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="large" color={GREEN_THEME.primary} />
                  <Text style={{ marginTop: 12, color: GREEN_THEME.textMuted }}>Đang tải trạng thái hoạt động kho...</Text>
                </View>
              ) : (
                <>
                  {/* KPI cards row */}
                  <View style={styles.kpiGrid}>
                    <View style={[styles.kpiCard, { borderLeftColor: GREEN_THEME.primary }]}>
                      <Ionicons name="checkmark-done-circle" size={24} color={GREEN_THEME.primary} style={styles.kpiIcon} />
                      <Text style={styles.kpiLabel}>SKU đã nhặt</Text>
                      <Text style={styles.kpiValue}>{totalPickedSku.toLocaleString()}</Text>
                    </View>

                    <View style={[styles.kpiCard, { borderLeftColor: '#0284c7' }]}>
                      <Ionicons name="people" size={24} color="#0284c7" style={styles.kpiIcon} />
                      <Text style={styles.kpiLabel}>Nhân sự hoạt động</Text>
                      <Text style={styles.kpiValue}>{activeWorkers}</Text>
                    </View>

                    <View style={[styles.kpiCard, { borderLeftColor: GREEN_THEME.error }]}>
                      <Ionicons name="warning" size={24} color={GREEN_THEME.error} style={styles.kpiIcon} />
                      <Text style={styles.kpiLabel}>Sự cố kệ hàng</Text>
                      <Text style={styles.kpiValue}>{incidentsList.filter(i => i.status !== 'resolved').length}</Text>
                    </View>

                    <View style={[styles.kpiCard, { borderLeftColor: '#7c3aed' }]}>
                      <Ionicons name="documents" size={24} color="#7c3aed" style={styles.kpiIcon} />
                      <Text style={styles.kpiLabel}>Đơn chờ soạn hàng</Text>
                      <Text style={styles.kpiValue}>{pendingOrders}</Text>
                    </View>
                  </View>

                  {/* ADVANCED WAREHOUSE ZONE MAP WIDGET */}
                  <View style={styles.zoneMapCard}>
                    <View style={styles.statsCardHeadingRow}>
                      <Ionicons name="map-outline" size={20} color={GREEN_THEME.primary} style={{ marginRight: 8 }} />
                      <Text style={styles.statsCardTitle}>Sơ đồ vật lý & Tiến trình Picking các khu vực kệ kho (Live Zones)</Text>
                    </View>

                    <View style={styles.zoneGrid}>
                      <View style={styles.zoneBox}>
                        <View style={styles.zoneHeader}>
                          <Text style={styles.zoneName}>Khu A: Bánh Kẹo & Thực Phẩm Khô</Text>
                          <Text style={styles.zoneStatusText}>Bình thường</Text>
                        </View>
                        <View style={styles.zoneMapBody}>
                          <Text style={styles.zoneMetric}>Kệ hoạt động: A1 · A2 · A3 · A4</Text>
                          <View style={styles.zoneProgressBg}>
                            <View style={[styles.zoneProgressFill, { width: '85%', backgroundColor: GREEN_THEME.primary }]} />
                          </View>
                          <Text style={styles.zoneProgressText}>Tiến trình hoàn tất: 85%</Text>
                        </View>
                      </View>

                      <View style={styles.zoneBox}>
                        <View style={styles.zoneHeader}>
                          <Text style={styles.zoneName}>Khu B: Bia, Nước Giải Khát & Đồ Uống</Text>
                          <Text style={styles.zoneStatusText}>Bình thường</Text>
                        </View>
                        <View style={styles.zoneMapBody}>
                          <Text style={styles.zoneMetric}>Kệ hoạt động: B1 · B2 · B3</Text>
                          <View style={styles.zoneProgressBg}>
                            <View style={[styles.zoneProgressFill, { width: '92%', backgroundColor: GREEN_THEME.primary }]} />
                          </View>
                          <Text style={styles.zoneProgressText}>Tiến trình hoàn tất: 92%</Text>
                        </View>
                      </View>

                      <View style={styles.zoneBox}>
                        <View style={styles.zoneHeader}>
                          <Text style={styles.zoneName}>Khu C: Trái cây tươi & Nông sản sỉ</Text>
                          <Text style={styles.zoneStatusText}>Bận rộn</Text>
                        </View>
                        <View style={styles.zoneMapBody}>
                          <Text style={styles.zoneMetric}>Kệ hoạt động: C1 · C2 · C3 · C4</Text>
                          <View style={styles.zoneProgressBg}>
                            <View style={[styles.zoneProgressFill, { width: '64%', backgroundColor: '#ff9800' }]} />
                          </View>
                          <Text style={styles.zoneProgressText}>Tiến trình hoàn tất: 64%</Text>
                        </View>
                      </View>

                      <View style={styles.zoneBox}>
                        <View style={styles.zoneHeader}>
                          <Text style={styles.zoneName}>Khu D: Sữa tươi, Sữa chua & Bơ sữa</Text>
                          <Text style={styles.zoneStatusText}>Bình thường</Text>
                        </View>
                        <View style={styles.zoneMapBody}>
                          <Text style={styles.zoneMetric}>Kệ hoạt động: D1 · D2</Text>
                          <View style={styles.zoneProgressBg}>
                            <View style={[styles.zoneProgressFill, { width: '78%', backgroundColor: GREEN_THEME.primary }]} />
                          </View>
                          <Text style={styles.zoneProgressText}>Tiến trình hoàn tất: 78%</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Dual split list panels */}
                  <View style={styles.statsSplitGrid}>
                    <View style={styles.splitCardLeft}>
                      <View style={styles.statsCardHeadingRow}>
                        <Ionicons name="shield-checkmark" size={18} color={GREEN_THEME.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.statsCardTitle}>Hiệu suất nhặt hàng của nhân viên (Picker Staff)</Text>
                      </View>

                      {(!stats.staffPerformance || stats.staffPerformance.length === 0) ? (
                        <View style={styles.emptyStateBox}>
                          <Text style={{ color: GREEN_THEME.textMuted }}>Chưa ghi nhận dữ liệu picking của picker nào.</Text>
                        </View>
                      ) : (
                        <View style={styles.overviewTable}>
                          <View style={styles.overviewTableHeader}>
                            <Text style={[styles.othCell, { flex: 2.5 }]}>Họ và tên</Text>
                            <Text style={[styles.othCell, { flex: 1.5, textAlign: 'center' }]}>Đơn hoàn tất</Text>
                            <Text style={[styles.othCell, { flex: 1.5, textAlign: 'center' }]}>SKU đã nhặt</Text>
                            <Text style={[styles.othCell, { flex: 1.5, textAlign: 'center' }]}>Khu vực Zone</Text>
                          </View>

                          {stats.staffPerformance.map((item, idx) => (
                            <View key={idx} style={styles.overviewTableRow}>
                              <Text style={[styles.otdCell, { flex: 2.5, fontWeight: '800' }]}>{item.name || item.fullName || item.username}</Text>
                              <Text style={[styles.otdCell, { flex: 1.5, textAlign: 'center', fontWeight: 'bold' }]}>{item.ordersCompleted}</Text>
                              <Text style={[styles.otdCell, { flex: 1.5, textAlign: 'center', fontWeight: 'bold', color: GREEN_THEME.primary }]}>{item.itemsPicked}</Text>
                              <Text style={[styles.otdCell, { flex: 1.5, textAlign: 'center', fontWeight: '800' }]}>Zone {item.assignedZone}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={styles.splitCardRight}>
                      <View style={styles.statsCardHeadingRow}>
                        <Ionicons name="alert-circle" size={18} color={GREEN_THEME.error} style={{ marginRight: 6 }} />
                        <Text style={styles.statsCardTitle}>Sự cố báo thiếu hàng khẩn cấp</Text>
                      </View>

                      {incidentsList.filter(i => i.status !== 'resolved').length === 0 ? (
                        <View style={styles.emptyStateBox}>
                          <Ionicons name="checkmark-circle-outline" size={48} color={GREEN_THEME.primary} style={{ marginBottom: 12 }} />
                          <Text style={{ color: GREEN_THEME.textMuted }}>Kho hoạt động ổn định, không có sự cố.</Text>
                        </View>
                      ) : (
                        <ScrollView style={styles.incidentOverviewList}>
                          {incidentsList.filter(i => i.status !== 'resolved').map((inc, idx) => (
                            <View key={inc.id || idx} style={styles.incidentRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.incidentProdName}>{inc.productName || inc.product_name}</Text>
                                <Text style={styles.incidentSub}>Kệ: Khu {inc.location} · Người báo: {inc.reportedBy}</Text>
                              </View>
                              <TouchableOpacity style={styles.resolveBtnSmall} onPress={() => handleResolveIncident(inc.id || inc._id)}>
                                <Text style={styles.resolveBtnTextSmall}>Xong</Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  </View>

                </>
              )}
            </ScrollView>
          )}

          {/* TAB 2: DISPATCH ORDERS */}
          {activeTab === 'orders' && (
            <View style={styles.splitLayout}>
              
              <View style={[styles.catalogSide, { flex: 5, borderRightWidth: 1.5, borderRightColor: '#e2e8f0' }]}>
                <View style={styles.panelTitleRow}>
                  <Text style={styles.panelTitleHeading}>Hành trình đơn hàng chi nhánh</Text>
                  
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput 
                      style={styles.orderSearchInputWeb}
                      placeholder="Tìm ID đơn..."
                      value={orderSearchText}
                      onChangeText={setOrderSearchText}
                    />
                    <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchOrders()}>
                      <Ionicons name="refresh" size={14} color={GREEN_THEME.primary} style={{ marginRight: 4 }} />
                      <Text style={{ color: GREEN_THEME.primary, fontSize: 13, fontWeight: '700' }}>Tải lại</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Status selector */}
                <View style={styles.statusFiltersRow}>
                  {['all', 'pending', 'processing', 'shipped', 'delivered'].map(filter => (
                    <TouchableOpacity 
                      key={filter} 
                      style={[styles.statusFilterChip, ordersFilter === filter && styles.statusFilterChipActive]}
                      onPress={() => setOrdersFilter(filter)}
                    >
                      <Text style={[styles.statusFilterText, ordersFilter === filter && styles.statusFilterTextActive]}>
                        {filter === 'all' ? 'Tất cả' : getOrderStatusMeta(filter).label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {loadingOrders ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="large" color={GREEN_THEME.primary} />
                  </View>
                ) : (
                  <ScrollView style={{ flex: 1, padding: 16 }}>
                    {filteredOrders.map(order => {
                      const meta = getOrderStatusMeta(order.status);
                      const isSelected = selectedOrder?.id === order.id;
                      const dateText = order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '';

                      return (
                        <TouchableOpacity 
                          key={order.id} 
                          style={[styles.orderCardWeb, isSelected && styles.orderCardWebSelected]}
                          onPress={() => setSelectedOrder(order)}
                        >
                          <View style={styles.orderCardHeaderWeb}>
                            <Text style={styles.orderCardIdWeb}>Đơn đặt hàng #{order.id}</Text>
                            <View style={[styles.alertPill, { backgroundColor: meta.bg }]}>
                              <Text style={{ color: meta.color, fontSize: 10, fontWeight: '800' }}>{meta.label}</Text>
                            </View>
                          </View>

                          <Text style={styles.orderCardBranchText}>{order.customer?.branch?.name || 'Chi nhánh Kingfood'}</Text>

                          <View style={styles.orderCardMetaRow}>
                            <Text style={styles.orderCardMetaText}><Ionicons name="calendar-outline" /> {dateText}</Text>
                            <Text style={styles.orderCardMetaText}><Ionicons name="cube-outline" /> {order.orderDetails?.length || 0} SKU</Text>
                          </View>

                          <View style={styles.orderCardFooterWeb}>
                            <Text style={styles.orderCardMetaText}>Thanh toán sỉ:</Text>
                            <Text style={styles.orderCardTotalVal}>{(parseFloat(order.totalPrice) || 0).toLocaleString()}đ</Text>
                          </View>

                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              <View style={[styles.cartSide, { flex: 5, backgroundColor: '#f8fafc' }]}>
                {selectedOrder ? (
                  <View style={styles.invoiceWrapper}>
                    
                    <View style={styles.invoiceHeaderRow}>
                      <View>
                        <Text style={styles.invoiceHeading}>CHI TIẾT LỆNH SOẠN / PHÂN PHỐI HÀNG HOÁ</Text>
                        <Text style={styles.invoiceSubtext}>Chi nhánh: {selectedOrder.customer?.branch?.name || 'Kingfood Partner'}</Text>
                      </View>
                    </View>

                    {/* Step controls */}
                    <View style={styles.workflowWidgetCard}>
                      <Text style={styles.workflowWidgetLabel}>Tiến độ & Cập nhật Trạng thái Soạn/Xuất kho:</Text>
                      
                      <View style={styles.workflowButtonsGroup}>
                        <TouchableOpacity 
                          style={[styles.workflowActionButton, { borderColor: '#cbd5e1', backgroundColor: selectedOrder.status === 'pending' ? GREEN_THEME.primaryLight : '#fff' }]}
                          onPress={() => handleUpdateOrderStatus(selectedOrder.id, 'pending')}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '850', color: selectedOrder.status === 'pending' ? GREEN_THEME.primary : '#475569' }}>1. Nhận lệnh (Pending)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.workflowActionButton, { borderColor: '#cbd5e1', backgroundColor: selectedOrder.status === 'processing' ? GREEN_THEME.primaryLight : '#fff' }]}
                          onPress={() => handleUpdateOrderStatus(selectedOrder.id, 'processing')}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '850', color: selectedOrder.status === 'processing' ? GREEN_THEME.primary : '#475569' }}>2. Đang nhặt (Processing)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.workflowActionButton, { borderColor: '#cbd5e1', backgroundColor: selectedOrder.status === 'shipped' ? GREEN_THEME.primaryLight : '#fff' }]}
                          onPress={() => handleUpdateOrderStatus(selectedOrder.id, 'shipped')}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '850', color: selectedOrder.status === 'shipped' ? GREEN_THEME.primary : '#475569' }}>3. Xuất kho sỉ (Shipped)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.workflowActionButton, { borderColor: '#cbd5e1', backgroundColor: selectedOrder.status === 'delivered' ? GREEN_THEME.primaryLight : '#fff' }]}
                          onPress={() => handleUpdateOrderStatus(selectedOrder.id, 'delivered')}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '850', color: selectedOrder.status === 'delivered' ? GREEN_THEME.primary : '#475569' }}>4. Hoàn thành (Delivered)</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.invoiceDeliveryCard}>
                      <Text style={styles.invoiceCardLabel}>Địa điểm bàn giao chi nhánh:</Text>
                      <Text style={styles.invoiceCardVal}>{selectedOrder.address || 'Giao tại sảnh chi nhánh mặc định.'}</Text>
                    </View>

                    <View style={{ flex: 1, marginTop: 8 }}>
                      <Text style={styles.invoiceCardLabel}>Chi tiết các SKU soạn hàng:</Text>
                      
                      <View style={styles.invoiceTableHeader}>
                        <Text style={[styles.thCell, { flex: 3.5 }]}>Tên sản phẩm sỉ</Text>
                        <Text style={[styles.thCell, { flex: 1.5 }]}>Mã SKU</Text>
                        <Text style={[styles.thCell, { flex: 1.5, textAlign: 'center' }]}>Số lượng đặt</Text>
                        <Text style={[styles.thCell, { flex: 2, textAlign: 'right' }]}>Thành tiền sỉ</Text>
                      </View>

                      <ScrollView style={styles.invoiceTableBody}>
                        {selectedOrder.orderDetails?.map((item, index) => {
                          const p = parseFloat(item.product?.price || item.price) || 0;
                          return (
                            <View key={item.id || index} style={styles.invoiceTableRow}>
                              <Text style={[styles.tdCell, { flex: 3.5, fontWeight: '700' }]} numberOfLines={1}>
                                {item.product?.name || 'Sản phẩm sỉ'}
                              </Text>
                              <Text style={[styles.tdCell, { flex: 1.5, fontFamily: 'monospace' }]}>
                                {item.product?.sku || '—'}
                              </Text>
                              <Text style={[styles.tdCell, { flex: 1.5, textAlign: 'center', fontWeight: '800', color: GREEN_THEME.primary }]}>
                                {item.quantity}
                              </Text>
                              <Text style={[styles.tdCell, { flex: 2, textAlign: 'right', fontWeight: '900', color: GREEN_THEME.primary }]}>
                                {(p * item.quantity).toLocaleString()}đ
                              </Text>
                            </View>
                          );
                        })}
                      </ScrollView>
                    </View>

                  </View>
                ) : (
                  <View style={styles.invoicePlaceholderContainer}>
                    <Ionicons name="document-text" size={80} color="#c8e6c9" style={{ marginBottom: 16 }} />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: GREEN_THEME.textDark }}>Quản trị Soạn & Xuất kho sỉ</Text>
                    <Text style={{ fontSize: 12, color: GREEN_THEME.textMuted, marginTop: 4, textAlign: 'center' }}>Hãy chọn một đơn hàng chi nhánh trong danh sách bên trái để theo dõi tiến độ nhặt hàng hoặc cập nhật trạng thái xuất kho.</Text>
                  </View>
                )}
              </View>

            </View>
          )}

          {/* ADVANCED BRAND NEW OPERATIONS TAB 1: DISPATCH ROUTING PLANNER VIEW */}
          {activeTab === 'delivery-routing' && (
            <View style={styles.splitLayout}>
              
              <View style={[styles.catalogSide, { flex: 5, padding: 24 }]}>
                <View style={styles.profileHeadingRow}>
                  <Ionicons name="bus" size={24} color={GREEN_THEME.primary} />
                  <Text style={styles.profileSectionTitle}>Cấu hình Xe tải & Tối ưu hóa chặng giao hàng sỉ</Text>
                </View>

                <View style={{ gap: 16, backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1.5, borderColor: '#cbd5e1' }}>
                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Lựa chọn Xe tải Kingfood điều phối: *</Text>
                    <select 
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '10px',
                        fontSize: '13px',
                        color: GREEN_THEME.textDark,
                        outline: 'none',
                        width: '100%'
                      }}
                      value={selectedTruck}
                      onChange={e => setSelectedTruck(e.target.value)}
                    >
                      <option value="BKS-51D-290.45 (Xe Tải ISUZU 2.5 Tấn)">BKS-51D-290.45 (Xe Tải ISUZU 2.5 Tấn) - Đang trống</option>
                      <option value="BKS-51D-999.99 (Xe Tải SUZUKI 750kg)">BKS-51D-999.99 (Xe Tải SUZUKI 750kg) - Đang trống</option>
                    </select>
                  </View>

                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Đơn hàng sỉ cần phân phối giao nhận:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: GREEN_THEME.textDark }}>
                      Có {ordersList.filter(o => o.status === 'shipped').length} đơn đã xuất kho sỉ sảnh soạn hàng chờ giao xe.
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={[styles.submitRegisterBtn, runningRouting && { opacity: 0.7 }]}
                    onPress={handleRunRouteOptimizer}
                    disabled={runningRouting}
                  >
                    {runningRouting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={16} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.submitRegisterBtnText}>Chạy AI Tối Ưu Hóa Lộ Trình</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.cartSide, { flex: 5, backgroundColor: '#f8fafc', padding: 24 }]}>
                {routingResult ? (
                  <View style={{ flex: 1 }}>
                    <View style={styles.profileHeadingRow}>
                      <Ionicons name="map" size={22} color={GREEN_THEME.primary} />
                      <Text style={styles.profileSectionTitle}>Kết quả Lộ Trình Giao Hàng AI tối ưu</Text>
                    </View>

                    <View style={{ gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1.5, borderColor: '#cbd5e1' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.profileInputLabel}>Tổng quãng đường:</Text>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: GREEN_THEME.primary }}>{routingResult.totalDistance}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.profileInputLabel}>Thời gian di chuyển dự kiến:</Text>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: GREEN_THEME.primary }}>{routingResult.eta}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1.5, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
                        <Text style={styles.profileInputLabel}>Nhiên liệu tiết kiệm:</Text>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: '#388E3C' }}>{routingResult.fuelSavings}</Text>
                      </View>

                      <Text style={[styles.invoiceCardLabel, { marginTop: 10 }]}>Thứ tự các trạm giao chặng cuối (AI Optimized):</Text>
                      {routingResult.stops.map((stop, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN_THEME.primary }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '750', color: GREEN_THEME.textDark }}>{stop.name}</Text>
                          </View>
                          <Text style={{ fontSize: 11, color: GREEN_THEME.textMuted, fontWeight: '700' }}>{stop.time}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.invoicePlaceholderContainer}>
                    <Ionicons name="git-branch" size={80} color="#c8e6c9" style={{ marginBottom: 16 }} />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: GREEN_THEME.textDark }}>Lộ Trình AI Chờ Tính Toán</Text>
                    <Text style={{ fontSize: 12, color: GREEN_THEME.textMuted, marginTop: 4, textAlign: 'center' }}>Nhấn nút "Chạy AI Tối Ưu Hóa Lộ Trình" bên trái để hệ thống tính toán thứ tự các trạm giao sỉ chặng cuối tối ưu nhất.</Text>
                  </View>
                )}
              </View>

            </View>
          )}

          {/* ADVANCED BRAND NEW OPERATIONS TAB 2: SUPPLY FORECAST ADMIN PO VIEW */}
          {activeTab === 'demand-forecast-admin' && (
            <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 28 }}>
              <View style={styles.profileHeadingRow}>
                <Ionicons name="trending-up" size={24} color={GREEN_THEME.primary} />
                <Text style={styles.profileSectionTitle}>Dự báo Cung Cầu Hàng Sỉ & Đặt hàng Purchase Order (PO) Nhà cung cấp</Text>
              </View>

              <View style={styles.tableWebContainer}>
                <View style={styles.tableWebHeader}>
                  <Text style={[styles.thCell, { flex: 3 }]}>Sản phẩm tại kho tổng sỉ</Text>
                  <Text style={[styles.thCell, { flex: 2 }]}>Mã SKU</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Sản lượng bán sỉ trung bình tháng</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Tồn kho sỉ hiện tại</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Thời gian cạn kho sỉ dự kiến</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Lượng đề xuất đặt PO sỉ</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Hành động phát hành PO</Text>
                </View>

                {poForecastList.map((item, idx) => {
                  const isLow = item.currentStock < 100;
                  const loadingPO = issuingPO[item.sku];

                  return (
                    <View key={idx} style={styles.tableWebRow}>
                      <Text style={[styles.tdCell, { flex: 3, fontWeight: '900' }]}>{item.name}</Text>
                      <Text style={[styles.tdCell, { flex: 2, fontFamily: 'monospace' }]}>{item.sku}</Text>
                      <Text style={[styles.tdCell, { flex: 2, textAlign: 'center', fontWeight: '700' }]}>{item.monthlyUsage}</Text>
                      <Text style={[styles.tdCell, { flex: 2, textAlign: 'center', fontWeight: '900', color: isLow ? '#d32f2f' : GREEN_THEME.primary }]}>
                        {item.currentStock} đơn vị
                      </Text>
                      <View style={[styles.tdCell, { flex: 2, alignItems: 'center' }]}>
                        <View style={[styles.alertPill, { backgroundColor: isLow ? '#ffebee' : '#f1f5f9' }]}>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: isLow ? '#d32f2f' : '#475569' }}>
                            {item.limitDays}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.tdCell, { flex: 2, textAlign: 'center', fontWeight: '900', color: GREEN_THEME.primary }]}>
                        +{item.recommendedPO}
                      </Text>
                      <View style={[styles.tdCell, { flex: 2, alignItems: 'center' }]}>
                        <TouchableOpacity 
                          style={[styles.resolveActionBtn, { backgroundColor: isLow ? '#e65100' : GREEN_THEME.primary }]}
                          onPress={() => handleIssueSupplierPO(item.sku)}
                          disabled={loadingPO}
                        >
                          {loadingPO ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="document-text-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
                              <Text style={styles.resolveActionBtnText}>Phát hành PO</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* TAB 3: DISPATCH TASK ASSIGNMENTS */}
          {activeTab === 'picking' && (() => {
            const ZONE_MAP = {
              1: '🥦 Thực phẩm tươi',
              2: '🥫 Đồ khô & Gia vị',
              3: '🧴 Hoá mỹ phẩm',
              4: '❄️ Đồ đông lạnh'
            };

            return (
              <View style={styles.splitLayout}>
                
                <View style={[styles.catalogSide, { flex: 7.5, padding: 24, backgroundColor: '#fff', borderRightWidth: 1.5, borderRightColor: '#e2e8f0' }]}>
                  <View style={styles.profileHeadingRow}>
                    <Ionicons name="git-pull-request" size={24} color={GREEN_THEME.primary} />
                    <Text style={styles.profileSectionTitle}>Giao việc nhặt hàng & Chia tách lệnh Picking cho nhân viên</Text>
                  </View>

                  <View style={{ gap: 20, marginTop: 12 }}>
                    <View style={styles.profileFormGroup}>
                      <Text style={styles.profileInputLabel}>1. Lựa chọn Đơn đặt hàng chi nhánh đang xử lý: *</Text>
                      <select 
                        style={{
                          backgroundColor: '#f8fafc',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          fontSize: '14px',
                          color: GREEN_THEME.textDark,
                          outline: 'none',
                          width: '100%',
                          fontWeight: '600'
                        }}
                        value={selectedPickingOrderId}
                        onChange={e => {
                          const val = e.target.value;
                          setSelectedPickingOrderId(val);
                          setPickingAssignments({});
                        }}
                      >
                        <option value="">-- Click để chọn đơn đặt hàng chi nhánh Đang Xử Lý --</option>
                        {ordersList.filter(o => o.status === 'processing').map(order => (
                          <option key={order.id} value={order.id}>
                            Đơn đặt hàng #{order.id} - Chi nhánh: {order.customer?.branch?.name || 'Kingfood Partner'} ({order.orderDetails?.length || 0} SKU) - Trị giá: {(parseFloat(order.totalPrice) || 0).toLocaleString()}đ
                          </option>
                        ))}
                      </select>
                    </View>

                    {selectedPickingOrderId ? (
                      <View style={{ marginTop: 8, flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <Text style={{ fontSize: 15, fontWeight: '850', color: GREEN_THEME.textDark }}>
                            2. Phân tách sản phẩm & Chọn nhân viên chịu trách nhiệm:
                          </Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: GREEN_THEME.primary, backgroundColor: GREEN_THEME.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                            Mã đơn: #{selectedPickingOrderId}
                          </Text>
                        </View>

                        {/* Header columns */}
                        <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, gap: 10 }}>
                          <Text style={{ flex: 0.5, fontWeight: '800', color: '#475569', fontSize: 12, textAlign: 'center' }}>Chọn</Text>
                          <Text style={{ flex: 3.5, fontWeight: '800', color: '#475569', fontSize: 12 }}>Tên sản phẩm / Vị trí kệ</Text>
                          <Text style={{ flex: 1.5, fontWeight: '800', color: '#475569', fontSize: 12, textAlign: 'center' }}>Số đặt</Text>
                          <Text style={{ flex: 2, fontWeight: '800', color: '#475569', fontSize: 12, textAlign: 'center' }}>Số lượng pick</Text>
                          <Text style={{ flex: 3, fontWeight: '800', color: '#475569', fontSize: 12 }}>Nhân viên Picker</Text>
                        </View>

                        {/* Products List scroll area */}
                        <ScrollView style={{ maxHeight: 400, marginTop: 8, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, backgroundColor: '#fafbfb' }}>
                          {(ordersList.find(o => o.id === parseInt(selectedPickingOrderId))?.orderDetails || []).map((item, index) => {
                            const productId = item.productId;
                            const product = item.product;
                            const currentAssign = pickingAssignments[productId] || { checked: true, staffId: '', quantity: String(item.quantity) };
                            const isChecked = currentAssign.checked !== false;

                            // Auto resolve matching zone picker if possible to guide the manager!
                            const productZoneId = product?.category?.location?.id;

                            return (
                              <View 
                                key={item.id || index} 
                                style={{ 
                                  flexDirection: 'row', 
                                  alignItems: 'center', 
                                  paddingVertical: 12, 
                                  paddingHorizontal: 12, 
                                  borderBottomWidth: 1, 
                                  borderBottomColor: '#e2e8f0', 
                                  gap: 10,
                                  backgroundColor: isChecked ? '#fff' : '#f8fafc',
                                  opacity: isChecked ? 1 : 0.6
                                }}
                              >
                                {/* Checkbox */}
                                <View style={{ flex: 0.5, alignItems: 'center', justifyContent: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => {
                                      const val = e.target.checked;
                                      setPickingAssignments(prev => ({
                                        ...prev,
                                        [productId]: { ...prev[productId], checked: val }
                                      }));
                                    }}
                                    style={{
                                      width: '18px',
                                      height: '18px',
                                      cursor: 'pointer',
                                      accentColor: GREEN_THEME.primary
                                    }}
                                  />
                                </View>

                                {/* Product Info */}
                                <View style={{ flex: 3.5 }}>
                                  <Text style={{ fontWeight: '700', fontSize: 13, color: isChecked ? '#1e293b' : '#94a3b8' }}>
                                    {product?.name || 'Sản phẩm sỉ'}
                                  </Text>
                                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                                    SKU: {product?.sku || '—'} | <Text style={{ fontWeight: '700', color: GREEN_THEME.primary }}>{product?.category?.location?.name || 'Khu vực kệ'}</Text>
                                  </Text>
                                </View>

                                {/* Ordered Qty */}
                                <View style={{ flex: 1.5, alignItems: 'center', justifyContent: 'center' }}>
                                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#475569' }}>
                                    {item.quantity}
                                  </Text>
                                </View>

                                {/* Picking Qty Input */}
                                <View style={{ flex: 2, alignItems: 'center', justifyContent: 'center' }}>
                                  <input
                                    type="number"
                                    disabled={!isChecked}
                                    min="1"
                                    max={item.quantity}
                                    value={currentAssign.quantity}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setPickingAssignments(prev => ({
                                        ...prev,
                                        [productId]: { ...prev[productId], quantity: val }
                                      }));
                                    }}
                                    style={{
                                      width: '90%',
                                      backgroundColor: isChecked ? '#fff' : '#f1f5f9',
                                      border: '1.5px solid #cbd5e1',
                                      borderRadius: '8px',
                                      padding: '6px 10px',
                                      fontSize: '13px',
                                      outline: 'none',
                                      textAlign: 'center',
                                      fontWeight: '700',
                                      color: GREEN_THEME.primary
                                    }}
                                  />
                                </View>

                                {/* Picker Selector */}
                                <View style={{ flex: 3 }}>
                                  <select 
                                    disabled={!isChecked}
                                    style={{
                                      backgroundColor: isChecked ? '#fff' : '#f1f5f9',
                                      border: '1.5px solid #cbd5e1',
                                      borderRadius: '8px',
                                      padding: '6px 10px',
                                      fontSize: '13px',
                                      color: GREEN_THEME.textDark,
                                      outline: 'none',
                                      width: '100%',
                                      fontWeight: '600'
                                    }}
                                    value={currentAssign.staffId}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setPickingAssignments(prev => ({
                                        ...prev,
                                        [productId]: { ...prev[productId], staffId: val }
                                      }));
                                    }}
                                  >
                                    <option value="">-- Chọn Picker --</option>
                                    {teamList.filter(u => u.role === 'staff').map(user => {
                                      const userZoneName = ZONE_MAP[user.assignedLocationId] || 'Chưa phân khu';
                                      const isMatchingZone = user.assignedLocationId === productZoneId;
                                      return (
                                        <option key={user.id} value={user.id}>
                                          {user.name || user.fullName || user.username} {isMatchingZone ? '🎯' : ''} ({userZoneName})
                                        </option>
                                      );
                                    })}
                                  </select>
                                </View>
                              </View>
                            );
                          })}
                        </ScrollView>

                        {/* Trigger assign */}
                        <TouchableOpacity 
                          style={[
                            styles.submitRegisterBtn, 
                            { marginTop: 20, backgroundColor: GREEN_THEME.primary },
                            dispatchingTask && { opacity: 0.7 }
                          ]}
                          onPress={handleAssignInteractiveTask}
                          disabled={dispatchingTask}
                        >
                          {dispatchingTask ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="paper-plane" size={16} color="#fff" style={{ marginRight: 6 }} />
                              <Text style={styles.submitRegisterBtnText}>Kích Hoạt Lệnh Picking & Phân Phối Tức Thì</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 16, backgroundColor: '#f8fafc', marginTop: 12 }}>
                        <Ionicons name="git-pull-request" size={56} color="#94a3b8" style={{ marginBottom: 12 }} />
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#64748b', textAlign: 'center' }}>
                          Chưa chọn đơn hàng cần phân phối
                        </Text>
                        <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 4, maxWidth: 360 }}>
                          Vui lòng lựa chọn một đơn đặt hàng của chi nhánh đang trong trạng thái "Đang Xử Lý" ở menu phía trên để hiển thị danh sách SKU và bắt đầu phân chia task cho nhân viên soạn hàng.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Right Panel guidelines and helper */}
                {/* Right Panel guidelines and helper - scrollable */}
                <ScrollView 
                  style={{ flex: 2.5, backgroundColor: '#f8fafc' }} 
                  contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.profileHeadingRow}>
                    <Ionicons name="people-outline" size={22} color={GREEN_THEME.primary} />
                    <Text style={styles.profileSectionTitle}>Nhân sự Kho trực ca</Text>
                  </View>

                  {/* Team members quick reference zone map list */}
                  <View style={{ marginTop: 12, gap: 10 }}>
                    <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>
                      Danh sách Picker đang làm việc hôm nay để tham khảo phân chia theo khu vực zone:
                    </Text>
                    
                    {teamList.filter(u => u.role === 'staff').map(user => {
                      const zoneName = ZONE_MAP[user.assignedLocationId] || 'Chưa phân khu';
                      return (
                        <View key={user.id} style={{ backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View>
                            <Text style={{ fontWeight: '700', fontSize: 13, color: '#334155' }}>
                              {user.name || user.username}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                              Mã NV: KF-NV-0{user.id}
                            </Text>
                          </View>
                          <View style={{ backgroundColor: GREEN_THEME.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                            <Text style={{ fontSize: 10, color: GREEN_THEME.primary, fontWeight: '800' }}>
                              {zoneName}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <View style={{ marginTop: 24 }}>
                    <View style={styles.profileHeadingRow}>
                      <Ionicons name="information-circle-outline" size={22} color={GREEN_THEME.primary} />
                      <Text style={styles.profileSectionTitle}>Quy chế nhặt hàng (WMS)</Text>
                    </View>
                    <Text style={[styles.pwdHintCard, { marginTop: 10 }]}>
                      <Ionicons name="information-circle" /> Hệ thống hỗ trợ đánh dấu biểu tượng 🎯 đối với những nhân viên Picker đã được quản lý gán trực khu phân khu trùng khớp với khu vực chứa hàng của SKU đó để tăng tốc độ soạn hàng tối đa.
                    </Text>
                  </View>
                </ScrollView>

              </View>
            );
          })()}

          {/* TAB 4: PRODUCTS INVENTORY */}
          {activeTab === 'products' && (
            <View style={styles.splitLayout}>
              
              <View style={[styles.catalogSide, { flex: 6.5, backgroundColor: '#fff', borderRightWidth: 1.5, borderRightColor: '#e2e8f0' }]}>
                <View style={styles.panelTitleRow}>
                  <Text style={styles.panelTitleHeading}>Danh mục Sản phẩm & Cấu hình giá SKU sỉ</Text>
                  
                  <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchProductsList()}>
                    <Ionicons name="refresh" size={14} color={GREEN_THEME.primary} style={{ marginRight: 4 }} />
                    <Text style={{ color: GREEN_THEME.primary, fontSize: 13, fontWeight: '700' }}>Tải lại</Text>
                  </TouchableOpacity>
                </View>

                {loadingProducts ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="large" color={GREEN_THEME.primary} />
                  </View>
                ) : productsList.length === 0 ? (
                  <View style={styles.loadingWrapper}>
                    <Ionicons name="basket-outline" size={48} color="#ccc" />
                    <Text style={{ color: GREEN_THEME.textMuted, marginTop: 12 }}>Chưa có sản phẩm nào trong kho sỉ.</Text>
                  </View>
                ) : (
                  <ScrollView style={{ flex: 1, padding: 16 }}>
                    <View style={styles.tableWebContainer}>
                      <View style={styles.tableWebHeader}>
                        <Text style={[styles.thCell, { flex: 2.5 }]}>Tên sản phẩm sỉ</Text>
                        <Text style={[styles.thCell, { flex: 1.5 }]}>Mã SKU</Text>
                        <Text style={[styles.thCell, { flex: 1.2 }]}>Phân loại</Text>
                        <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>Giá trị sỉ</Text>
                        <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>Đơn vị</Text>
                        <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>Thao tác</Text>
                      </View>

                      {productsList.map((product) => {
                        const sPrice = parseFloat(product.price) || 0;
                        const skuVal = product.sku || `SKU-${product.id}`;
                        return (
                          <View key={product.id} style={styles.tableWebRow}>
                            <Text style={[styles.tdCell, { flex: 2.5, fontWeight: '700' }]}>{product.name}</Text>
                            <Text style={[styles.tdCell, { flex: 1.5, fontFamily: 'monospace' }]}>{skuVal}</Text>
                            <Text style={[styles.tdCell, { flex: 1.2 }]}>{product.category?.name || 'Khác'}</Text>
                            <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right', fontWeight: '850', color: GREEN_THEME.primary }]}>
                              {sPrice.toLocaleString()}đ
                            </Text>
                            <Text style={[styles.tdCell, { flex: 1, textAlign: 'center' }]}>{product.unit || 'cái'}</Text>
                            <View style={[styles.tdCell, { flex: 1, alignItems: 'center' }]}>
                              <TouchableOpacity style={styles.deleteWorkerAction} onPress={() => handleDeleteProduct(product.id)}>
                                <Text style={styles.deleteWorkerActionText}>Xoá</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              </View>

              <View style={[styles.cartSide, { flex: 3.5, backgroundColor: '#fff', padding: 24 }]}>
                <View style={styles.profileHeadingRow}>
                  <Ionicons name="add-circle-outline" size={22} color={GREEN_THEME.primary} />
                  <Text style={styles.profileSectionTitle}>Cấu hình Sản Phẩm Hàng Sỉ Mới</Text>
                </View>

                <View style={{ gap: 14 }}>
                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Tên mặt hàng: *</Text>
                    <TextInput 
                      style={styles.profileFormInput}
                      placeholder="Ví dụ: Táo Đỏ Mỹ Kingfood"
                      value={productForm.name}
                      onChangeText={t => setProductForm(f => ({ ...f, name: t }))}
                    />
                  </View>

                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Mã định danh SKU: *</Text>
                    <TextInput 
                      style={styles.profileFormInput}
                      placeholder="Ví dụ: FRUIT-TAO-DO"
                      value={productForm.sku}
                      onChangeText={t => setProductForm(f => ({ ...f, sku: t }))}
                    />
                  </View>

                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Giá trị sỉ phân phối: *</Text>
                    <TextInput 
                      style={styles.profileFormInput}
                      placeholder="Đơn vị tiền VNĐ"
                      value={productForm.price}
                      onChangeText={t => setProductForm(f => ({ ...f, price: t }))}
                    />
                  </View>

                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Đơn vị đóng gói: *</Text>
                    <TextInput 
                      style={styles.profileFormInput}
                      placeholder="Ví dụ: kg, hộp, chai, thùng..."
                      value={productForm.unit}
                      onChangeText={t => setProductForm(f => ({ ...f, unit: t }))}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.submitRegisterBtn, submittingProduct && { opacity: 0.7 }]}
                    onPress={handleCreateProduct}
                    disabled={submittingProduct}
                  >
                    {submittingProduct ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.submitRegisterBtnText}>Khai Báo Sản Phẩm</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          )}

          {/* TAB 5: LOCATIONS LIST */}
          {activeTab === 'locations' && (
            <View style={styles.splitLayout}>
              
              <View style={[styles.catalogSide, { flex: 6.5, backgroundColor: '#fff', borderRightWidth: 1.5, borderRightColor: '#e2e8f0' }]}>
                <View style={styles.panelTitleRow}>
                  <Text style={styles.panelTitleHeading}>Sơ đồ vị trí live lưu trữ (Rack Locations)</Text>
                  
                  <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchLocationsList()}>
                    <Ionicons name="refresh" size={14} color={GREEN_THEME.primary} style={{ marginRight: 4 }} />
                    <Text style={{ color: GREEN_THEME.primary, fontSize: 13, fontWeight: '700' }}>Tải lại</Text>
                  </TouchableOpacity>
                </View>

                {loadingLocations ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="large" color={GREEN_THEME.primary} />
                  </View>
                ) : locationsList.length === 0 ? (
                  <View style={styles.loadingWrapper}>
                    <Ionicons name="map-outline" size={48} color="#ccc" />
                    <Text style={{ color: GREEN_THEME.textMuted, marginTop: 12 }}>Chưa thiết lập toạ độ vị trí kệ hàng.</Text>
                  </View>
                ) : (
                  <ScrollView style={{ flex: 1, padding: 16 }}>
                    <View style={styles.tableWebContainer}>
                      <View style={styles.tableWebHeader}>
                        <Text style={[styles.thCell, { flex: 2 }]}>Mã vị trí kệ</Text>
                        <Text style={[styles.thCell, { flex: 3 }]}>Mã vạch định tuyến kệ</Text>
                        <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Phân khu (Zone)</Text>
                        <Text style={[styles.thCell, { flex: 1.5, textAlign: 'center' }]}>Thao tác</Text>
                      </View>

                      {locationsList.map((loc) => (
                        <View key={loc.id} style={styles.tableWebRow}>
                          <Text style={[styles.tdCell, { flex: 2, fontWeight: '800' }]}>{loc.name}</Text>
                          <Text style={[styles.tdCell, { flex: 3, fontFamily: 'monospace' }]}>{loc.code}</Text>
                          <Text style={[styles.tdCell, { flex: 2, textAlign: 'center', fontWeight: '800', color: GREEN_THEME.primary }]}>
                            Zone {loc.zone}
                          </Text>
                          <View style={[styles.tdCell, { flex: 1.5, alignItems: 'center' }]}>
                            <TouchableOpacity style={styles.deleteWorkerAction} onPress={() => handleDeleteLocation(loc.id)}>
                              <Text style={styles.deleteWorkerActionText}>Xoá</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>

              <View style={[styles.cartSide, { flex: 3.5, backgroundColor: '#fff', padding: 24 }]}>
                <View style={styles.profileHeadingRow}>
                  <Ionicons name="add-circle-outline" size={22} color={GREEN_THEME.primary} />
                  <Text style={styles.profileSectionTitle}>Cấu hình Toạ độ Kệ kho sỉ mới</Text>
                </View>

                <View style={{ gap: 14 }}>
                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Tên vị trí kệ: *</Text>
                    <TextInput 
                      style={styles.profileFormInput}
                      placeholder="Ví dụ: Kệ A1-01"
                      value={locationForm.name}
                      onChangeText={t => setLocationForm(f => ({ ...f, name: t }))}
                    />
                  </View>

                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Mã định tuyến barcode: *</Text>
                    <TextInput 
                      style={styles.profileFormInput}
                      placeholder="Ví dụ: LOC-A1-01"
                      value={locationForm.code}
                      onChangeText={t => setLocationForm(f => ({ ...f, code: t }))}
                    />
                  </View>

                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Phân chia thuộc Zone: *</Text>
                    <select 
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '10px',
                        fontSize: '13px',
                        color: GREEN_THEME.textDark,
                        outline: 'none',
                        width: '100%'
                      }}
                      value={locationForm.zone}
                      onChange={e => setLocationForm(f => ({ ...f, zone: e.target.value }))}
                    >
                      <option value="A">Zone A (Bánh kẹo sỉ)</option>
                      <option value="B">Zone B (Bia sỉ)</option>
                      <option value="C">Zone C (Trái cây sỉ)</option>
                      <option value="D">Zone D (Sữa sỉ)</option>
                    </select>
                  </View>

                  <TouchableOpacity 
                    style={[styles.submitRegisterBtn, submittingLocation && { opacity: 0.7 }]}
                    onPress={handleCreateLocation}
                    disabled={submittingLocation}
                  >
                    {submittingLocation ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.submitRegisterBtnText}>Kích Hoạt Vị Trí</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          )}

          {/* TAB 6: CONTAINERS / TOTES LIST */}
          {activeTab === 'containers' && (
            <View style={styles.splitLayout}>
              
              <View style={[styles.catalogSide, { flex: 6.5, backgroundColor: '#fff', borderRightWidth: 1.5, borderRightColor: '#e2e8f0' }]}>
                <View style={styles.panelTitleRow}>
                  <Text style={styles.panelTitleHeading}>Truy vết live thùng hàng (Tote Containers)</Text>
                  
                  <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchContainersList()}>
                    <Ionicons name="refresh" size={14} color={GREEN_THEME.primary} style={{ marginRight: 4 }} />
                    <Text style={{ color: GREEN_THEME.primary, fontSize: 13, fontWeight: '700' }}>Tải lại</Text>
                  </TouchableOpacity>
                </View>

                {loadingContainers ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="large" color={GREEN_THEME.primary} />
                  </View>
                ) : containersList.length === 0 ? (
                  <View style={styles.loadingWrapper}>
                    <Ionicons name="cube-outline" size={48} color="#ccc" />
                    <Text style={{ color: GREEN_THEME.textMuted, marginTop: 12 }}>Chưa có thùng hàng tote nào được kích hoạt.</Text>
                  </View>
                ) : (
                  <ScrollView style={{ flex: 1, padding: 16 }}>
                    <View style={styles.tableWebContainer}>
                      <View style={styles.tableWebHeader}>
                        <Text style={[styles.thCell, { flex: 2.5 }]}>Mã thùng (Tote Code)</Text>
                        <Text style={[styles.thCell, { flex: 3.5 }]}>Ghi chú mô tả</Text>
                        <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Trạng thái chứa</Text>
                        <Text style={[styles.thCell, { flex: 2.5, textAlign: 'center' }]}>Truy vết audit</Text>
                        <Text style={[styles.thCell, { flex: 1.5, textAlign: 'center' }]}>Gỡ bỏ</Text>
                      </View>

                      {containersList.map((container) => (
                        <View key={container.id} style={styles.tableWebRow}>
                          <Text style={[styles.tdCell, { flex: 2.5, fontWeight: '800' }]}>{container.code}</Text>
                          <Text style={[styles.tdCell, { flex: 3.5 }]}>{container.description || 'Thùng nhặt hàng tiêu chuẩn'}</Text>
                          <View style={[styles.tdCell, { flex: 2, alignItems: 'center' }]}>
                            <View style={[styles.alertPill, { backgroundColor: container.status === 'empty' ? '#f1f5f9' : '#e8f5e9' }]}>
                              <Text style={{ fontSize: 10, fontWeight: '850', color: container.status === 'empty' ? '#475569' : GREEN_THEME.primary }}>
                                {container.status === 'empty' ? 'Trống' : 'Có hàng'}
                              </Text>
                            </View>
                          </View>
                          <View style={[styles.tdCell, { flex: 2.5, alignItems: 'center' }]}>
                            <TouchableOpacity style={[styles.resolveActionBtn, { backgroundColor: '#0284c7' }]} onPress={() => handleTraceContainer(container.code)}>
                              <Text style={styles.resolveActionBtnText}>Trace Audit</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={[styles.tdCell, { flex: 1.5, alignItems: 'center' }]}>
                            <TouchableOpacity style={styles.deleteWorkerAction} onPress={() => handleDeleteContainer(container.id)}>
                              <Ionicons name="trash" size={14} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* LIVE TRACER DATA OUTPUT CONTAINER */}
                    {tracedContainerData && (
                      <View style={[styles.statsControllerBox, { marginTop: 24, borderColor: '#0284c7' }]}>
                        <View style={styles.statsPanelTitleRow}>
                          <Ionicons name="search" size={18} color="#0284c7" />
                          <Text style={[styles.statsControllerHeading, { color: '#0284c7' }]}>Kết quả kiểm kho Container Live Tracer: [{tracingCode}]</Text>
                        </View>
                        
                        {loadingTrace ? (
                          <ActivityIndicator size="small" color="#0284c7" />
                        ) : (
                          <View style={{ padding: 12 }}>
                            <Text style={styles.invoiceCardLabel}>Sản phẩm hiện đang có trong thùng hàng này:</Text>
                            {(!tracedContainerData.items || tracedContainerData.items.length === 0) ? (
                              <Text style={{ fontSize: 13, color: GREEN_THEME.textMuted, marginTop: 4 }}>Thùng hàng hiện đang trống rỗng, không chứa sản phẩm nào.</Text>
                            ) : (
                              tracedContainerData.items.map((item, idx) => (
                                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                                  <Text style={{ fontSize: 13, fontWeight: '700', color: GREEN_THEME.textDark }}>{item.productName || 'Hàng hoá WMS'}</Text>
                                  <Text style={{ fontSize: 13, fontWeight: '800', color: GREEN_THEME.primary }}>Số lượng: {item.quantity} {item.unit}</Text>
                                </View>
                              ))
                            )}
                          </View>
                        )}
                      </View>
                    )}

                  </ScrollView>
                )}
              </View>

              <View style={[styles.cartSide, { flex: 3.5, backgroundColor: '#fff', padding: 24 }]}>
                <View style={styles.profileHeadingRow}>
                  <Ionicons name="add-circle-outline" size={22} color={GREEN_THEME.primary} />
                  <Text style={styles.profileSectionTitle}>Tạo Container / Tote Mới</Text>
                </View>

                <View style={styles.profileFormGroup}>
                  <Text style={styles.profileInputLabel}>Mã thùng (Container Code): *</Text>
                  <TextInput 
                    style={styles.profileFormInput}
                    placeholder="Ví dụ: TOTE-001"
                    value={containerForm.code}
                    onChangeText={t => setContainerForm(f => ({ ...f, code: t }))}
                  />
                </View>

                <View style={styles.profileFormGroup}>
                  <Text style={styles.profileInputLabel}>Mô tả thùng:</Text>
                  <TextInput 
                    style={styles.profileFormInput}
                    placeholder="Ví dụ: Thùng nhựa xanh đựng hàng tươi sống"
                    value={containerForm.description}
                    onChangeText={t => setContainerForm(f => ({ ...f, description: t }))}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.submitRegisterBtn, submittingContainer && { opacity: 0.7 }]}
                  onPress={handleCreateContainer}
                  disabled={submittingContainer}
                >
                  {submittingContainer ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={styles.submitRegisterBtnText}>Tạo container</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

            </View>
          )}

          {/* TAB 7: STOCK CHECK & RESTOCK */}
          {activeTab === 'inventory-control' && (
            <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 28 }}>
              <View style={styles.profileHeadingRow}>
                <Ionicons name="alert-circle" size={24} color={GREEN_THEME.primary} />
                <Text style={styles.profileSectionTitle}>Bàn kiểm soát tồn kho sỉ & Báo cạn SKU</Text>
              </View>

              <View style={styles.tableWebContainer}>
                <View style={styles.tableWebHeader}>
                  <Text style={[styles.thCell, { flex: 3 }]}>Tên sản phẩm sỉ</Text>
                  <Text style={[styles.thCell, { flex: 2 }]}>Mã định danh SKU</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Tồn kho thực tế sỉ</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Ngưỡng báo động</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Trạng thái</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Tiếp tế khẩn cấp</Text>
                </View>

                {productsList.map(p => {
                  const skuCode = p.sku || `SKU-${p.id}`;
                  const currentStock = warehouseStocks[skuCode] ?? 75; 
                  const isLow = currentStock < 15;

                  return (
                    <View key={p.id} style={styles.tableWebRow}>
                      <Text style={[styles.tdCell, { flex: 3, fontWeight: '800' }]}>{p.name}</Text>
                      <Text style={[styles.tdCell, { flex: 2, fontFamily: 'monospace' }]}>{skuCode}</Text>
                      <Text style={[styles.tdCell, { flex: 2, textAlign: 'center', fontWeight: '900', color: isLow ? '#d32f2f' : GREEN_THEME.primary }]}>
                        {currentStock} {p.unit || 'cái'}
                      </Text>
                      <Text style={[styles.tdCell, { flex: 2, textAlign: 'center', color: GREEN_THEME.textMuted }]}>&lt; 15 đơn vị</Text>
                      <View style={[styles.tdCell, { flex: 2, alignItems: 'center' }]}>
                        <View style={[styles.alertPill, { backgroundColor: isLow ? '#ffebee' : '#e8f5e9' }]}>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: isLow ? '#d32f2f' : GREEN_THEME.primary }}>
                            {isLow ? 'BÁO CẠN KHO!' : 'An toàn'}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.tdCell, { flex: 2, alignItems: 'center' }]}>
                        <TouchableOpacity style={[styles.resolveActionBtn, { backgroundColor: isLow ? '#e65100' : GREEN_THEME.primary }]} onPress={() => handleRestockSku(skuCode)}>
                          <Ionicons name="refresh-circle-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
                          <Text style={styles.resolveActionBtnText}>Nhập restock</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* TAB 8: PICKER EFFICIENCY */}
          {activeTab === 'picker-efficiency' && (
            <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 28 }}>
              <View style={styles.profileHeadingRow}>
                <Ionicons name="speedometer" size={24} color={GREEN_THEME.primary} />
                <Text style={styles.profileSectionTitle}>Roster Hiệu suất hoạt động & Gamification Leaderboard Picker</Text>
              </View>

              <View style={styles.tableWebContainer}>
                <View style={styles.tableWebHeader}>
                  <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>Hạng</Text>
                  <Text style={[styles.thCell, { flex: 3 }]}>Nhân viên lấy hàng (Picker)</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Đơn nhặt hoàn tất</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Tốc độ trung bình</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Độ chính xác soạn hàng</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'center' }]}>Đánh giá WMS</Text>
                </View>

                {pickerEfficiencies.map((picker, idx) => (
                  <View key={idx} style={styles.tableWebRow}>
                    <View style={[styles.tdCell, { flex: 1, alignItems: 'center' }]}>
                      <View style={{
                        width: 28, height: 28, borderRadius: 14,
                        backgroundColor: picker.rank === 'gold' ? '#ffd700' : picker.rank === 'silver' ? '#c0c0c0' : picker.rank === 'bronze' ? '#cd7f32' : '#94a3b8',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>{idx + 1}</Text>
                      </View>
                    </View>
                    <Text style={[styles.tdCell, { flex: 3, fontWeight: '900' }]}>{picker.name}</Text>
                    <Text style={[styles.tdCell, { flex: 2, textAlign: 'center', fontWeight: '800' }]}>{picker.tasks} orders</Text>
                    <Text style={[styles.tdCell, { flex: 2, textAlign: 'center', fontWeight: '850', color: GREEN_THEME.primary }]}>{picker.speed}</Text>
                    <Text style={[styles.tdCell, { flex: 2, textAlign: 'center', fontWeight: '900', color: GREEN_THEME.accent }]}>{picker.accuracy}</Text>
                    <View style={[styles.tdCell, { flex: 2, alignItems: 'center' }]}>
                      {picker.rank === 'gold' && <Ionicons name="trophy" size={20} color="#ffd700" />}
                      {picker.rank === 'silver' && <Ionicons name="medal" size={20} color="#c0c0c0" />}
                      {picker.rank === 'bronze' && <Ionicons name="ribbon" size={20} color="#cd7f32" />}
                      {picker.rank === 'standard' && <Ionicons name="checkmark-circle" size={20} color={GREEN_THEME.primary} />}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* TAB 9: PHYSICAL MAP OPTIMIZER */}
          {activeTab === 'warehouse-map' && (
            <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 28 }}>
              <View style={[styles.profileHeadingRow, { justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="grid" size={24} color={GREEN_THEME.primary} />
                  <Text style={styles.profileSectionTitle}>Bản đồ Sức chứa Vị trí & Cân bằng Zone sảnh kệ hàng</Text>
                </View>
                
                <TouchableOpacity style={styles.addWorkerBtn} onPress={handleOptimizeShelves}>
                  <Ionicons name="options" size={14} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '850' }}>Tối ưu hóa sắp xếp sảnh</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.zoneGrid}>
                {shelfOccupancies.map((shelf, idx) => (
                  <View key={idx} style={[styles.zoneBox, { width: '31.5%', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#cbd5e1' }]}>
                    <View style={styles.zoneHeader}>
                      <Text style={{ fontSize: 14, fontWeight: '950', color: GREEN_THEME.textDark }}>Kệ vật lý {shelf.shelf}</Text>
                      <View style={[styles.alertPill, { backgroundColor: shelf.color === '#D32F2F' ? '#ffebee' : '#e8f5e9' }]}>
                        <Text style={{ fontSize: 9, fontWeight: '900', color: shelf.color }}>{shelf.label}</Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 12, color: GREEN_THEME.textMuted, marginTop: 4 }}>Danh mục chứa: {shelf.desc}</Text>
                    
                    <View style={{ marginTop: 14 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: GREEN_THEME.textMuted, marginBottom: 6 }}>Live Sức chứa (%):</Text>
                      <View style={styles.zoneProgressBg}>
                        <View style={[styles.zoneProgressFill, { width: `${shelf.rate}%`, backgroundColor: shelf.color }]} />
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: shelf.color, textAlign: 'right' }}>{shelf.rate}% Sức chứa</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* TAB 10: INCIDENTS MANAGEMENT */}
          {activeTab === 'incidents' && (
            <View style={styles.fullPanelWorkspace}>
              <View style={styles.panelTitleRow}>
                <Text style={styles.panelTitleHeading}>Sự cố báo thiếu sản phẩm từ ca nhặt hàng</Text>
                <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchIncidents()}>
                  <Ionicons name="refresh" size={14} color={GREEN_THEME.primary} style={{ marginRight: 4 }} />
                  <Text style={{ color: GREEN_THEME.primary, fontSize: 13, fontWeight: '700' }}>Tải lại danh sách</Text>
                </TouchableOpacity>
              </View>

              {loadingIncidents ? (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="large" color={GREEN_THEME.primary} />
                </View>
              ) : incidentsList.length === 0 ? (
                <View style={styles.loadingWrapper}>
                  <Ionicons name="checkmark-circle" size={64} color={GREEN_THEME.primary} />
                  <Text style={{ color: GREEN_THEME.textDark, fontWeight: '800', fontSize: 16, marginTop: 12 }}>Không có sự cố nào cần xử lý!</Text>
                </View>
              ) : (
                <ScrollView style={{ flex: 1, padding: 24 }}>
                  <View style={styles.tableWebContainer}>
                    <View style={styles.tableWebHeader}>
                      <Text style={[styles.thCell, { flex: 1 }]}>ID sự cố</Text>
                      <Text style={[styles.thCell, { flex: 3 }]}>Sản phẩm báo thiếu</Text>
                      <Text style={[styles.thCell, { flex: 1.5 }]}>Khu / Kệ</Text>
                      <Text style={[styles.thCell, { flex: 2 }]}>Nhân viên báo</Text>
                      <Text style={[styles.thCell, { flex: 1.5, textAlign: 'center' }]}>Trạng thái</Text>
                      <Text style={[styles.thCell, { flex: 1.5, textAlign: 'center' }]}>Thao tác</Text>
                    </View>

                    {incidentsList.map((incident, idx) => (
                      <View key={incident.id || incident._id || idx} style={styles.tableWebRow}>
                        <Text style={[styles.tdCell, { flex: 1, fontWeight: '800' }]}>#{incident.id || idx + 1}</Text>
                        <Text style={[styles.tdCell, { flex: 3, fontWeight: '750' }]} numberOfLines={1}>{incident.productName || incident.product_name}</Text>
                        <Text style={[styles.tdCell, { flex: 1.5, color: GREEN_THEME.primary, fontWeight: '800' }]}>Khu {incident.location || '—'}</Text>
                        <Text style={[styles.tdCell, { flex: 2 }]}>{incident.reportedBy || 'Staff'}</Text>
                        <View style={[styles.tdCell, { flex: 1.5, alignItems: 'center' }]}>
                          <View style={[styles.alertPill, { backgroundColor: incident.status === 'resolved' ? '#e8f5e9' : '#ffebee' }]}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: incident.status === 'resolved' ? GREEN_THEME.primary : GREEN_THEME.error }}>
                              {incident.status === 'resolved' ? 'Đã xử lý' : 'Đang thiếu'}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.tdCell, { flex: 1.5, alignItems: 'center' }]}>
                          {incident.status !== 'resolved' ? (
                            <TouchableOpacity style={styles.resolveActionBtn} onPress={() => handleResolveIncident(incident.id || incident._id)}>
                              <Text style={styles.resolveActionBtnText}>Giải quyết</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={{ color: GREEN_THEME.textMuted, fontSize: 11 }}>Hoàn tất</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          {/* TAB 11: STORE DIRECTORY */}
          {activeTab === 'stores' && (
            <View style={styles.fullPanelWorkspace}>
              <View style={styles.panelTitleRow}>
                <Text style={styles.panelTitleHeading}>Danh sách đối tác Cửa hàng Chi nhánh Kingfood Market</Text>
                <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchStores()}>
                  <Ionicons name="refresh" size={14} color={GREEN_THEME.primary} style={{ marginRight: 4 }} />
                  <Text style={{ color: GREEN_THEME.primary, fontSize: 13, fontWeight: '700' }}>Tải lại</Text>
                </TouchableOpacity>
              </View>

              {loadingStores ? (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="large" color={GREEN_THEME.primary} />
                </View>
              ) : storesList.length === 0 ? (
                <View style={styles.loadingWrapper}>
                  <Ionicons name="business" size={48} color="#ccc" />
                  <Text style={{ color: GREEN_THEME.textMuted, marginTop: 12 }}>Chưa có chi nhánh nào đăng ký.</Text>
                </View>
              ) : (
                <ScrollView style={{ flex: 1, padding: 24 }}>
                  <View style={styles.tableWebContainer}>
                    <View style={styles.tableWebHeader}>
                      <Text style={[styles.thCell, { flex: 2 }]}>Chi nhánh Cửa hàng</Text>
                      <Text style={[styles.thCell, { flex: 2 }]}>Người quản lý đại diện</Text>
                      <Text style={[styles.thCell, { flex: 3 }]}>Email đăng nhập cổng mua hàng</Text>
                      <Text style={[styles.thCell, { flex: 1.5 }]}>Số điện thoại</Text>
                      <Text style={[styles.thCell, { flex: 1.5, textAlign: 'center' }]}>Trạng thái</Text>
                    </View>

                    {storesList.map((store, index) => (
                      <View key={store.id || index} style={styles.tableWebRow}>
                        <Text style={[styles.tdCell, { flex: 2, fontWeight: '800' }]}>{store.branch?.name || 'Chi nhánh Kingfood'}</Text>
                        <Text style={[styles.tdCell, { flex: 2, fontWeight: '700' }]}>{store.name || 'Người quản lý'}</Text>
                        <Text style={[styles.tdCell, { flex: 3, color: '#334155' }]}>{store.email}</Text>
                        <Text style={[styles.tdCell, { flex: 1.5 }]}>{store.phoneNumber || '—'}</Text>
                        <View style={[styles.tdCell, { flex: 1.5, alignItems: 'center' }]}>
                          <View style={[styles.alertPill, { backgroundColor: store.status === 'active' ? '#e8f5e9' : '#ffebee' }]}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: store.status === 'active' ? GREEN_THEME.primary : GREEN_THEME.error }}>
                              {store.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          {/* TAB 12: TEAM MANAGEMENT */}
          {activeTab === 'team' && (
            <View style={styles.splitLayout}>
              
              {/* Left picker staff table */}
              <View style={[styles.catalogSide, { flex: 6.5, backgroundColor: '#fff', borderRightWidth: 1.5, borderRightColor: '#e2e8f0' }]}>
                <View style={styles.panelTitleRow}>
                  <Text style={styles.panelTitleHeading}>Roster danh sách nhân viên lấy hàng (Picker Staff)</Text>
                  
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={styles.addWorkerBtn} onPress={() => setShowAddWorker(v => !v)}>
                      <Ionicons name={showAddWorker ? "eye" : "person-add"} size={14} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                        {showAddWorker ? 'Xem danh sách' : 'Đăng ký nhân sự'}
                      </Text>
                    </TouchableOpacity>
 
                    <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchTeam()}>
                      <Ionicons name="refresh" size={14} color={GREEN_THEME.primary} style={{ marginRight: 4 }} />
                      <Text style={{ color: GREEN_THEME.primary, fontSize: 13, fontWeight: '700' }}>Tải lại</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {loadingTeam ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="large" color={GREEN_THEME.primary} />
                  </View>
                ) : teamList.length === 0 ? (
                  <View style={styles.loadingWrapper}>
                    <Ionicons name="people-outline" size={48} color="#ccc" />
                    <Text style={{ color: GREEN_THEME.textMuted, marginTop: 12 }}>Chưa có tài khoản picker nào.</Text>
                  </View>
                ) : (
                  <ScrollView style={{ flex: 1, padding: 16 }}>
                    <View style={styles.tableWebContainer}>
                      <View style={styles.tableWebHeader}>
                        <Text style={[styles.thCell, { flex: 2 }]}>Họ và tên nhân viên</Text>
                        <Text style={[styles.thCell, { flex: 1.5 }]}>Tên tài khoản</Text>
                        <Text style={[styles.thCell, { flex: 1.2 }]}>Vai trò</Text>
                        <Text style={[styles.thCell, { flex: 1.5 }]}>Số điện thoại</Text>
                        <Text style={[styles.thCell, { flex: 1.2, textAlign: 'center' }]}>Khu hoạt động</Text>
                        <Text style={[styles.thCell, { flex: 1.2, textAlign: 'center' }]}>Thao tác</Text>
                      </View>

                      {teamList.map((worker) => (
                        <View key={worker.id} style={styles.tableWebRow}>
                          <Text style={[styles.tdCell, { flex: 2, fontWeight: '700' }]}>{worker.name || worker.fullName || worker.username}</Text>
                          <Text style={[styles.tdCell, { flex: 1.5, color: '#334155' }]}>{worker.username}</Text>
                          <Text style={[styles.tdCell, { flex: 1.2, textTransform: 'capitalize' }]}>{worker.role === 'admin' ? 'Quản lý' : 'Nhân viên'}</Text>
                          <Text style={[styles.tdCell, { flex: 1.5 }]}>{worker.phoneNumber || '—'}</Text>
                          <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'center', fontWeight: '800', color: GREEN_THEME.primary }]}>
                            Khu {worker.assignedZone || '—'}
                          </Text>
                          <View style={[styles.tdCell, { flex: 1.2, alignItems: 'center' }]}>
                            {worker.username !== 'admin' && worker.role !== 'admin' ? (
                              <TouchableOpacity style={styles.deleteWorkerAction} onPress={() => handleDeleteWorker(worker)}>
                                <Text style={styles.deleteWorkerActionText}>Xoá</Text>
                              </TouchableOpacity>
                            ) : (
                              <Text style={{ color: GREEN_THEME.textMuted, fontSize: 11 }}>Mặc định</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>

              {/* Right picker account registration form */}
              <View style={[styles.cartSide, { flex: 3.5, backgroundColor: '#fff', borderLeftWidth: 1.5, borderLeftColor: '#e2e8f0' }]}>
                {showAddWorker ? (
                  <View style={{ padding: 24 }}>
                    <View style={styles.profileHeadingRow}>
                      <Ionicons name="person-add-outline" size={22} color={GREEN_THEME.primary} />
                      <Text style={styles.profileSectionTitle}>Tạo tài khoản Nhân sự kho mới</Text>
                    </View>

                    <View style={styles.profileFormGroup}>
                      <Text style={styles.profileInputLabel}>Tài khoản đăng nhập (Username): *</Text>
                      <TextInput 
                        style={styles.profileFormInput}
                        placeholder="Ví dụ: picker.nguyen"
                        value={workerForm.username}
                        onChangeText={t => setWorkerForm(f => ({ ...f, username: t }))}
                      />
                    </View>

                    <View style={styles.profileFormGroup}>
                      <Text style={styles.profileInputLabel}>Mật khẩu đăng nhập ban đầu: *</Text>
                      <TextInput 
                        style={styles.profileFormInput}
                        placeholder="Nhập mật khẩu"
                        secureTextEntry={true}
                        value={workerForm.password}
                        onChangeText={t => setWorkerForm(f => ({ ...f, password: t }))}
                      />
                    </View>

                    <View style={styles.profileFormGroup}>
                      <Text style={styles.profileInputLabel}>Họ và tên nhân viên: *</Text>
                      <TextInput 
                        style={styles.profileFormInput}
                        placeholder="Ví dụ: Nguyễn Văn Hải"
                        value={workerForm.name}
                        onChangeText={t => setWorkerForm(f => ({ ...f, name: t }))}
                      />
                    </View>

                    <View style={styles.profileFormGroup}>
                      <Text style={styles.profileInputLabel}>Địa chỉ Email: *</Text>
                      <TextInput 
                        style={styles.profileFormInput}
                        placeholder="Ví dụ: hai.nguyen@kingfood.com"
                        value={workerForm.email}
                        onChangeText={t => setWorkerForm(f => ({ ...f, email: t }))}
                        keyboardType="email-address"
                      />
                    </View>

                    <View style={styles.profileFormGroup}>
                      <Text style={styles.profileInputLabel}>Số điện thoại liên lạc:</Text>
                      <TextInput 
                        style={styles.profileFormInput}
                        placeholder="Nhập số điện thoại"
                        value={workerForm.phoneNumber}
                        onChangeText={t => setWorkerForm(f => ({ ...f, phoneNumber: t }))}
                      />
                    </View>

                    <View style={styles.profileFormGroup}>
                      <Text style={styles.profileInputLabel}>Khu vực làm việc (Chọn từ kệ kho thực tế): *</Text>
                      <select
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#ccc',
                          backgroundColor: '#fff',
                          width: '100%',
                          fontSize: 14,
                        }}
                        value={workerForm.assignedLocationId}
                        onChange={e => setWorkerForm(f => ({ ...f, assignedLocationId: e.target.value }))}
                      >
                        <option value="">-- Chọn vị trí kệ kho thực tế --</option>
                        {locationsList.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                        ))}
                      </select>
                    </View>

                    <TouchableOpacity 
                      style={[styles.submitRegisterBtn, submittingWorker && { opacity: 0.7 }]}
                      onPress={handleCreateWorker}
                      disabled={submittingWorker}
                    >
                      {submittingWorker ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                          <Text style={styles.submitRegisterBtnText}>Xác nhận Tạo tài khoản</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.invoicePlaceholderContainer}>
                    <Ionicons name="people" size={80} color="#c8e6c9" style={{ marginBottom: 16 }} />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: GREEN_THEME.textDark }}>Quản trị Picker Roster</Text>
                    <Text style={{ fontSize: 12, color: GREEN_THEME.textMuted, marginTop: 4, textAlign: 'center' }}>Nhấn nút "Đăng ký nhân sự" góc phải phía trên để mở form đăng ký thêm nhân sự picker mới.</Text>
                  </View>
                )}
              </View>

            </View>
          )}

          {/* TAB 13: SYSTEM PREFERENCES & PASSWORD */}
          {activeTab === 'settings' && (
            <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 32 }}>
              <View style={styles.profileLayoutWeb}>
                
                {/* Left Card: Change Password */}
                <View style={styles.profilePasswordCard}>
                  <View style={styles.profileHeadingRow}>
                    <Ionicons name="lock-closed-outline" size={24} color={GREEN_THEME.primary} />
                    <Text style={styles.profileHeadingTitle}>Đổi mật khẩu Quản lý kho WMS</Text>
                  </View>

                  <Text style={styles.pwdHintCard}><Ionicons name="information-circle" /> {PASSWORD_HINT}</Text>

                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Mật khẩu hiện tại:</Text>
                    <TextInput 
                      style={styles.profileFormInput}
                      secureTextEntry={true}
                      placeholder="Mật khẩu cũ"
                      value={oldPassword}
                      onChangeText={setOldPassword}
                    />
                  </View>

                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Mật khẩu mới:</Text>
                    <TextInput 
                      style={styles.profileFormInput}
                      secureTextEntry={true}
                      placeholder="Mật khẩu mới"
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                  </View>

                  <View style={styles.profileFormGroup}>
                    <Text style={styles.profileInputLabel}>Xác nhận mật khẩu mới:</Text>
                    <TextInput 
                      style={styles.profileFormInput}
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
                        <Text style={styles.btnChangePwdActionText}>Xác nhận Đổi mật khẩu Admin</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Right Card: Technical Server info */}
                <View style={styles.profileInfoCard}>
                  <View style={styles.profileHeadingRow}>
                    <Ionicons name="server-outline" size={24} color={GREEN_THEME.primary} />
                    <Text style={styles.profileHeadingTitle}>Thông tin máy chủ & Cấu hình WMS</Text>
                  </View>

                  <View style={styles.systemInfoRow}>
                    <Text style={styles.sysLabel}>Hệ thống:</Text>
                    <Text style={styles.sysValue}>Kingfood Warehouse Management System (WMS)</Text>
                  </View>

                  <View style={styles.systemInfoRow}>
                    <Text style={styles.sysLabel}>Môi trường triển khai:</Text>
                    <Text style={styles.sysValue}>Production Server / Web API Controller Mode</Text>
                  </View>

                  <View style={styles.systemInfoRow}>
                    <Text style={styles.sysLabel}>Mã phiên bản (Version):</Text>
                    <Text style={styles.sysValue}>v2.5.0-WebCommand (Build 840)</Text>
                  </View>

                  <View style={styles.systemInfoRow}>
                    <Text style={styles.sysLabel}>Công nghệ core:</Text>
                    <Text style={styles.sysValue}>React Native Web Engine v19.0 / Metro bundler</Text>
                  </View>

                  <View style={styles.systemInfoRow}>
                    <Text style={styles.sysLabel}>Trạng thái kết nối API:</Text>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <View style={styles.liveSystemDot} />
                      <Text style={{ color: GREEN_THEME.primary, fontWeight: '800', marginLeft: 4 }}>Hoạt động bình thường</Text>
                    </div>
                  </View>
                </View>

              </View>
            </ScrollView>
          )}

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f4f6f8',
    overflow: 'hidden',
  },
  
  // Left Sidebar
  sidebar: {
    width: 290,
    backgroundColor: GREEN_THEME.sidebarDark, // slate dark theme
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
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
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
    backgroundColor: GREEN_THEME.primary,
    shadowColor: GREEN_THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  menuLabelActive: {
    color: '#fff',
  },
  sidebarFooter: {
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 20,
    gap: 16,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
  },
  adminAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GREEN_THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  adminRole: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: GREEN_THEME.primary,
    gap: 8,
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Main area
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
    color: GREEN_THEME.textDark,
  },
  topbarSub: {
    fontSize: 12,
    color: GREEN_THEME.textMuted,
    marginTop: 4,
  },
  topbarRight: {
    flexDirection: 'row',
  },
  liveSystemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN_THEME.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: GREEN_THEME.border,
  },
  liveSystemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN_THEME.primary,
  },
  liveSystemText: {
    fontSize: 11,
    fontWeight: '800',
    color: GREEN_THEME.primary,
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

  // TAB 1: cockpit dashboard
  kpiGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    position: 'relative',
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  kpiIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
    opacity: 0.8,
  },
  kpiCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: GREEN_THEME.textMuted,
    textTransform: 'uppercase',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: GREEN_THEME.textMuted,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '950',
    color: GREEN_THEME.textDark,
    marginTop: 10,
  },

  // PHYSICAL ZONE MAP STYLE
  zoneMapCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginBottom: 24,
  },
  statsCardHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
  },
  statsCardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: GREEN_THEME.textDark,
  },
  zoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  zoneBox: {
    width: '48.5%',
    backgroundColor: GREEN_THEME.bgLight,
    borderWidth: 1.5,
    borderColor: GREEN_THEME.border,
    borderRadius: 16,
    padding: 16,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  zoneName: {
    fontSize: 13,
    fontWeight: '800',
    color: GREEN_THEME.textDark,
  },
  zoneStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: GREEN_THEME.primary,
  },
  zoneMapBody: {
    flexDirection: 'column',
  },
  zoneMetric: {
    fontSize: 11,
    color: GREEN_THEME.textMuted,
    marginBottom: 8,
  },
  zoneProgressBg: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  zoneProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  zoneProgressText: {
    fontSize: 10,
    color: GREEN_THEME.textMuted,
    fontWeight: '700',
  },

  statsSplitGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  splitCardLeft: {
    flex: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  splitCardRight: {
    flex: 4,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  emptyStateBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewTable: {
    flexDirection: 'column',
  },
  overviewTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 8,
    marginBottom: 6,
  },
  othCell: {
    fontSize: 11,
    fontWeight: '800',
    color: GREEN_THEME.textMuted,
    textTransform: 'uppercase',
  },
  overviewTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  otdCell: {
    fontSize: 12,
    color: GREEN_THEME.textDark,
  },
  alertPill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  incidentOverviewList: {
    flexDirection: 'column',
    gap: 12,
  },
  incidentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fffdfd',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ffebee',
  },
  incidentProdName: {
    fontSize: 13,
    fontWeight: '850',
    color: GREEN_THEME.textDark,
  },
  incidentSub: {
    fontSize: 11,
    color: GREEN_THEME.textMuted,
    marginTop: 2,
  },
  resolveBtnSmall: {
    backgroundColor: GREEN_THEME.error,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  resolveBtnTextSmall: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  // TAB 2: orders
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
  panelTitleRow: {
    padding: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitleHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: GREEN_THEME.textDark,
  },
  orderSearchInputWeb: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: GREEN_THEME.textDark,
    outlineWidth: 0,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 14,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1.5,
    borderBottomColor: '#cbd5e1',
    gap: 6,
  },
  statusFilterChip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
  },
  statusFilterChipActive: {
    backgroundColor: GREEN_THEME.primary,
  },
  statusFilterText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  statusFilterTextActive: {
    color: '#fff',
  },
  orderCardWeb: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  orderCardWebSelected: {
    borderColor: GREEN_THEME.primary,
    backgroundColor: GREEN_THEME.primaryLight,
  },
  orderCardHeaderWeb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderCardIdWeb: {
    fontSize: 13,
    fontWeight: '900',
    color: GREEN_THEME.textDark,
  },
  orderCardBranchText: {
    fontSize: 12,
    fontWeight: '700',
    color: GREEN_THEME.primary,
    marginBottom: 6,
  },
  orderCardMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  orderCardMetaText: {
    fontSize: 11,
    color: GREEN_THEME.textMuted,
  },
  orderCardFooterWeb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    alignItems: 'center',
  },
  orderCardTotalVal: {
    fontSize: 13,
    fontWeight: '800',
    color: GREEN_THEME.primary,
  },

  cartSide: {
    flex: 3.5,
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
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
    borderBottomColor: GREEN_THEME.primary,
    marginBottom: 20,
  },
  invoiceHeading: {
    fontSize: 16,
    fontWeight: '950',
    color: GREEN_THEME.textDark,
  },
  invoiceSubtext: {
    fontSize: 11,
    color: GREEN_THEME.textMuted,
    marginTop: 4,
  },
  workflowWidgetCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginBottom: 16,
  },
  workflowWidgetLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  workflowButtonsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  workflowActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
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
    fontWeight: '855',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  invoiceCardVal: {
    fontSize: 13,
    color: GREEN_THEME.textDark,
    lineHeight: 18,
  },
  invoiceTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  thCell: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
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
    color: GREEN_THEME.textDark,
  },
  invoicePlaceholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },

  // TAB 3: incident & single table workspaces
  fullPanelWorkspace: {
    flex: 1,
    backgroundColor: '#f8fafc',
    flexDirection: 'column',
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
    backgroundColor: GREEN_THEME.primary,
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

  // TAB 5: team register
  addWorkerBtn: {
    backgroundColor: GREEN_THEME.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
  },
  profileSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: GREEN_THEME.textDark,
  },
  profileHeadingTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: GREEN_THEME.textDark,
  },
  profileFormGroup: {
    marginBottom: 16,
  },
  profileInputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: GREEN_THEME.textMuted,
    marginBottom: 6,
  },
  profileFormInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: GREEN_THEME.textDark,
    outlineWidth: 0,
    width: '100%',
  },
  submitRegisterBtn: {
    backgroundColor: GREEN_THEME.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
    width: '100%',
  },
  submitRegisterBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  deleteWorkerAction: {
    backgroundColor: GREEN_THEME.error,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteWorkerActionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  // TAB 6: setting & change pass
  profileLayoutWeb: {
    flexDirection: 'row',
    gap: 24,
  },
  profilePasswordCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  profileInfoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  pwdHintCard: {
    fontSize: 11,
    color: GREEN_THEME.primary,
    backgroundColor: GREEN_THEME.primaryLight,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: GREEN_THEME.primary,
    lineHeight: 16,
    marginBottom: 20,
  },
  btnChangePwdAction: {
    backgroundColor: GREEN_THEME.primary,
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
    fontWeight: '850',
  },
  systemInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sysLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: GREEN_THEME.textMuted,
  },
  sysValue: {
    fontSize: 13,
    fontWeight: '800',
    color: GREEN_THEME.textDark,
    textAlign: 'right',
    maxWidth: '65%',
  },
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
    color: GREEN_THEME.textDark,
  },
});
