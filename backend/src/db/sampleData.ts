import mongoose from "mongoose";

// --- KHAI BÁO ID CỐ ĐỊNH ---
// Việc này giúp chúng ta biết trước ID để link các model với nhau
export const IDS = {
  BRANCH_1: new mongoose.Types.ObjectId(),
  CATEGORY_1: new mongoose.Types.ObjectId(),
  CATEGORY_2: new mongoose.Types.ObjectId(),
  LOCATION_1: new mongoose.Types.ObjectId(),
  USER_ADMIN: new mongoose.Types.ObjectId(),
};

// --- DỮ LIỆU CHI NHÁNH (BRANCH) ---
export const BRANCHES = [
  {
    _id: IDS.BRANCH_1,
    name: "Kingfood Quận 1",
    street: "123 Lê Lợi, Phường Bến Thành",
    openHour: "08:00",
    closeHour: "22:00",
  },
];

// --- DỮ LIỆU DANH MỤC (CATEGORY) ---
export const CATEGORIES = [
  {
    _id: IDS.CATEGORY_1,
    name: "Trái Cây Nhập Khẩu",
    status: "active",
    description: "Các loại trái cây nhập từ Mỹ, Úc, Nhật",
  },
  {
    _id: IDS.CATEGORY_2,
    name: "Thực Phẩm Tươi Sống",
    status: "active",
    description: "Thịt, cá, hải sản trong ngày",
  },
];

// --- DỮ LIỆU VỊ TRÍ (LOCATION) ---
export const LOCATIONS = [
  {
    _id: IDS.LOCATION_1,
    name: "Khu vực sảnh A",
    status: "active",
    description: "Khu vực trưng bày hàng mới",
  },
];

// --- DỮ LIỆU SẢN PHẨM (PRODUCT) ---
// Ở đây chúng ta dùng IDS.CATEGORY_1 và IDS.LOCATION_1 để link
export const PRODUCTS = [
  {
    name: "Táo Envy Mỹ Size L",
    category_id: IDS.CATEGORY_1,
    location_id: IDS.LOCATION_1,
    price: 150000,
    status: "active",
    description: "Táo giòn, ngọt, thơm",
  },
  {
    name: "Nho Mẫu Đơn Nhật",
    category_id: IDS.CATEGORY_1,
    location_id: IDS.LOCATION_1,
    price: 800000,
    status: "active",
    description: "Nho cao cấp nhập khẩu",
  },
  {
    name: "Thịt Bò Mỹ",
    category_id: IDS.CATEGORY_2,
    location_id: IDS.LOCATION_1,
    price: 350000,
    status: "active",
    description: "Thịt bò thăn ngoại",
  },
];
