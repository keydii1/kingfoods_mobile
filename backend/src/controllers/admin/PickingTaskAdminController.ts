import { Docs } from "@tsed/swagger";
import { Controller } from "@tsed/di";
import {
  Get,
  Post,
  Delete,
  Patch,
  Security,
  Summary,
  Tags,
} from "@tsed/schema";
import { BodyParams, PathParams, Req, Res, QueryParams } from "@tsed/common";
import { Response, Request } from "express";
import { PickingTask } from "../../Entity/PickingTask";
import { PickingTaskService } from "../../services/PickingTaskService";

@Docs("admin")
@Controller("/admin/tasks")
@Tags("Admin - Picking Tasks")
@Security("bearer")
export class PickingTaskAdminController {
  constructor(private taskService: PickingTaskService) {}

  @Get("/")
  @Summary("Xem danh sách nhiệm vụ lấy hàng")
  async getAllTasks(
    @Req() req: any,
    @Res() res: Response,
    @QueryParams() query: any,
  ) {
    const result = await this.taskService.getAllTasks(query);
    return res.OK("Tasks fetched successfully", result);
  }

  @Get("/:id")
  @Summary("Xem chi tiết nhiệm vụ lấy hàng")
  async getTaskById(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
  ) {
    const result = await this.taskService.getTaskById(id);
    return res.OK("Task fetched successfully", result);
  }

  @Post("/")
  @Summary("Thêm nhiệm vụ lấy hàng thủ công")
  async createTask(
    @Req() req: any,
    @Res() res: Response,
    @BodyParams() body: PickingTask,
  ) {
    const result = await this.taskService.createTask(body);
    return res.CREATED("Task created successfully", result);
  }

  @Patch("/:id")
  @Summary("Cập nhật nhiệm vụ lấy hàng")
  async updateTask(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
    @BodyParams() body: PickingTask,
  ) {
    const result = await this.taskService.updateTask(id, body);
    return res.OK("Task updated successfully", result);
  }

  @Delete("/:id")
  @Summary("Xóa nhiệm vụ lấy hàng")
  async deleteTask(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
  ) {
    await this.taskService.deleteTask(id);
    return res.OK("Task deleted successfully");
  }
}
