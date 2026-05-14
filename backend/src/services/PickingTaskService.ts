import { Service } from "@tsed/di";
import { PickingTask } from "../Entity/PickingTask";

@Service()
export class PickingTaskService {
  async getAllTasks(query: any) {
    return await PickingTask.paginate(query, {
      relations: ["order", "product", "assignedUser", "location"]
    });
  }

  async getTaskById(id: number) {
    return await PickingTask.getByIdOrFail(id, {
      relations: ["order", "product", "assignedUser", "location"]
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
