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
import { IncidentReport, IncidentStatus } from "./Entity/IncidentReport";

// Helper to safely chunk array for Cloud DB packet size limits
const chunkArray = (array: any[], chunkSize: number) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

async function seed() {
  try {
    console.log("🚀 Khởi động trình tạo dữ liệu KingFoods Hyper-Seed...");
    await AppDataSource.initialize();
    await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 0;");
    console.log("✅ Kết nối cơ sở dữ liệu thành công!");

    // 1. Dọn dẹp dữ liệu cũ trước khi chạy Bulk Insert sạch
    console.log("🧹 Đang làm sạch dữ liệu các bảng giao dịch...");
    await AppDataSource.manager
      .createQueryBuilder()
      .delete()
      .from(ContainerItem)
      .execute();
    await AppDataSource.manager
      .createQueryBuilder()
      .delete()
      .from(Container)
      .execute();
    await AppDataSource.manager
      .createQueryBuilder()
      .delete()
      .from(IncidentReport)
      .execute();
    await AppDataSource.manager
      .createQueryBuilder()
      .delete()
      .from(PickingTask)
      .execute();
    await AppDataSource.manager
      .createQueryBuilder()
      .delete()
      .from(OrderDetail)
      .execute();
    await AppDataSource.manager
      .createQueryBuilder()
      .delete()
      .from(Order)
      .execute();
    await AppDataSource.manager
      .createQueryBuilder()
      .delete()
      .from(Product)
      .execute();
    await AppDataSource.manager
      .createQueryBuilder()
      .delete()
      .from(Category)
      .execute();
    await AppDataSource.manager
      .createQueryBuilder()
      .delete()
      .from(Location)
      .execute();
    
    // Reset AUTO_INCREMENT counters to 1
    const tables = [
      "KingFood_container_items",
      "KingFood_containers",
      "KingFood_incident_reports",
      "KingFood_picking_tasks",
      "KingFood_order_details",
      "KingFood_orders",
      "KingFood_products",
      "KingFood_categories",
      "KingFood_locations"
    ];
    for (const table of tables) {
      await AppDataSource.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
    }

    console.log("✅ Làm sạch dữ liệu và reset ID hoàn tất!");

    // 2. Bulk Insert Locations (Gán ID tĩnh 1 đến 4 dựa trên UserZone)
    console.log("📍 Đang tạo khu vực kho (Locations)...");
    const locations = [
      {
        id: 1,
        code: "CANDY",
        name: "🍬 Bánh kẹo",
        description: "Khu vực lưu trữ các loại bánh kẹo, ngũ cốc sỉ.",
      },
      {
        id: 2,
        code: "BEVERAGE",
        name: "🥤 Đồ uống",
        description: "Khu vực bia thùng, nước giải khát, sữa đóng hộp.",
      },
      {
        id: 3,
        code: "CHEMICAL",
        name: "🧴 Hóa phẩm",
        description: "Khu vực chất tẩy rửa, dầu gội, mỹ phẩm gia dụng.",
      },
      {
        id: 4,
        code: "PROMOTION",
        name: "🎁 KM",
        description: "Khu vực lưu trữ hàng khuyến mãi, quà tặng kèm.",
      },
    ];
    await AppDataSource.createQueryBuilder()
      .insert()
      .into(Location)
      .values(locations)
      .execute();
    console.log("✅ Đã insert 4 Locations thành công!");

    // 3. Chuẩn bị Categories & Products data
    const categoryTemplates = [
      {
        prefix: "Bánh kẹo",
        items: [
          "Bánh quy sỉ",
          "Kẹo mềm hoa quả",
          "Sô-cô-la ngoại",
          "Snack & ngũ cốc",
        ],
        keywords: "candy,biscuit,snack",
        locId: 1,
      },
      {
        prefix: "Đồ uống",
        items: [
          "Bia thùng nhập",
          "Nước giải khát",
          "Nước ép đóng hộp",
          "Trà sữa sỉ",
        ],
        keywords: "beverage,juice,drink",
        locId: 2,
      },
      {
        prefix: "Hóa mỹ phẩm",
        items: [
          "Dầu gội xả sỉ",
          "Nước giặt xả",
          "Tẩy rửa gia dụng",
          "Xà phòng tắm",
        ],
        keywords: "soap,shampoo,detergent",
        locId: 3,
      },
      {
        prefix: "Khuyến mãi",
        items: ["Combo Giftbox", "Hàng tặng kèm", "Mẫu thử VIP", "Đồ lưu niệm"],
        keywords: "gift,promotion,box",
        locId: 4,
      },
      {
        prefix: "Ăn vặt sỉ",
        items: [
          "Hạt sấy khô",
          "Trái cây dẻo",
          "Mực tẩm gia vị",
          "Rong biển ăn liền",
        ],
        keywords: "snack,food,grocery",
        locId: 1,
      },
      {
        prefix: "Đồ giải khát",
        items: [
          "Nước khoáng chai",
          "Nước tăng lực",
          "Bia lon nội địa",
          "Rượu vang tiệc",
        ],
        keywords: "drink,soda,beverage",
        locId: 2,
      },
      {
        prefix: "Hóa phẩm phụ",
        items: [
          "Khăn giấy sỉ",
          "Nước lau sàn",
          "Xịt thơm phòng",
          "Bột giặt gói",
        ],
        keywords: "cleaning,household,detergent",
        locId: 3,
      },
      {
        prefix: "Quà tặng KM",
        items: ["Ly cốc in logo", "Túi vải Eco", "Lịch tết sỉ", "Gấu bông KM"],
        keywords: "gift,souvenir,promotion",
        locId: 4,
      },
    ];

    const categoriesToSave: any[] = [];
    const productsToSave: any[] = [];
    let catId = 1;
    let prodId = 1;

    for (const template of categoryTemplates) {
      for (const subItem of template.items) {
        if (catId > 30) break; // Giới hạn đúng 30 Categories theo đề bài

        const categoryName = `${template.prefix} ${subItem}`;
        categoriesToSave.push({
          id: catId,
          name: categoryName,
          description: `Danh mục sỉ nhóm hàng ${categoryName} chất lượng cao.`,
          locationId: template.locId,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Tạo 7 sản phẩm cho mỗi Category -> Tổng cộng 30 * 7 = 210 sản phẩm
        for (let i = 1; i <= 7; i++) {
          const wholesalePrices = [
            45000, 65000, 85000, 120000, 150000, 240000, 320000,
          ];
          const discountOptions = [0, 5, 10, 15];
          const price = wholesalePrices[i - 1];
          const discount = discountOptions[i % discountOptions.length];

          productsToSave.push({
            id: prodId++,
            name: `${categoryName} - Hạng Sỉ #${i}`,
            price: price,
            discount: discount,
            image: `https://loremflickr.com/640/480/${template.keywords}?lock=${prodId}`,
            description: `Sản phẩm đóng gói sỉ ${categoryName} chuyên cung cấp cho chuỗi 144 siêu thị Kingfood.`,
            categoryId: catId,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        catId++;
      }
    }

    console.log(`📤 Đang Bulk Insert ${categoriesToSave.length} Categories...`);
    await AppDataSource.createQueryBuilder()
      .insert()
      .into(Category)
      .values(categoriesToSave)
      .execute();

    console.log(`📤 Đang Bulk Insert ${productsToSave.length} Products...`);
    await AppDataSource.createQueryBuilder()
      .insert()
      .into(Product)
      .values(productsToSave)
      .execute();
    console.log("✅ Đã nạp Categories và Products thành công!");

    // Load tất cả sản phẩm từ cơ sở dữ liệu để dùng cho Đơn hàng & Chi tiết, đảm bảo dữ liệu an toàn tuyệt đối
    const allProducts = await AppDataSource.manager.find(Product, {
      relations: ["category"],
    });

    // 4. Load thông tin các bảng đã tồn tại để phục vụ liên kết
    console.log(
      "🏢 Đang ánh xạ dữ liệu từ các bảng hiện có (Branches, Customers, Users)...",
    );
    const savedBranches = await AppDataSource.manager.find(Branch);
    const savedCustomers = await AppDataSource.manager.find(Customer);
    const savedUsers = await AppDataSource.manager.find(User);

    if (
      savedBranches.length === 0 ||
      savedCustomers.length === 0 ||
      savedUsers.length === 0
    ) {
      throw new Error(
        "❌ Không tìm thấy dữ liệu nền trong bảng Branch, Customer hoặc User!",
      );
    }

    const staffUsers = savedUsers.filter((u) => u.role === UserRole.STAFF);
    if (staffUsers.length === 0) {
      throw new Error(
        "❌ Hệ thống chưa có tài khoản nhân viên kho (role STAFF)!",
      );
    }
    console.log(
      `   🎯 Tìm thấy ${savedBranches.length} chi nhánh, ${savedCustomers.length} quản lý, và ${staffUsers.length} nhân viên kho.`,
    );

    // 5. Tạo 2,000 Đơn hàng (Orders) & Chi tiết đơn hàng (OrderDetails)
    console.log("🛒 Bắt đầu khởi tạo 2,000 Đơn hàng (Orders) sỉ...");
    const ordersToSave: any[] = [];
    const orderDetailsToSave: any[] = [];
    let orderDetailId = 1;

    for (let o = 1; o <= 2000; o++) {
      const branchIdx = o % savedBranches.length;
      const branch = savedBranches[branchIdx];

      const statusList = [
        OrderStatus.PENDING,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
      ];
      const randomStatus = statusList[o % statusList.length];

      // Chọn ngẫu nhiên 3 đến 8 sản phẩm từ kho cho mỗi đơn hàng để dữ liệu thực tế hơn
      const distinctProductIndices = new Set<number>();
      const numberOfItems = Math.floor(Math.random() * 6) + 3;
      while (distinctProductIndices.size < numberOfItems) {
        // Lấy ngẫu nhiên ID từ danh sách allProducts đã load từ DB
        const randomProduct =
          allProducts[Math.floor(Math.random() * allProducts.length)];
        distinctProductIndices.add(randomProduct.id);
      }

      let totalOfOrder = 0;
      const orderStaffIds = new Set<number>();
      for (const prodIdVal of distinctProductIndices) {
        const product = allProducts.find((p) => p.id === prodIdVal);
        if (!product) continue;

        const quantity = Math.floor(Math.random() * 20) + 1; // Từ 1 đến 20 thùng
        const price = Number(product.price); // Ép kiểu Number để cộng giá tiền chuẩn xác
        totalOfOrder += price * quantity;

        const assignedStaff =
          staffUsers[Math.floor(Math.random() * staffUsers.length)];
        orderStaffIds.add(assignedStaff.id);

        orderDetailsToSave.push({
          id: orderDetailId++,
          orderId: o,
          productId: prodIdVal,
          quantity: quantity,
          price: price,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      ordersToSave.push({
        id: o,
        customerId: branch.id, // Đây chính là FK branch_id trong DB dựa trên thiết kế Entity!
        status: randomStatus,
        totalPrice: totalOfOrder,
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
        ), // Phân bổ 30 ngày để Dashboard hiển thị đẹp
        updatedAt: new Date(),
      });
    }

    console.log(`📤 Đang Bulk Insert 1,000 Orders lên Cloud...`);
    const orderChunks = chunkArray(ordersToSave, 200);
    for (const chunk of orderChunks) {
      await AppDataSource.createQueryBuilder()
        .insert()
        .into(Order)
        .values(chunk)
        .execute();
    }
    console.log("✅ Bulk Insert 2,000 Orders hoàn tất.");

    console.log(
      `📤 Đang Bulk Insert ${orderDetailsToSave.length} OrderDetails lên Cloud...`,
    );
    const detailChunks = chunkArray(orderDetailsToSave, 500);
    let batchCount = 1;
    for (const chunk of detailChunks) {
      await AppDataSource.createQueryBuilder()
        .insert()
        .into(OrderDetail)
        .values(chunk)
        .execute();
      if (batchCount % 10 === 0 || batchCount === detailChunks.length) {
        console.log(
          `   ⏳ Tiến độ: Đã insert ${Math.min(batchCount * 500, orderDetailsToSave.length)} / ${orderDetailsToSave.length} chi tiết...`,
        );
      }
      batchCount++;
    }
    console.log("✅ Bulk Insert OrderDetails thành công!");

    // 6. Phân công Nhiệm vụ Lấy hàng (PickingTasks) mẫu cho 30 đơn hàng Processing
    console.log("📋 Đang sinh các nhiệm vụ Pick hàng mẫu (PickingTasks)...");
    const pickingTasksToSave: any[] = [];
    let taskCounter = 1;

    // Sinh nhiệm vụ cho toàn bộ các đơn hàng đã qua bước PENDING (PROCESSING, SHIPPED, DELIVERED)
    const taskOrders = ordersToSave
      .filter((o) => o.status !== OrderStatus.PENDING);
    for (const order of taskOrders) {
      const details = orderDetailsToSave.filter((d) => d.orderId === order.id);
      for (const detail of details) {
        const isCompleted = Math.random() > 0.4;
        const product = allProducts.find((p) => p.id === detail.productId);
        const assignedStaff = staffUsers[Math.floor(Math.random() * staffUsers.length)];

        pickingTasksToSave.push({
          id: taskCounter++,
          orderDetailId: detail.id,
          assignedUserId: assignedStaff.id,
          quantityToPick: detail.quantity,
          quantityPicked: isCompleted ? detail.quantity : 0,
          status: isCompleted
            ? PickingTaskStatus.COMPLETED
            : PickingTaskStatus.PENDING,
          locationId: product?.category?.locationId || 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    if (pickingTasksToSave.length > 0) {
      const taskChunks = chunkArray(pickingTasksToSave, 200);
      for (const chunk of taskChunks) {
        await AppDataSource.createQueryBuilder()
          .insert()
          .into(PickingTask)
          .values(chunk)
          .execute();
      }
      console.log(
        `✅ Đã insert thành công ${pickingTasksToSave.length} PickingTasks!`,
      );
    }

    // 6.5. Generate mock Incident Reports
    console.log("⚠️ Đang sinh các báo cáo sự cố (IncidentReports) mẫu...");
    const incidentsToSave: any[] = [];
    let incidentCounter = 1;

    // FETCH tasks from DB so we have the real auto-incremented IDs
    const pendingTasks = await AppDataSource.manager.find(PickingTask, {
      where: { status: PickingTaskStatus.PENDING },
      take: 15,
    });

    const reasons = [
      "Kệ trống",
      "Hàng hỏng",
      "Sai vị trí",
      "Mất mã vạch",
      "Hàng quá hạn",
    ];

    for (const task of pendingTasks) {
      const reasonKeywords: Record<string, string> = {
        "Kệ trống": "empty,shelf,warehouse",
        "Hàng hỏng": "damaged,box,warehouse",
        "Sai vị trí": "warehouse,error,logistic",
        "Mất mã vạch": "barcode,scanner,warehouse",
        "Hàng quá hạn": "expired,food,waste"
      };
      
      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      const keywords = reasonKeywords[reason] || "warehouse,incident";

      incidentsToSave.push({
        taskId: task.id,
        reporterId: task.assignedUserId,
        photoUrl: `https://loremflickr.com/640/480/${keywords}?lock=${incidentCounter++}`,
        reason: reason,
        status:
          Math.random() > 0.5
            ? IncidentStatus.PENDING
            : IncidentStatus.RESOLVED,
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000),
        ),
        updatedAt: new Date(),
      });
    }

    if (incidentsToSave.length > 0) {
      await AppDataSource.createQueryBuilder()
        .insert()
        .into(IncidentReport)
        .values(incidentsToSave)
        .execute();
      console.log(
        `✅ Đã insert thành công ${incidentsToSave.length} IncidentReports!`,
      );
    }

    // 7. Tạo Thùng hàng (Containers) & ContainerItems
    console.log("📦 Đang tạo Thùng hàng (Containers) mẫu...");
    const containersToSave: any[] = [];
    for (let c = 1; c <= 25; c++) {
      containersToSave.push({
        id: c,
        code: `CON-KING-${String(c).padStart(3, "0")}`,
        name: `Thùng hàng KingFoods #${c}`,
        capacity: 500,
        currentUsage: 0,
        status: ContainerStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await AppDataSource.createQueryBuilder()
      .insert()
      .into(Container)
      .values(containersToSave)
      .execute();
    console.log(`✅ Đã tạo 25 Thùng hàng rỗng.`);

    console.log(
      "📦 Nạp sản phẩm đã đóng gói vào thùng hàng (ContainerItems)...",
    );
    // Đóng gói thử sản phẩm của các đơn hàng PROCESSING cho các Thùng hàng đầu tiên
    const processingOrders = ordersToSave.filter(o => o.status === OrderStatus.PROCESSING);
    const sampleOrderIds = processingOrders.slice(0, 5).map(o => o.id);
    const containerItemsToSave: any[] = [];
    let contItemCounter = 1;

    for (let i = 0; i < sampleOrderIds.length; i++) {
      const ordId = sampleOrderIds[i];
      const targetContainerId = i + 1;

      // Lấy các PickingTask của đơn hàng này từ bộ nhớ (nhanh và chính xác hơn query)
      const tasksForOrder = pickingTasksToSave.filter(t => {
        const detail = orderDetailsToSave.find(d => d.id === t.orderDetailId);
        return detail && detail.orderId === ordId;
      });

      console.log(`   🔎 Đơn hàng #${ordId}: Khớp được ${tasksForOrder.length} PickingTasks từ bộ nhớ...`);

      let containerUsage = 0;
      for (const task of tasksForOrder) {
        if (task.quantityPicked === 0) task.quantityPicked = task.quantityToPick; // Ensure some quantity
        
        containerUsage += task.quantityPicked;
        containerItemsToSave.push({
          containerId: targetContainerId,
          taskId: task.id,
          quantity: task.quantityPicked,
          status: ContainerItemStatus.GOOD,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      // Cập nhật sức chứa thực tế lên thùng hàng tương ứng
      await AppDataSource.manager.update(Container, targetContainerId, {
        currentUsage: containerUsage,
      });
    }

    if (containerItemsToSave.length > 0) {
      await AppDataSource.createQueryBuilder()
        .insert()
        .into(ContainerItem)
        .values(containerItemsToSave)
        .execute();
      console.log(`✅ Đã đóng gói thành công ${containerItemsToSave.length} món hàng vào Container!`);
    } else {
      console.log("⚠️ Không có món hàng nào được đóng gói vào Container.");
    }

    console.log(
      "\n🎉 CHÚC MỪNG! ĐÃ HYPER-SEED DỮ LIỆU MẪU THÀNH CÔNG VỚI TỐC ĐỘ TỐI ĐA!",
    );
    console.log("------------------------------------------------------------");
    console.log("📊 TÓM TẮT DỮ LIỆU VỪA ĐƯỢC NẠP:");
    console.log(`   🔹 Vị trí kho: 4 Khu vực`);
    console.log(`   🔹 Danh mục sản phẩm: 30 Nhóm`);
    console.log(`   🔹 Tổng sản phẩm sỉ: 210 Sản phẩm`);
    console.log(`   🔹 Số lượng Đơn hàng sỉ: 2,000 Đơn hàng`);
    console.log(
      `   🔹 Số lượng Chi tiết món hàng: ${orderDetailsToSave.length} Dòng sản phẩm`,
    );
    console.log(
      `   🔹 Nhiệm vụ kho (Tasks): ${pickingTasksToSave.length} Nhiệm vụ gán tự động`,
    );
    console.log(`   🔹 Sự cố (Incidents): ${incidentsToSave.length} Báo cáo`);
    console.log(`   🔹 Thùng hàng đã tạo: 25 Thùng hàng`);
    console.log("------------------------------------------------------------");
  } catch (error) {
    console.error("❌ Lỗi nghiêm trọng trong quá trình Hyper-Seed:");
    console.error(error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 1;");
      await AppDataSource.destroy();
    }
    console.log("🔌 Đã ngắt kết nối an toàn với database.");
  }
}

seed();
