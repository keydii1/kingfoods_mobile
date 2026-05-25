import { Service } from "@tsed/di";
import { PickingTask } from "../Entity/PickingTask";

@Service()
export class PickingTaskService {
  async getAllTasks(query: any) {
    const where: any = {};
    if (query.orderId) {
      where.orderDetail = {
        orderId: Number(query.orderId)
      };
    }
    return await PickingTask.paginate(query, {
      relations: ["orderDetail", "orderDetail.order", "orderDetail.product", "assignedUser", "location"],
      where
    });
  }

  async getTaskById(id: number) {
    return await PickingTask.getByIdOrFail(id, {
      relations: ["orderDetail", "orderDetail.order", "orderDetail.product", "assignedUser", "location"]
    });
  }

  async createTask(body: any) {
    return await PickingTask.createAndSave(body);
  }

  async updateTask(id: number, body: any) {
    const task = await PickingTask.getByIdOrFail(id);
    return await task.update(body);
  }

  async deleteTask(id: number) {
    const task = await PickingTask.getByIdOrFail(id);
    return await task.softDelete();
  }
}
