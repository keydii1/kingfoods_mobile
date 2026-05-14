import { AppDataSource } from "./config/DataSource";
import { Branch } from "./Entity/Branch";
import { Customer } from "./Entity/Customer";
import { User } from "./Entity/User";

async function run() {
  AppDataSource.setOptions({ synchronize: false });
  await AppDataSource.initialize();
  console.log("📍 Đang đọc dữ liệu nền hiện tại...");
  
  const branches = await AppDataSource.manager.find(Branch);
  const customers = await AppDataSource.manager.createQueryBuilder(Customer, "customer")
    .addSelect("customer.password") // Ensure password is fetched to restore it correctly
    .getMany();
  
  // Read users using raw query to bypass entity property mapping errors
  const usersRaw = await AppDataSource.query(`SELECT * FROM KingFood_users WHERE deleted_at IS NULL`);
  // Convert snake_case to camelCase manually for what we need, or just use as is
  const users = usersRaw.map((u: any) => ({
    ...u,
    phoneNumber: u.phone_number,
    dateOfBirth: u.date_of_birth,
    assignedZone: u.assigned_zone
  }));

  console.log(`Đã đọc ${branches.length} Branches, ${customers.length} Customers, ${users.length} Users.`);

  // Mapping old IDs to new IDs
  const branchIdMap: Record<number, number> = {};
  
  const newBranches = branches.map((b, i) => {
    const newId = i + 1;
    branchIdMap[b.id] = newId;
    return { ...b, id: newId };
  });

  const newCustomers = customers.map((c, i) => {
    return { 
      ...c, 
      id: i + 1,
      branchId: branchIdMap[c.branchId] || c.branchId
    };
  });

  const staffUsers = users.filter((u) => u.role === "staff");

  const newUsers = users.map((u, i) => {
    let assignedLocationId = (u as any).assignedLocationId || null;
    if (u.role === "staff") {
      const staffIndex = staffUsers.findIndex((s) => s.id === u.id);
      assignedLocationId = (staffIndex % 4) + 1;
    }
    // Remove assignedZone if it exists in the object
    const { assignedZone, ...userToSave } = u as any;
    return { ...userToSave, id: i + 1, assignedLocationId };
  });

  console.log("🧹 Xóa toàn bộ dữ liệu hệ thống...");
  await AppDataSource.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  
  // Drop and recreate user table to fix column type
  await AppDataSource.query(`DROP TABLE IF EXISTS KingFood_users;`);
  
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
    "KingFood_branches"
  ];
  
  for (const table of tables) {
    await AppDataSource.query(`TRUNCATE TABLE ${table};`);
  }

  console.log("🛠 Đang tái cấu trúc lại bảng Users...");
  AppDataSource.setOptions({ synchronize: true });
  await AppDataSource.synchronize(); // This will recreate the dropped User table with new schema
  
  console.log("📥 Khôi phục lại dữ liệu nền với ID bắt đầu từ 1...");
  
  // Insert Users
  if (newUsers.length > 0) {
    await AppDataSource.createQueryBuilder().insert().into(User).values(newUsers).execute();
  }
  
  // Insert Branches
  if (newBranches.length > 0) {
    await AppDataSource.createQueryBuilder().insert().into(Branch).values(newBranches).execute();
  }
  
  // Insert Customers
  if (newCustomers.length > 0) {
    await AppDataSource.createQueryBuilder().insert().into(Customer).values(newCustomers).execute();
  }

  await AppDataSource.query(`SET FOREIGN_KEY_CHECKS = 1;`);
  console.log("✅ Hoàn tất Reset ID Dữ Liệu Nền!");
  await AppDataSource.destroy();
}

run().catch(e => console.error(e));
