import "reflect-metadata";
import { AppDataSource } from "./config/DataSource";
import { Location } from "./Entity/Location";
import { Category, Status as CategoryStatus } from "./Entity/Category";
import { Product, ProductStatus } from "./Entity/Product";
import { Branch } from "./Entity/Branch";
import { Customer } from "./Entity/Customer";
import { User, UserRole } from "./Entity/User";
import { Order, OrderStatus } from "./Entity/Order";
import { OrderDetail } from "./Entity/OrderDetail";
import { PickingTask, PickingTaskStatus } from "./Entity/PickingTask";
import { Container, ContainerStatus } from "./Entity/Container";
import { ContainerItem, ContainerItemStatus } from "./Entity/ContainerItem";

async function seed() {
  try {
    console.log("🚀 MEGA SEED V2 - REAL PRODUCTS & SYNCED SCHEMA...");
    await AppDataSource.initialize();
    await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 0;");
    
    const tables = [
      "KingFood_container_items", "KingFood_containers", "KingFood_incident_reports",
      "KingFood_picking_tasks", "KingFood_order_details", "KingFood_orders",
      "KingFood_products", "KingFood_categories", "KingFood_locations"
    ];
    for (const table of tables) {
      await AppDataSource.query(`DELETE FROM ${table}`);
      await AppDataSource.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
    }

    // 1. Locations
    await AppDataSource.manager.save(Location, [
      { id: 1, code: "FRESH", name: "🥦 Thực phẩm tươi" },
      { id: 2, code: "DRY", name: "🥫 Đồ khô & Gia vị" },
      { id: 3, code: "CHEMICAL", name: "🧴 Hóa mỹ phẩm" },
      { id: 4, code: "FROZEN", name: "❄️ Đồ đông lạnh" }
    ]);

    // 2. Categories & Product Templates
    const catTemplates = [
      { 
        name: "Hóa phẩm", 
        desc: "Dầu gội, xà phòng, sữa tắm.", 
        loc: 3, 
        prods: [
          { name: "Dầu gội Head & Shoulders 625ml", price: 155000, img: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=200" },
          { name: "Sữa tắm Lifebuoy Bảo vệ vượt trội 800g", price: 185000, img: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=200" },
          { name: "Xà bông cục Safeguard Trắng tinh khiết", price: 15000, img: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=200" }
        ]
      },
      { 
        name: "Tẩy rửa", 
        desc: "Nước lau sàn, rửa chén.", 
        loc: 3, 
        prods: [
          { name: "Nước rửa chén Sunlight Chanh 3.6kg", price: 95000, img: "https://images.unsplash.com/photo-1584622781564-1d9876a13d00?w=200" },
          { name: "Nước lau sàn Sunlight Hương hoa 3.8kg", price: 85000, img: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=200" },
          { name: "Nước tẩy Javel Mỹ Hảo 1L", price: 18000, img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200" }
        ]
      },
      { 
        name: "Thực phẩm tươi sống", 
        desc: "Thịt bò, trứng gà sạch.", 
        loc: 1, 
        prods: [
          { name: "Thịt ba chỉ bò Mỹ khay 500g", price: 145000, img: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=200" },
          { name: "Trứng gà Ba Huân hộp 10 quả", price: 32000, img: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=200" },
          { name: "Thịt đùi heo VietGAP 500g", price: 85000, img: "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=200" }
        ]
      },
      { 
        name: "Trái cây nội địa", 
        desc: "Xoài, bưởi, cam tươi.", 
        loc: 1, 
        prods: [
          { name: "Bưởi da xanh túi 1.2kg", price: 65000, img: "https://images.unsplash.com/photo-1557800636-894a64c1696f?w=200" },
          { name: "Cam sành túi lưới 2kg", price: 45000, img: "https://images.unsplash.com/photo-1611080626919-7cf5a9dcab5b?w=200" },
          { name: "Xoài Cát Hòa Lộc 1kg", price: 75000, img: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=200" }
        ]
      },
      { 
        name: "Thịt, Cá", 
        desc: "Cá hồi, tôm tươi.", 
        loc: 1, 
        prods: [
          { name: "Filet cá hồi Na Uy 300g", price: 215000, img: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=200" },
          { name: "Tôm thẻ chân trắng size 30 con", price: 185000, img: "https://images.unsplash.com/photo-1559740038-005663738006?w=200" },
          { name: "Mực lá tươi Phan Thiết 500g", price: 250000, img: "https://images.unsplash.com/photo-1534080397700-d9d3008064e2?w=200" }
        ]
      },
      { 
        name: "Đồ đông lạnh", 
        desc: "Cá viên, xúc xích.", 
        loc: 4, 
        prods: [
          { name: "Cá viên CP gói 500g", price: 55000, img: "https://images.unsplash.com/photo-1585238341267-1cfec2046a55?w=200" },
          { name: "Xúc xích Đức Vissan gói 500g", price: 75000, img: "https://images.unsplash.com/photo-1541048612927-85454868f29d?w=200" }
        ]
      },
      { 
        name: "Gia vị & Đồ khô", 
        desc: "Mì gói, dầu ăn.", 
        loc: 2, 
        prods: [
          { name: "Mì Hảo Hảo Tôm Chua Cay thùng 30 gói", price: 115000, img: "https://images.unsplash.com/photo-1612927608555-592d755981ca?w=200" },
          { name: "Dầu đậu nành Simply 2L", price: 125000, img: "https://images.unsplash.com/photo-1474979266404-7eaacbad8a0f?w=200" },
          { name: "Hạt nêm Knorr 900g", price: 82000, img: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=200" }
        ]
      }
    ];

    const catsToInsert: any[] = [];
    for (const temp of catTemplates) {
      catsToInsert.push({ name: temp.name, description: temp.desc, locationId: temp.loc, status: CategoryStatus.ACTIVE });
    }
    const catResult = await AppDataSource.manager.insert(Category, catsToInsert);
    const catIds = catResult.identifiers.map(i => i.id);

    const prodsData: any[] = [];
    for (let i = 0; i < catIds.length; i++) {
      const cid = catIds[i];
      for (const p of catTemplates[i].prods) {
        prodsData.push({ name: p.name, price: p.price, categoryId: cid, status: ProductStatus.ACTIVE, image: p.img });
      }
    }
    await AppDataSource.manager.insert(Product, prodsData);
    const savedProds = await AppDataSource.manager.find(Product);
    const branches = await AppDataSource.manager.find(Branch);
    const staff = await AppDataSource.manager.find(User, { where: { role: UserRole.STAFF } });

    // 3. Orders (1,000 orders)
    console.log("🛒 Bulk generating 1,000 orders...");
    const ordersData: any[] = [];
    for (let i = 0; i < 1000; i++) {
      const branch = branches[i % branches.length];
      const statusList = [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED];
      ordersData.push({ customerId: branch.id, status: statusList[i % statusList.length], totalPrice: 0 });
    }
    const orderResult = await AppDataSource.manager.insert(Order, ordersData);
    const orderIds = orderResult.identifiers.map(i => i.id);

    // 4. OrderDetails (8,000 items) - NO PRICE COLUMN
    console.log("📋 Bulk generating 8,000 order details...");
    const detailsData: any[] = [];
    for (let i = 0; i < 8000; i++) {
      const ordIdx = i % orderIds.length;
      const ordId = orderIds[ordIdx];
      const prod = savedProds[i % savedProds.length];
      const qty = Math.floor(Math.random() * 10) + 1;
      
      detailsData.push({
        orderId: ordId,
        productId: prod.id,
        quantity: qty,
        _tempStatus: ordersData[ordIdx].status,
        _tempCatId: prod.categoryId,
        _tempPrice: prod.price // For total calc in memory
      });
    }
    const detailResult = await AppDataSource.manager.insert(OrderDetail, detailsData.map(d => {
      const { _tempStatus, _tempCatId, _tempPrice, ...rest } = d;
      return rest;
    }));
    const detailIds = detailResult.identifiers.map(i => i.id);

    // Update total price for orders (using product price * quantity)
    console.log("💰 Calculating order total prices...");
    const orderTotals: Record<number, number> = {};
    for (const d of detailsData) {
      const ordId = d.orderId;
      orderTotals[ordId] = (orderTotals[ordId] || 0) + (Number(d._tempPrice) * d.quantity);
    }
    for (const ordId in orderTotals) {
      await AppDataSource.manager.update(Order, ordId, { totalPrice: orderTotals[ordId] });
    }

    // 5. PickingTasks (15,000 tasks)
    console.log("📋 Bulk generating 15,000 tasks...");
    const tasksData: any[] = [];
    for (let i = 0; i < 15000; i++) {
      const detIdx = i % detailIds.length;
      const detId = detailIds[detIdx];
      const det = detailsData[detIdx];
      
      if (det._tempStatus !== OrderStatus.PENDING) {
        const taskStatusRand = Math.random();
        const taskStatus = taskStatusRand > 0.6 ? PickingTaskStatus.COMPLETED : (taskStatusRand > 0.3 ? PickingTaskStatus.PICKING : PickingTaskStatus.PENDING);
        
        let qtyPicked = 0;
        if (taskStatus === PickingTaskStatus.COMPLETED) qtyPicked = det.quantity;
        else if (taskStatus === PickingTaskStatus.PICKING) qtyPicked = Math.max(0, Math.floor(det.quantity / 2));

        tasksData.push({
          orderDetailId: detId,
          assignedUserId: staff[i % staff.length].id,
          quantityToPick: det.quantity,
          quantityPicked: qtyPicked,
          status: taskStatus,
          locationId: det._tempCatId % 4 + 1
        });
      }
    }
    const taskResult = await AppDataSource.manager.insert(PickingTask, tasksData);
    const taskIds = taskResult.identifiers.map(i => i.id);

    // 6. Containers (500)
    console.log("📦 Creating 500 containers...");
    const containersData: any[] = [];
    for (let i = 1; i <= 500; i++) {
      containersData.push({
        code: `KFOOD-CON-${String(i).padStart(3, "0")}`,
        name: `Thùng hàng KingFood #${i}`,
        capacity: 5000,
        currentUsage: 0,
        status: ContainerStatus.ACTIVE
      });
    }
    const containerResult = await AppDataSource.manager.insert(Container, containersData);
    const containerIds = containerResult.identifiers.map(i => i.id);

    // 7. ContainerItems (5,000)
    console.log("📦 Creating 5,000 container items...");
    const itemsToInsert: any[] = [];
    const containerUsage: Record<number, number> = {};

    for (let i = 0; i < 5000; i++) {
      const taskIdx = i % taskIds.length;
      const task = tasksData[taskIdx];
      const tid = taskIds[taskIdx];
      const cid = containerIds[i % containerIds.length];

      if (task.quantityPicked > 0) {
        itemsToInsert.push({ containerId: cid, taskId: tid, quantity: task.quantityPicked, status: ContainerItemStatus.GOOD });
        containerUsage[cid] = (containerUsage[cid] || 0) + task.quantityPicked;
      }
    }
    await AppDataSource.manager.insert(ContainerItem, itemsToInsert);
    for (const cid in containerUsage) {
      await AppDataSource.manager.update(Container, cid, { currentUsage: containerUsage[cid] });
    }

    console.log(`✅ MEGA SEED V2 COMPLETE.`);
  } catch (error) {
    console.error("❌ SEED ERROR:", error);
  } finally {
    await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 1;");
    await AppDataSource.destroy();
  }
}

seed();
