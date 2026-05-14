import { AppDataSource } from "./config/DataSource";
import { Branch } from "./Entity/Branch";
import { Customer } from "./Entity/Customer";
import { User } from "./Entity/User";

async function run() {
  console.log("🚀 Bắt đầu quy trình Sửa lỗi Inconsistent Data & Khôi phục Master Data...");
  
  // 1. Kết nối không synchronize để đọc dữ liệu hiện có
  AppDataSource.setOptions({ synchronize: false });
  await AppDataSource.initialize();
  
  // 1. Sao lưu Master Data (Dùng Query Builder hoặc Raw Query để tránh lỗi Entity mismatch)
  const branches = await AppDataSource.manager.find(Branch);
  const customers = await AppDataSource.manager.createQueryBuilder(Customer, "customer")
    .addSelect("customer.password")
    .getMany();
    
  // Backup users via raw query to be safe
  const usersRaw = await AppDataSource.query(`SELECT * FROM KingFood_users WHERE deleted_at IS NULL`);
  const users = usersRaw.map((u: any) => ({
    ...u,
    phoneNumber: u.phone_number,
    dateOfBirth: u.date_of_birth,
    assignedLocationId: u.assigned_location_id || null, // Might be assigned_zone in old DB
    assignedZone: u.assigned_zone || null
  }));
    
  console.log(`✅ Đã sao lưu: ${branches.length} Chi nhánh, ${customers.length} Quản lý, ${users.length} Nhân viên.`);

  // 2. Xóa sạch các bảng để làm mới schema
  console.log("🧹 Đang dọn dẹp sạch các bảng lỗi để tái cấu trúc...");
  await AppDataSource.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  
  const tables = [
    "KingFood_container_items",
    "KingFood_containers",
    "KingFood_incident_reports",
    "KingFood_picking_tasks",
    "KingFood_order_details",
    "KingFood_orders",
    "KingFood_products",
    "KingFood_categories",
    "KingFood_locations",
    "KingFood_customers",
    "KingFood_branches",
    "KingFood_users"
  ];
  
  for (const table of tables) {
    await AppDataSource.query(`DROP TABLE IF EXISTS ${table};`);
  }
  await AppDataSource.query(`SET FOREIGN_KEY_CHECKS = 1;`);
  console.log("✅ Đã xóa toàn bộ các bảng cũ.");

  // 3. Reconnect với synchronize: true để tạo lại bảng sạch 100%
  await AppDataSource.destroy();
  AppDataSource.setOptions({ synchronize: true });
  await AppDataSource.initialize();
  console.log("🛠 Đã tái tạo lại cấu trúc Database sạch (Clean Schema).");

  // 4. Khôi phục lại Master Data (với ID chuẩn từ 1)
  console.log("📥 Đang khôi phục lại Master Data...");
  
  const branchIdMap: Record<number, number> = {};
  const newBranches = branches.map((b, i) => {
    const newId = i + 1;
    branchIdMap[b.id] = newId;
    return { ...b, id: newId };
  });

  const newCustomers = customers.map((c, i) => ({
    ...c,
    id: i + 1,
    branchId: branchIdMap[c.branchId] || c.branchId
  }));

  const staffUsers = users.filter(u => u.role === "staff");
  const newUsers = users.map((u, i) => {
    let assignedLocationId = (u as any).assignedLocationId || null;
    if (u.role === "staff") {
      const staffIdx = staffUsers.findIndex(s => s.id === u.id);
      assignedLocationId = (staffIdx % 4) + 1;
    }
    const { assignedZone, ...userToSave } = u as any;
    return { ...userToSave, id: i + 1, assignedLocationId };
  });

  await AppDataSource.createQueryBuilder().insert().into(Branch).values(newBranches).execute();
  await AppDataSource.createQueryBuilder().insert().into(Customer).values(newCustomers).execute();
  await AppDataSource.createQueryBuilder().insert().into(User).values(newUsers).execute();
  
  console.log("✅ Khôi phục Master Data thành công!");
  await AppDataSource.destroy();
  
  console.log("🎉 ĐÃ HOÀN TẤT FIX LỖI! Bây giờ Server Render sẽ có thể khởi động bình thường.");
}

run().catch(err => {
  console.error("❌ Lỗi trong quá trình xử lý:", err);
});
