# Changelog

## 2026-05-20

### File: `storeorder.web.jsx`

#### 1. Sửa nút "Tiếp tế tự động" (`handleApplyForecastReplenish`)
- Duyệt `filteredProducts`, tìm forecast theo SKU → nếu không match thì thử match theo tên sản phẩm
- Nếu tìm thấy trong `forecastList` → thêm vào giỏ với số lượng `recommendQty` (Cam Sành: 40, Sữa TH: 50, Coca: 30, Oreo: 20)
- Nếu không match → bỏ qua (không thêm)
- Xóa giỏ cũ trước khi thêm, sau đó chuyển sang tab đặt hàng

#### 2. Thêm nút "Xóa tất cả" giỏ hàng
- Thêm icon thùng rác (`trash-outline`) màu đỏ bên cạnh số lượng mặt hàng trong header giỏ hàng chi nhánh
- Chỉ hiển thị khi giỏ có hàng (`cart.length > 0`)
- Gọi `clearCart()` khi nhấn

#### 3. Sửa lỗi font Vietnamese (các thay đổi trước)
- `T? ngày` → `Từ ngày`
- `D?n ngày` → `Đến ngày`
- `Tu?n này` → `Tuần này`
- `L?c` → `Lọc`
- `'T?t c?'` → `'Tất cả'`
- Thêm divider `LỌC TRẠNG THÁI` giữa bộ lọc thời gian và trạng thái
- Bỏ `marginLeft: 16, alignSelf: 'center'` trong `presetGroupRow`
- Nhấn lại preset thời gian đang active → clear lọc
- Nhấn lại chip trạng thái đang active → reset về "Tất cả"
