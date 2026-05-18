export const BASE_URL = 'https://kingfood-wms-backend.onrender.com/api/v1';


let authToken = null;

export function setToken(token){authToken = token;}
export function getToken(){return authToken;}

async function request(method, endpoint, body = null, extraHeaders = {}) {
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

    return json.metadata ?? json;
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
export const updateProfile = (data) =>
    request ('PATCH', '/client/profile', data);
// PICKING
export const getAssignedTasks = () =>
    request ('GET', '/admin/picking/assigned');
export const packItem = (taskId, containerCode, quantity) =>
    request ('POST', '/admin/picking/pack', {taskId, containerCode, quantity});
export const moveItem = (productId, oldContainerCode, newContainerCode, quantity = 1) =>
    request ('POST', '/admin/picking/move', {productId, oldContainerCode, newContainerCode, quantity});
export const reportIncident = (taskId, reason, photoUri) => {
    const body = { taskId, reason, photoUrl: photoUri || '' };
    if (photoUri) {
        const formData = new FormData();
        formData.append('file', { uri: photoUri, type: 'image/jpeg', name: 'incident.jpg' });
        formData.append('taskId', String(taskId));
        formData.append('reason', reason);
        return request('POST', '/admin/picking/incident', formData);
    }
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
// PRODUCTS
export const getProducts = (query = '') =>
    request ('GET', `/public/products${query ? `?search=${query}`: ''}`)
export const getByProductId = (id) =>
    request ('GET', `/public/products/${id}`);
// Admin
export const getUsers = () =>
    request ('GET', '/admin/users');
export const createUser = (data) =>
    request ('POST', '/admin/users', data);
export const getDashboardStatus = () =>
    request ('GET', '/admin/dashboard/stats');
export const getCustomers = (page = 1, limit = 50) =>
    request ('GET', `/admin/customers?page=${page}&limit=${limit}`);
// ── LOCATIONS 
export const getLocations = () =>
    request('GET', '/admin/locations');

export const getLocationById = (id) =>
    request('GET', `/admin/locations/${id}`);

export const createLocation = (data) =>
    request('POST', '/admin/locations', data);

export const updateLocation = (id, data) =>
    request('PATCH', `/admin/locations/${id}`, data);

export const deleteLocation = (id) =>
    request('DELETE', `/admin/locations/${id}`);
// ── CONTAINERS 
export const getContainers = () =>
    request('GET', '/admin/containers');

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

// ── PICKING — phân công task ─────────────────────
export const assignPickingTask = (data) =>
    request('POST', '/admin/picking/assign', data);