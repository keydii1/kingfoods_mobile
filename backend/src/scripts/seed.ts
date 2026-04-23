import mongoose from "mongoose";
import dotenv from "dotenv";
import { connect } from "../configs/database.config";
import Branch from "../models/branch.model";
import Category from "../models/category.model";
import Location from "../models/location.model";
import Product from "../models/product.model";
import { BRANCHES, CATEGORIES, LOCATIONS, PRODUCTS } from "../db/sampleData";

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log("=== Đang bắt đầu quá trình Seed dữ liệu ===");
    
    // 1. Kết nối DB
    await connect();

    // 2. Xóa dữ liệu cũ để đảm bảo sạch sẽ (Tùy chọn)
    console.log("-> Đang dọn dẹp dữ liệu cũ...");
    await Promise.all([
      Branch.deleteMany({}),
      Category.deleteMany({}),
      Location.deleteMany({}),
      Product.deleteMany({}),
    ]);

    // 3. Insert dữ liệu hàng loạt (Bulk Insert)
    console.log("-> Đang nạp dữ liệu mới...");
    
    await Branch.insertMany(BRANCHES);
    await Category.insertMany(CATEGORIES);
    await Location.insertMany(LOCATIONS);
    await Product.insertMany(PRODUCTS);

    console.log("=== Seed dữ liệu THÀNH CÔNG! ===");
    process.exit(0);
  } catch (error) {
    console.error("!!! Seed dữ liệu THẤT BẠI:", error);
    process.exit(1);
  }
};

seedDatabase();
