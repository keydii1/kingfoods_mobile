# KingfoodWMS 🏬📦

Hệ thống quản lý kho (Warehouse Management System) cho **Kingfood** — chuỗi siêu thị thực phẩm. Ứng dụng mobile giúp nhân viên kho, quản lý kho và chủ cửa hàng thực hiện các tác vụ **picking, packing, kiểm kê, bàn giao ca, quản lý đơn hàng** và **quản lý đội nhóm** ngay trên thiết bị di động.

## Tính năng chính

### Nhân viên kho (Staff)
- **Dashboard** — Xem KPI cá nhân, danh sách tác vụ trong ca, tiến độ hoàn thành
- **Picking** — Lấy hàng theo đơn: quét barcode, xác nhận số lượng, chọn bin
- **Batch Picking** — Pick nhiều đơn cùng lúc, gom theo bin/order
- **Packing** — Đóng gói: gán bin, kiểm tra chất lượng, đóng thùng
- **Container Audit** — Kiểm kê thùng: so sánh số lượng yêu cầu vs thực tế
- **Search SKU** — Tra cứu sản phẩm theo tên/mã SKU
- **Bản đồ kho** — Sơ đồ 2D vị trí kệ hàng
- **Route picking** — Đường đi tối ưu: dẫn đường từ kệ này sang kệ khác
- **Bàn giao ca** — Ghi chú bàn giao, tồn kho, đơn hàng còn dang dở
- **Lịch sử hoạt động** — Filter pick/missing/move
- **Hồ sơ cá nhân** — Thông tin, chỉnh sửa hồ sơ, thành tích
- **Tác vụ phụ trợ** — Báo thiếu hàng, chuyển container, nhập tay, quét container, báo lỗi pick
- **Chế độ offline** — Xem dữ liệu cache, đồng bộ khi có mạng

### Quản lý kho (Admin/Manager)
- **Dashboard tổng quan** — SKU đã pick, nhân viên đang làm, báo thiếu, đơn tồn
- **Xử lý đơn hàng** — Duyệt/từ chối đơn, filter trạng thái
- **Đơn hàng cửa hàng** — Xem đơn theo từng cửa hàng, cập nhật trạng thái, xoá
- **Xử lý trả hàng** — Quét, kiểm tra, đánh giá tình trạng hàng trả
- **Báo cáo sự cố** — Danh sách sự cố, phân loại, giải quyết
- **Quản lý đội nhóm** — Xem trạng thái, sửa/xoá nhân viên
- **Tạo tài khoản** — Tạo tài khoản nhân viên mới với phân quyền

### Chủ cửa hàng (Store Manager)
- **Đặt hàng** — Duyệt danh mục, thêm vào giỏ, gửi đơn

### Toàn bộ người dùng
- **Đăng nhập** — Chọn vai trò (quản lý kho/nhân viên kho), đăng nhập cửa hàng
- **Quên mật khẩu** — Flow 3 bước: email → OTP → đặt lại mật khẩu
- **Cài đặt** — Âm thanh, rung, cảnh báo, chế độ offline, đồng bộ, đổi mật khẩu
- **Team view** — Xem trạng thái làm việc, năng suất theo khu vực
- **Thống kê** — KPI đơn hàng, top sản phẩm, đơn gần đây

## Kiến trúc

```
KingfoodWMS/
├── app/                            # Expo Router file-based routing
│   ├── _layout.tsx                 # Root layout + AuthProvider + auth guard
│   ├── index.tsx                   # Redirect → /Login
│   ├── Login.jsx                   # Login + forgot password flow
│   ├── (worker)/                   # Nhân viên kho (23 screens)
│   │   ├── dashboard.jsx
│   │   ├── picking.jsx
│   │   ├── batchpicking.jsx
│   │   ├── pickingflow.jsx
│   │   ├── productlist.jsx
│   │   ├── packing.jsx
│   │   ├── containeraudit.jsx
│   │   ├── skusearch.jsx
│   │   ├── ordersearch.jsx
│   │   ├── warehousemap.jsx
│   │   ├── route.jsx
│   │   ├── handover.jsx
│   │   ├── history.jsx
│   │   ├── profile.jsx
│   │   ├── moveitem.jsx
│   │   ├── missingitem.jsx
│   │   ├── manualentry.jsx
│   │   ├── scancontainer.jsx
│   │   ├── pickingerror.jsx
│   │   ├── notifications.jsx
│   │   ├── offline.jsx
│   │   ├── productivity.jsx
│   │   └── endshift.jsx
│   ├── (warehouse_manager)/        # Quản lý kho (6 screens)
│   │   ├── managerdashboard.jsx
│   │   ├── orderprocessing.jsx
│   │   ├── storelist.jsx
│   │   ├── storeorders.jsx
│   │   ├── returns.jsx
│   │   └── incidentreport.jsx
│   ├── (store_manager)/            # Chủ cửa hàng (1 screen)
│   │   └── storeorder.jsx
│   └── (shared)/                   # Dùng chung (4 screens)
│       ├── team.jsx
│       ├── createaccount.jsx
│       ├── setting.jsx
│       └── storestatistics.jsx
├── components/                     # Shared UI components
│   ├── StaffBottomNav.jsx          # Bottom navigation (5 tabs)
│   ├── FloatingAssistiveButton.jsx # Draggable FAB
│   └── ui/                         # Atomic components
├── constants/
│   ├── colors.ts                   # Brand color palette
│   ├── theme.ts                    # Light/dark theme tokens
│   └── services/
│       └── api.js                  # REST API client (~40 endpoints)
├── contexts/
│   └── AuthContext.tsx              # Auth state (role, token, login/logout)
├── hooks/                          # Custom hooks
├── assets/                         # Icons, splash screen
└── app.json
```

## Công nghệ sử dụng

| Công nghệ | Mục đích |
|---|---|
| [React Native](https://reactnative.dev/) 0.81 | Framework mobile (New Architecture) |
| [Expo](https://expo.dev/) SDK 54 | Build tool & runtime |
| [Expo Router](https://docs.expo.dev/router/introduction/) v4 | File-based routing với grouped routes |
| [React Navigation](https://reactnavigation.org/) | Bottom tabs, stack navigator |
| [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | Animation (picking flash, FAB drag) |
| [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) | Gesture handling (PanResponder) |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | Local persistent storage |
| TypeScript | Type safety |

## API Backend

- **Base URL:** `https://kingfood-wms-backend.onrender.com/api/v1`
- **Auth:** Bearer token (lưu trong memory, set qua `setToken()`)
- **Response format:** `{ success, statusCode, message, metadata }`

### Endpoints chính

| Nhóm | Endpoints |
|---|---|
| **Auth** | Login, logout, forget-password, verify-otp, reset-password |
| **Profile** | GET/PATCH profile |
| **Picking** | assigned, pack, move, incident, handover, trace container, assign task, report issue |
| **Orders** | CRUD đơn hàng (admin + client) |
| **Products** | Search, CRUD (admin) |
| **Users** | CRUD nhân viên, change-password |
| **Dashboard** | Thống kê tổng quan |
| **Customers** | Danh sách cửa hàng |
| **Locations** | CRUD vị trí kệ |
| **Containers** | CRUD container/bin |
| **Categories** | CRUD danh mục sản phẩm |
| **Incidents** | Chi tiết/cập nhật/xoá sự cố |

## Cài đặt & Chạy

```bash
# 1. Clone & cài dependencies
npm install

# 2. Khởi động Expo dev server
npx expo start

# 3. Chạy trên thiết bị cụ thể
npm run android   # Android emulator / thiết bị thật
npm run ios       # iOS simulator (macOS)
npm run web       # Web browser
```

## Yêu cầu hệ thống

- Node.js 18+
- Expo CLI
- Android Studio (cho Android emulator) hoặc Xcode (cho iOS simulator)
- Thiết bị thật với Expo Go (tuỳ chọn)

## Màu sắc thương hiệu

Bảng màu chủ đạo lấy cảm hứng từ xanh lá Kingfood:

| Vai trò | Mã màu |
|---|---|
| Primary | `#1b5e3b` |
| Primary Light | `#2e7d32` |
| Accent | `#4caf50` |
| Success | `#4caf50` |
| Warning | `#ff9800` |
| Error | `#e53935` |

## Tổng quan ứng dụng

| Metric | Giá trị |
|---|---|
| Tổng số màn hình | 33 |
| Nhân viên kho | 23 |
| Quản lý kho | 6 |
| Dùng chung | 4 |
| Chủ cửa hàng | 1 |
| API endpoints | ~40+ |

## Giấy phép

Dự án nội bộ — Kingfood.
