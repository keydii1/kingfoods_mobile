import "reflect-metadata";
import { AppDataSource } from "./config/DataSource";
import { Product } from "./Entity/Product";
import { Category } from "./Entity/Category";
import { User } from "./Entity/User";
import { Customer } from "./Entity/Customer";
import { Branch } from "./Entity/Branch";

async function check() {
  try {
    console.log("📡 Đang kết nối tới cơ sở dữ liệu để kiểm tra dữ liệu hiện tại...");
    await AppDataSource.initialize();
    console.log("✅ Kết nối thành công!");

    const productCount = await AppDataSource.manager.count(Product);
    const categoryCount = await AppDataSource.manager.count(Category);
    const userCount = await AppDataSource.manager.count(User);
    const customerCount = await AppDataSource.manager.count(Customer);
    const branchCount = await AppDataSource.manager.count(Branch);

    console.log("\n📊 THỐNG KÊ SỐ LƯỢNG DỮ LIỆU ĐANG CÓ SẴN:");
    console.log("--------------------------------------------------");
    console.log(`🏢 Số lượng Chi nhánh (Branch): ${branchCount}`);
    console.log(`👤 Số lượng Tài khoản Quản lý Chi nhánh (Customer): ${customerCount}`);
    console.log(`👷 Số lượng Nhân viên & Quản lý Kho (User): ${userCount}`);
    console.log(`🏷️ Số lượng Danh mục (Category): ${categoryCount}`);
    console.log(`🍎 Số lượng Sản phẩm sỉ (Product): ${productCount}`);
    console.log("--------------------------------------------------");

    if (productCount > 0) {
      console.log("🎉 DATABASE ĐÃ CÓ ĐẦY ĐỦ DỮ LIỆU SẴN SÀNG ONLINE!");
    } else {
      console.log("⚠️ DATABASE HIỆN ĐANG TRỐNG RỖNG!");
    }

  } catch (error) {
    console.error("❌ Lỗi kết nối hoặc kiểm tra database:");
    console.error(error);
  } finally {
    await AppDataSource.destroy();
    console.log("🔌 Đã ngắt kết nối cơ sở dữ liệu.");
  }
}

check();
