import { AppDataSource } from "./config/DataSource";
import { Branch } from "./Entity/Branch";
import { Customer } from "./Entity/Customer";
import { User, UserRole } from "./Entity/User";
import bcrypt from "bcrypt";

async function run() {
  await AppDataSource.initialize();
  console.log("🚀 Bắt đầu khôi phục lại toàn bộ dữ liệu nền (Master Data)...");

  // 1. Khôi phục Users (Admin, Managers, Staff)
  const userCount = await AppDataSource.manager.count(User);
  if (userCount === 0) {
    console.log("👥 Tạo lại 54 người dùng hệ thống...");
    const hashedPassword = await bcrypt.hash("123456", 10);
    const users: any[] = [];
    
    // Admin
    users.push({ id: 1, name: "Siêu Quản Trị", email: "admin@kingfoods.com", username: "admin", password: hashedPassword, role: UserRole.ADMIN });
    // Other accounts (previously managers)
    users.push({ id: 2, name: "Điều phối viên 1", email: "coord1@kingfoods.com", username: "coord1", password: hashedPassword, role: UserRole.STAFF });
    users.push({ id: 3, name: "Điều phối viên 2", email: "coord2@kingfoods.com", username: "coord2", password: hashedPassword, role: UserRole.STAFF });
    
    // 51 Staff
    for (let i = 1; i <= 51; i++) {
      users.push({
        id: i + 3,
        name: `Nhân viên Kho #${i}`,
        email: `staff${i}@kingfoods.com`,
        username: `staff${i}`,
        password: hashedPassword,
        role: UserRole.STAFF,
        assignedLocationId: (i % 4) + 1
      });
    }
    await AppDataSource.createQueryBuilder().insert().into(User).values(users).execute();
    console.log("✅ Đã tạo 54 Users.");
  }

  // 2. Khôi phục Branches & Customers
  const branchCount = await AppDataSource.manager.count(Branch);
  if (branchCount === 0) {
    console.log("🏢 Tạo lại 144 chi nhánh & khách hàng...");
    const branches: any[] = [];
    const customers: any[] = [];
    const hashedPassword = await bcrypt.hash("123456", 10);

    for (let i = 1; i <= 144; i++) {
      branches.push({
        id: i,
        name: `KingFood Mart - Chi nhánh #${i}`,
        code: `KF-BR-${String(i).padStart(3, "0")}`,
        phoneNumber: `090${String(i).padStart(7, "0")}`,
        status: "active"
      });
      customers.push({
        id: i,
        name: `Quản lý CN #${i}`,
        email: `branch_manager${i}@kingfoods.com`,
        username: `manager_cn${i}`,
        password: hashedPassword,
        branchId: i
      });
    }
    await AppDataSource.createQueryBuilder().insert().into(Branch).values(branches).execute();
    await AppDataSource.createQueryBuilder().insert().into(Customer).values(customers).execute();
    console.log("✅ Đã tạo 144 Branches & 144 Customers.");
  }

  console.log("🎉 Hoàn tất khôi phục Master Data! Bây giờ sẽ chạy Seed chính...");
  await AppDataSource.destroy();
}

run().catch(err => console.error(err));
