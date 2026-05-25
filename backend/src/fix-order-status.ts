import { AppDataSource } from "./config/DataSource";
import { Order, OrderStatus } from "./Entity/Order";
import { PickingTask, PickingTaskStatus } from "./Entity/PickingTask";
import { OrderDetail } from "./Entity/OrderDetail";

async function run() {
  console.log("🚀 Đang khởi tạo kết nối database...");
  await AppDataSource.initialize();
  console.log("✅ Kết nối thành công.");

  // Lấy tất cả đơn hàng đang ở trạng thái 'processing'
  const orders = await Order.find({
    where: { status: OrderStatus.PROCESSING },
    relations: ["orderDetails"]
  });

  console.log(`🔍 Tìm thấy ${orders.length} đơn hàng đang xử lý (processing). Tiến hành kiểm tra...`);

  let updatedCount = 0;

  for (const order of orders) {
    if (!order.orderDetails || order.orderDetails.length === 0) {
      continue;
    }

    const orderDetailIds = order.orderDetails.map(d => d.id);
    
    // Tìm tất cả picking tasks của đơn hàng này
    const tasks = await PickingTask.createQueryBuilder("task")
      .where("task.orderDetailId IN (:...ids)", { ids: orderDetailIds })
      .getMany();

    if (tasks.length === 0) {
      continue;
    }

    // Kiểm tra xem tất cả nhiệm vụ đã hoàn thành hay chưa
    const allCompleted = tasks.every(t => t.status === PickingTaskStatus.COMPLETED);

    if (allCompleted) {
      console.log(`⚡ Đơn hàng #${order.id} đã hoàn thành tất cả picking tasks. Tiến hành chuyển trạng thái sang DELIVERED...`);
      order.status = OrderStatus.DELIVERED;
      await order.save();
      updatedCount++;
    }
  }

  console.log(`🎉 Đã hoàn tất! Cập nhật thành công ${updatedCount} đơn hàng sang 'delivered'.`);
  await AppDataSource.destroy();
}

run().catch(err => {
  console.error("❌ Lỗi khi chạy script:", err);
});
