import { AppDataSource } from "./config/DataSource";

async function reset() {
  console.log("🧨 Đang thực hiện Reset Database toàn diện...");
  
  // 1. Kết nối không synchronize
  AppDataSource.setOptions({ synchronize: false });
  await AppDataSource.initialize();
  
  // 2. Lấy danh sách tất cả các bảng
  const tables: any[] = await AppDataSource.query(`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = '${process.env.DB_NAME || "defaultdb"}'
  `);

  console.log(`🧹 Tìm thấy ${tables.length} bảng. Đang tiến hành xóa sạch...`);
  
  await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 0;");
  for (const table of tables) {
    const tableName = table.TABLE_NAME || table.table_name;
    console.log(`   - Đang xóa bảng: ${tableName}`);
    await AppDataSource.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
  await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 1;");
  
  console.log("✅ Đã xóa sạch toàn bộ các bảng.");
  
  // 3. Reconnect với synchronize: true để tạo lại Schema chuẩn từ đầu
  await AppDataSource.destroy();
  console.log("🛠 Đang tái tạo cấu trúc Schema chuẩn từ Entity...");
  AppDataSource.setOptions({ synchronize: true });
  await AppDataSource.initialize();
  
  console.log("🎉 DATABASE ĐÃ SẠCH VÀ CHUẨN SCHEMA! Bây giờ bạn có thể chạy seed.");
  await AppDataSource.destroy();
}

reset().catch(console.error);
