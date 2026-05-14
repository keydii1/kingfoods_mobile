import { AppDataSource } from "./config/DataSource";
import { PickingTask } from "./Entity/PickingTask";
import { OrderStatus } from "./Entity/Order";
import { Order } from "./Entity/Order";

async function run() {
  await AppDataSource.initialize();
  const orders = await AppDataSource.manager.find(Order, { where: { status: OrderStatus.PROCESSING }, take: 3 });
  const ordIds = orders.map(o => o.id);
  console.log("Ord IDs:", ordIds);
  for (const ordId of ordIds) {
      const tasksForOrder = await AppDataSource.manager.createQueryBuilder(PickingTask, "task")
        .innerJoin("task.orderDetail", "detail")
        .where("detail.orderId = :ordId", { ordId })
        .getMany();
      console.log(`Order ${ordId} has ${tasksForOrder.length} tasks`);
  }
  await AppDataSource.destroy();
}
run();
