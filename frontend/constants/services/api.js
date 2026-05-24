import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
    if (__DEV__) {
        // Dynamically detect the dev machine's IP from Expo's debugger host
        // This works for both Simulator AND real devices on the same WiFi network
        const debuggerHost = Constants.expoConfig?.hostUri || '';
        const localhost = debuggerHost.split(':')[0];
        
        if (localhost && localhost !== '127.0.0.1') {
            return `http://${localhost}:9999/api/v1`;
        }
        
        // Fallback: iOS Simulator can use 127.0.0.1 (shares host network)
        // For Android emulator, 10.0.2.2 maps to host machine
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:9999/api/v1';
        }
        return 'http://127.0.0.1:9999/api/v1';
    }
    return 'https://kingfood-wms-backend.onrender.com/api/v1';
};

export const BASE_URL = getBaseUrl();
console.log('[WMS] Connected to API URL:', BASE_URL);


let authToken = null;

// Lightweight high-performance in-memory cache for GET requests
const apiCache = new Map();

export function clearApiCache() {
    apiCache.clear();
}

export function setToken(token) {
    authToken = token;
    clearApiCache(); // Clear cache on token changes (login/logout)
}

export function getToken() {
    return authToken;
}

async function request(method, endpoint, body = null, extraHeaders = {}) {
    const isGet = method === 'GET';
    const cacheKey = `${endpoint}:${body ? JSON.stringify(body) : ''}`;

    if (isGet) {
        const cached = apiCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 10000) { // 10s TTL
            return cached.data;
        }
    } else {
        // Automatically clear cache on any state mutation to guarantee fresh data
        apiCache.clear();
    }

    const headers = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    Object.assign(headers, extraHeaders);
    const config = { method, headers };
    if (body instanceof FormData) {
        config.body = body;
    } else if (body) {
        headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || 'Lỗi server');

    const result = json.metadata ?? json;

    if (isGet) {
        apiCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
    }

    return result;
}
// AUTH
export const login = (username, password) => 
    request ('POST', '/auth/user/login', {username, password});
export const logout = () =>
    request ('POST', '/auth/user/logout');
export const forgetPassword = (email) =>
    request('POST', '/auth/user/forget-password', { email });

export const verifyOtp = (email, otp) =>
    request('POST', '/auth/user/verify-otp', { email, otp });
export const resetPassword = (resetToken, newPassword) =>
    request('PATCH', '/auth/user/reset-password', { password: newPassword }, { 'reset-token': resetToken });
// Customer
export const customerLogin = (email, password) =>
    request ('POST', '/auth/customer/login', {email, password});
export const customerLogout = () =>
    request ('POST', '/auth/customer/logout');
// PROFILE 
export const getProfile = () =>
    request ('GET', '/client/profile');
export const getMyProfile = () =>
    request('GET', '/admin/users/me');
export const updateProfile = (data) =>
    request ('PATCH', '/client/profile', data);
// PICKING
export const getAssignedTasks = () =>
    request ('GET', '/admin/picking/assigned');
export const packItem = (taskId, containerCode, quantity) =>
    request ('POST', '/admin/picking/pack', {taskId, containerCode, quantity});
export const moveItem = (productId, oldContainerCode, newContainerCode, quantity = 1) =>
    request ('POST', '/admin/picking/move', {productId, oldContainerCode, newContainerCode, quantity});
export const reportIncident = (taskId, reason, photoUrl) => {
    const body = { taskId, reason, photoUrl: photoUrl || '' };
    return request('POST', '/admin/picking/incident', body);
};
export const handoverTask = (taskId, nextStaffId) =>
    request ('POST', '/admin/picking/handover', { taskId, nextStaffId })
export const getIncidents = () =>
    request ('GET', '/admin/picking/incidents');
export const resolveIncident = (id) =>
    request ('POST', `/admin/picking/incident/${id}/resolve`);
export const traceContainer = (containerCode) =>
    request ('GET', `/admin/picking/trace/${containerCode}`);
// ORDERS
export const getOrders = () =>
    request ('GET', `/admin/orders`);
export const updateOrderStatus = (id, status) =>
    request('PATCH', `/admin/orders/${id}`, {status});
export const createOrder = (products, address = '') =>
    request ('POST', '/client/orders', { products, address });
export const getClientOrders = () =>
    request('GET', '/client/orders');
export const getClientStatistics = (startDate = '', endDate = '') => {
    let url = '/client/orders/statistics';
    const params = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return request('GET', url);
};
export const getClientOrderDetail = (orderId) =>
    request('GET', `/client/orders/detail/${orderId}`);
export const cancelClientOrder = (orderId) =>
    request('PATCH', `/client/orders/${orderId}`, { status: 'cancelled' });
// PRODUCTS
export const getProducts = (query = '') => {
    let url = `/public/products?limit=100`;
    if (query) url += `&search=${query}`;
    return request('GET', url);
};
export const getByProductId = (id) =>
    request ('GET', `/public/products/${id}`);
export const getPublicCategories = () =>
    request('GET', '/public/categories?limit=100');
// Admin
export const getUsers = () =>
    request ('GET', '/admin/users');
export const createUser = (data) =>
    request ('POST', '/admin/users', data);
export const getDashboardStatus = () =>
    request ('GET', '/admin/dashboard/stats');
export const getCustomers = (page = 1, limit = 50) =>
    request ('GET', `/admin/customers?page=${page}&limit=${limit}`);
export const getLocations = (params = '') =>
    request('GET', `/admin/locations?limit=1000${params ? `&${params}` : ''}`);

export const getLocationById = (id) =>
    request('GET', `/admin/locations/${id}`);

export const createLocation = (data) =>
    request('POST', '/admin/locations', data);

export const updateLocation = (id, data) =>
    request('PATCH', `/admin/locations/${id}`, data);

export const deleteLocation = (id) =>
    request('DELETE', `/admin/locations/${id}`);
// ── CONTAINERS 
export const getContainers = (params = '') =>
    request('GET', `/admin/containers?limit=1000${params ? `&${params}` : ''}`);

export const getContainerById = (id) =>
    request('GET', `/admin/containers/${id}`);

export const createContainer = (data) =>
    request('POST', '/admin/containers', data);

export const updateContainer = (id, data) =>
    request('PATCH', `/admin/containers/${id}`, data);

export const deleteContainer = (id) =>
    request('DELETE', `/admin/containers/${id}`);
export const getIncidentById = (id) =>
    request('GET', `/admin/incidents/${id}`);

export const updateIncident = (id, data) =>
    request('PATCH', `/admin/incidents/${id}`, data);

export const deleteIncident = (id) =>
    request('DELETE', `/admin/incidents/${id}`);

// ── PICKING
export const reportItemIssue = (itemId, data) =>
    request('POST', `/admin/picking/issue/${itemId}`, data);
// ── CATEGORIES — admin ───────────────────────────
export const getCategories = () =>
    request('GET', '/admin/categories');

export const getCategoryById = (id) =>
    request('GET', `/admin/categories/${id}`);

export const createCategory = (data) =>
    request('POST', '/admin/categories', data);

export const updateCategory = (id, data) =>
    request('PATCH', `/admin/categories/${id}`, data);

export const deleteCategory = (id) =>
    request('DELETE', `/admin/categories/${id}`);
// ── ADMIN PRODUCTS — thêm CRUD 
export const createProduct = (data) =>
    request('POST', '/admin/products', data);

export const updateProduct = (id, data) =>
    request('PATCH', `/admin/products/${id}`, data);

export const deleteProduct = (id) =>
    request('DELETE', `/admin/products/${id}`);

export const deleteOrder = (id) =>
    request('DELETE', `/admin/orders/${id}`);

export const deleteUser = (id) =>
    request('DELETE', `/admin/users/${id}`);

export const updateUser = (id, data) =>
    request('PATCH', `/admin/users/${id}`, data);

export const changeUserPassword = (data) =>
    request('PATCH', '/admin/users/change-password', data);
export const changeCustomerPassword = (data) =>
    request('PATCH', '/client/profile/change-password', data);

// ── PICKING — phân công task ─────────────────────
export const assignPickingTask = (data) =>
    request('POST', '/admin/picking/assign', data);