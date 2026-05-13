import "reflect-metadata";
import { AppDataSource } from "./config/DataSource";
import { Location } from "./Entity/Location";
import { Category } from "./Entity/Category";
import { Product } from "./Entity/Product";
import { Branch } from "./Entity/Branch";
import { Customer } from "./Entity/Customer";
import { User, UserRole } from "./Entity/User";
import { Order, OrderStatus } from "./Entity/Order";
import { OrderDetail } from "./Entity/OrderDetail";
import { PickingTask, PickingTaskStatus } from "./Entity/PickingTask";
import { Container, ContainerStatus } from "./Entity/Container";
import { ContainerItem, ContainerItemStatus } from "./Entity/ContainerItem";
import * as bcrypt from "bcrypt";

async function seed() {
  try {
    console.log("🚀 Đang khởi tạo kết nối cơ sở dữ liệu...");
    await AppDataSource.initialize();
    console.log("✅ Kết nối cơ sở dữ liệu thành công!");

    // 1. Tạo Hash Password mẫu bằng Bcrypt
    const saltRounds = 10;
    const defaultPassword = "Abc@123"; // Mật khẩu mặc định cho tất cả tài khoản demo
    const hashedPassword = bcrypt.hashSync(defaultPassword, saltRounds);

    console.log(`🔑 Mật khẩu demo: "${defaultPassword}"`);
    console.log(`🔒 Chuỗi Hash Bcrypt mẫu: "${hashedPassword}"`);

    // 1.5. Dọn dẹp dữ liệu cũ để chạy lại an toàn
    console.log("🧹 Đang dọn dẹp dữ liệu cũ...");
    await AppDataSource.manager.createQueryBuilder().delete().from(ContainerItem).execute();
    await AppDataSource.manager.createQueryBuilder().delete().from(Container).execute();
    await AppDataSource.manager.createQueryBuilder().delete().from(PickingTask).execute();
    await AppDataSource.manager.createQueryBuilder().delete().from(OrderDetail).execute();
    await AppDataSource.manager.createQueryBuilder().delete().from(Order).execute();
    await AppDataSource.manager.createQueryBuilder().delete().from(Customer).execute();
    await AppDataSource.manager.createQueryBuilder().delete().from(Branch).execute();
    await AppDataSource.manager.createQueryBuilder().delete().from(Product).execute();
    await AppDataSource.manager.createQueryBuilder().delete().from(Category).execute();
    await AppDataSource.manager.createQueryBuilder().delete().from(Location).execute();
    await AppDataSource.manager.createQueryBuilder()
      .delete()
      .from(User)
      .where("username IN (:...usernames)", { usernames: ["admin", "staff01", "staff02"] })
      .execute();
    console.log("✅ Dọn dẹp dữ liệu cũ hoàn tất!");

    // 2. Tạo Locations (Vị trí khu vực trong kho)
    console.log("\n📦 Đang tạo khu vực lưu kho (Locations)...");
    const coldLocation = new Location({
      code: "ZONE-COLD-01",
      name: "Khu vực Lạnh - Trái cây & Rau củ",
      description: "Nhiệt độ ổn định 5-10 độ C, bảo quản thực phẩm tươi sống.",
    });
    const dryLocation = new Location({
      code: "ZONE-DRY-01",
      name: "Khu khô - Đồ gia vị sỉ",
      description: "Nhiệt độ thường, khô ráo, chuyên chứa hàng thùng đóng chai.",
    });
    await AppDataSource.manager.save([coldLocation, dryLocation]);

    // 3. Tạo Categories (30 danh mục) & 4. Products (210 sản phẩm sỉ với ảnh Unsplash thực tế)
    console.log("🏷️ Đang tạo danh mục hàng hóa (Categories) và sản phẩm (Products)...");

    const categoryTemplates = [
      { prefix: "Trái cây", items: ["Việt Nam sỉ", "Nhập khẩu cao cấp", "Hữu cơ VietGAP", "Sấy dẻo đóng hộp"], img: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=400&q=80", isCold: true },
      { prefix: "Rau củ", items: ["Lá xanh Đà Lạt", "Củ quả tươi sạch", "Nấm ăn các loại", "Gia vị hành tỏi"], img: "https://images.unsplash.com/photo-1566385101042-1a0104b2d37b?auto=format&fit=crop&w=400&q=80", isCold: true },
      { prefix: "Thịt sống", items: ["Heo sạch mỗi ngày", "Bò nhập thượng hạng", "Gia cầm tươi chuẩn", "Trứng sạch VietGAP"], img: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=400&q=80", isCold: true },
      { prefix: "Thủy hải sản", items: ["Tôm cua tươi sống", "Cá biển sỉ loại A", "Cá sông hồ tự nhiên", "Mực bạch tuộc tươi"], img: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80", isCold: true },
      { prefix: "Bơ sữa", items: ["Sữa tươi đóng hộp", "Sữa chua nguyên chất", "Phô mai nhập sỉ", "Váng sữa trẻ em"], img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80", isCold: true },
      { prefix: "Đồ uống sỉ", items: ["Nước ngọt đóng chai", "Nước khoáng tinh khiết", "Bia thùng nhập khẩu", "Nước ép tươi sỉ"], img: "https://images.unsplash.com/photo-1527960656306-ff3a2db6b214?auto=format&fit=crop&w=400&q=80", isCold: false },
      { prefix: "Đồ gia vị sỉ", items: ["Nước tương đóng thùng", "Nước mắm truyền thống", "Dầu ăn thực vật sỉ", "Sốt chấm lẩu"], img: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80", isCold: false },
      { prefix: "Đồ khô", items: ["Gạo ngon dẻo sỉ", "Mì ăn liền thùng", "Bột mì & Bột chiên", "Đồ hộp ăn liền"], img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80", isCold: false }
    ];

    let categoryCount = 0;
    let productCount = 0;
    let sampleProductForOrder: Product | null = null;

    for (const template of categoryTemplates) {
      for (const subItem of template.items) {
        if (categoryCount >= 30) break; // Chỉ lấy đúng 30 Categories

        const categoryName = `${template.prefix} ${subItem}`;
        const category = new Category({
          name: categoryName,
          description: `Danh mục sỉ nhóm hàng ${categoryName} chất lượng cao.`,
          locationId: template.isCold ? coldLocation.id : dryLocation.id,
        });

        const savedCategory = await AppDataSource.manager.save(category);
        categoryCount++;

        // Tạo 7 sản phẩm cho mỗi Category -> Tổng cộng 30 * 7 = 210 sản phẩm
        for (let i = 1; i <= 7; i++) {
          const wholesalePrices = [45000, 65000, 85000, 120000, 150000, 240000, 320000];
          const discountOptions = [0, 5, 10, 15];
          const price = wholesalePrices[i - 1];
          const discount = discountOptions[i % discountOptions.length];

          const product = new Product({
            name: `${categoryName} - Hạng Sỉ #${i}`,
            price: price,
            discount: discount,
            image: `${template.img}&sig=${categoryCount}_${i}`, // Thêm sig để Unsplash trả về ảnh ngẫu nhiên nhưng đúng thể loại
            description: `Sản phẩm đóng gói/đóng thùng sỉ ${categoryName} chuyên cung cấp cho chuỗi 144 siêu thị Kingfood.`,
            categoryId: savedCategory.id,
          });

          const savedProduct = await AppDataSource.manager.save(product);
          productCount++;

          if (!sampleProductForOrder) {
            sampleProductForOrder = savedProduct;
          }
        }
      }
    }

    console.log(`✅ Đã tạo thành công ${categoryCount} Categories và ${productCount} Products với ảnh online chất lượng cao!`);

    // 5. Tạo Branches (144 Chi nhánh Kingfood)
    console.log("🏢 Đang tạo danh sách 144 chi nhánh (Branches)...");
    const districts = [
      "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11", "Quận 12",
      "Bình Thạnh", "Gò Vấp", "Phú Nhuận", "Tân Bình", "Tân Phú", "Thủ Đức", "Bình Tân",
      "Bình Chánh", "Hóc Môn", "Nhà Bè", "Thủ Dầu Một", "Dĩ An", "Thuận An", "Biên Hòa"
    ];
    const streets = [
      "Nguyễn Thị Thập", "Lê Văn Sỹ", "Nguyễn Đình Chiểu", "Hai Bà Trưng", "Nguyễn Huệ", 
      "Cách Mạng Tháng Tám", "Võ Văn Tần", "Võ Thị Sáu", "Nguyễn Kiệm", "Nguyễn Trãi", 
      "Phạm Văn Đồng", "Lê Quang Định", "Phan Văn Trị", "Quang Trung", "Điện Biên Phủ", 
      "Xô Viết Nghệ Tĩnh", "Hoàng Văn Thụ", "Trường Chinh", "Âu Cơ", "Lạc Long Quân", 
      "Lý Thường Kiệt", "Tô Hiến Thành", "Ba Tháng Hai", "Cao Thắng", "Phan Đình Phùng", 
      "Trần Hưng Đạo", "Nguyễn Tất Thành", "Huỳnh Tấn Phát", "Nguyễn Văn Linh"
    ];

    const branchesToSave: Branch[] = [];
    for (let i = 1; i <= 144; i++) {
      const street = streets[i % streets.length];
      const district = districts[i % districts.length];
      const address = `${100 + i} ${street}, ${district}, TP.HCM`;
      const branchName = `Kingfood ${street} (${district})`;
      
      branchesToSave.push(new Branch({
        name: branchName,
        address: address,
        phone: `02873${String(100000 + i).substring(1)}`,
      }));
    }
    const savedBranches = await AppDataSource.manager.save(branchesToSave);
    console.log(`✅ Đã lưu thành công ${savedBranches.length} chi nhánh!`);

    // 6. Tạo 144 Customers (Tài khoản Quản lý tương ứng cho từng chi nhánh)
    console.log("👤 Đang tạo 144 tài khoản Quản lý Chi nhánh (Customers)...");
    const customersToSave: Customer[] = [];
    const managersNames = ["Nguyễn Văn", "Trần Thị", "Lê Quang", "Phạm Minh", "Hoàng Kim", "Vũ Đức", "Đặng Ngọc", "Bùi Hữu"];
    const subNames = ["Anh", "Bình", "Cường", "Dũng", "Em", "Phương", "Giang", "Hải", "Khanh", "Linh", "Minh", "Nam", "Oanh", "Phúc", "Quốc", "Sơn", "Tuấn", "Vân", "Vy"];

    for (let i = 0; i < savedBranches.length; i++) {
      const branch = savedBranches[i];
      const firstName = managersNames[i % managersNames.length];
      const lastName = subNames[i % subNames.length];
      const name = `Quản lý ${firstName} ${lastName}`;
      
      customersToSave.push(new Customer({
        branchId: branch.id,
        name: name,
        email: `manager.kf${i + 1}@kingfood.com`,
        password: hashedPassword,
        phone: `090${String(10000000 + i).substring(1)}`,
      }));
    }
    const savedCustomers = await AppDataSource.manager.save(customersToSave);
    console.log(`✅ Đã lưu thành công ${savedCustomers.length} tài khoản Quản lý!`);

    // 7. Tạo Users (Tài khoản Nhân viên & Quản lý của Nhà cung cấp sỉ)
    console.log("👷 Đang tạo tài khoản Nhân viên kho & Quản lý (Users)...");
    const adminUser = new User({
      name: "Quản lý kho tổng (Nhà cung cấp sỉ)",
      email: "admin.warehouse@supplier.com",
      phoneNumber: "0988888888",
      username: "admin",
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    const staff01 = new User({
      name: "Nhân viên Pick hàng Ca Sáng",
      email: "staff01@supplier.com",
      phoneNumber: "0911111111",
      username: "staff01",
      password: hashedPassword,
      role: UserRole.STAFF,
    });
    const staff02 = new User({
      name: "Nhân viên Pick hàng Ca Chiều",
      email: "staff02@supplier.com",
      phoneNumber: "0922222222",
      username: "staff02",
      password: hashedPassword,
      role: UserRole.STAFF,
    });
    await AppDataSource.manager.save([adminUser, staff01, staff02]);

    // 8. Tạo Order & OrderDetails mẫu (Đơn sỉ từ Kingfood Q7)
    console.log("🛒 Đang tạo Đơn hàng mẫu (Orders)...");
    const sampleOrder = new Order({
      branchId: savedBranches[0].id,
      customerId: savedCustomers[0].id,
      status: OrderStatus.PROCESSING,
      totalPrice: 2000000, 
      address: savedBranches[0].address,
    });
    await AppDataSource.manager.save(sampleOrder);

    const orderDetailApple = new OrderDetail({
      orderId: sampleOrder.id,
      productId: sampleProductForOrder!.id,
      quantity: 100,
      price: sampleProductForOrder!.price,
    });
    await AppDataSource.manager.save(orderDetailApple);

    // 9. Tạo PickingTasks mẫu (Chia việc cho nhân viên)
    console.log("📋 Đang tạo Nhiệm vụ Pick hàng mẫu (PickingTasks)...");
    const task1 = new PickingTask({
      orderId: sampleOrder.id,
      productId: sampleProductForOrder!.id,
      assignedUserId: staff01.id,
      quantityToPick: 50,
      quantityPicked: 50, // Đã hoàn thành pick
      status: PickingTaskStatus.COMPLETED,
      location: "Kệ A-12",
    });
    const task2 = new PickingTask({
      orderId: sampleOrder.id,
      productId: sampleProductForOrder!.id,
      assignedUserId: staff02.id,
      quantityToPick: 50,
      quantityPicked: 0, // Đang chờ pick
      status: PickingTaskStatus.PENDING,
      location: "Kệ A-12",
    });
    await AppDataSource.manager.save([task1, task2]);

    // 10. Tạo Containers & ContainerItems mẫu (Sản phẩm đã đóng thùng bởi nhân viên)
    console.log("📦 Đang tạo Container & Sản phẩm đã pick mẫu...");
    const container1 = new Container({
      code: "CON-Q7-001",
      name: "Thùng hàng Táo Đỏ Kingfood Q7",
      capacity: 100,
      currentUsage: 50,
      status: ContainerStatus.ACTIVE,
    });
    await AppDataSource.manager.save(container1);

    const containerItem1 = new ContainerItem({
      containerId: container1.id,
      orderId: sampleOrder.id,
      productId: sampleProductForOrder!.id,
      quantity: 50,
      pickedById: staff01.id,
      status: ContainerItemStatus.GOOD,
    });
    await AppDataSource.manager.save(containerItem1);

    console.log("\n🎉 ĐÃ TẠO TOÀN BỘ DATA MẪU THÀNH CÔNG VÀ AN TOÀN!");
    console.log("--------------------------------------------------");
    console.log("📋 THÔNG TIN TÀI KHOẢN ĐỂ BẠN ĐĂNG NHẬP THỬ:");
    console.log("1. Tài khoản Quản lý Chi nhánh (Ví dụ tài khoản 1):");
    console.log("   - Email: manager.kf1@kingfood.com");
    console.log("   - Password: Abc@123");
    console.log("2. Tài khoản Quản lý Tổng nhà cung cấp (Phân ca/Truy vết):");
    console.log("   - Username: admin");
    console.log("   - Password: Abc@123");
    console.log("3. Tài khoản Nhân viên Kho (Nhận việc/Pick hàng):");
    console.log("   - Username: staff01 (hoặc staff02)");
    console.log("   - Password: Abc@123");
    console.log("--------------------------------------------------");

  } catch (error) {
    console.error("❌ Lỗi trong quá trình tạo data mẫu:");
    console.error(error);
  } finally {
    await AppDataSource.destroy();
    console.log("🔌 Đã ngắt kết nối cơ sở dữ liệu.");
  }
}

seed();
