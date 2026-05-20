import { Controller } from "@tsed/di";
import { Get, Post, Security, Summary, Tags } from "@tsed/schema";
import { BodyParams, PathParams, Req, Res, QueryParams } from "@tsed/common";
import { Docs } from "@tsed/swagger";
import { Response } from "express";
import { PickingService } from "../../services/PickingService";
import { UserRole } from "../../Entity/User";
import { IncidentReport, IncidentStatus } from "../../Entity/IncidentReport";
import { Forbidden } from "../../core/ErrorResponse";
import { v2 as cloudinary } from "cloudinary";
import {
  AssignTasksDto,
  PackItemDto,
  HandoverTaskDto,
  ReportIssueDto,
  MoveContainerItemDto,
  ReportIncidentDto
} from "../../schemas/PickingSchema";

@Docs("admin", "staff")
@Controller("/admin/picking")
@Tags("Warehouse Picking & Traceability")
@Security("bearer")
export class PickingController {
  constructor(private pickingService: PickingService) {}

  @Post("/assign")
  @Summary("Quản lý: Phân chia đơn đặt hàng thành các nhiệm vụ nhỏ cho nhân viên")
  async assignTasks(
    @Req() req: any,
    @Res() res: Response,
    @BodyParams() body: AssignTasksDto
  ) {
    if (req.decodeUser.role !== UserRole.ADMIN) {
      throw new Forbidden("Chỉ quản lý (Admin) mới có quyền phân công và chia tách nhiệm vụ");
    }

    const { orderId, tasks } = body;
    const result = await this.pickingService.assignAndSplitTasks(orderId, tasks);
    return res.OK("Phân chia và giao nhiệm vụ pick hàng thành công", result);
  }

  @Get("/assigned")
  @Summary("Nhân viên: Lấy danh sách nhiệm vụ pick hàng được phân công trong ca")
  async getAssignedTasks(@Req() req: any, @Res() res: Response, @QueryParams("staffId") staffId?: number) {
    let targetStaffId = req.decodeUser.id;

    if (req.decodeUser.role === UserRole.ADMIN && staffId) {
      targetStaffId = staffId;
    }

    const tasks = await this.pickingService.getAssignedTasks(targetStaffId);
    return res.OK("Lấy danh sách nhiệm vụ được giao thành công", tasks);
  }

  @Post("/pack")
  @Summary("Nhân viên: Thực hiện pick hàng và bỏ vào Container")
  async pickTaskItem(
    @Req() req: any,
    @Res() res: Response,
    @BodyParams() body: PackItemDto
  ) {
    const { taskId, quantity, containerCode } = body;
    const staffId = req.decodeUser.id;

    const result = await this.pickingService.pickTaskItem({
      taskId,
      quantity,
      containerCode,
      staffId,
    });

    return res.OK("Cập nhật kết quả pick hàng vào container thành công", result);
  }

  @Post("/handover")
  @Summary("Nhân viên: Bàn giao nhiệm vụ còn dang dở cho nhân viên ca tiếp theo")
  async handoverTask(
    @Req() req: any,
    @Res() res: Response,
    @BodyParams() body: HandoverTaskDto
  ) {
    const { taskId, nextStaffId } = body;
    const staffId = req.decodeUser.id;

    const result = await this.pickingService.handoverTask(taskId, nextStaffId, staffId);
    return res.OK("Bàn giao nhiệm vụ ca tiếp theo thành công", result);
  }

  @Get("/trace/:containerCode")
  @Summary("Quản lý: Truy xuất nguồn gốc và lịch sử đóng hàng của Container (Traceability)")
  async getContainerTraceability(@Req() req: any, @Res() res: Response, @PathParams("containerCode") containerCode: string) {
    if (req.decodeUser.role !== UserRole.ADMIN) {
      throw new Forbidden("Chỉ quản lý mới có quyền truy xuất nguồn gốc container");
    }

    const traceability = await this.pickingService.getContainerTraceability(containerCode);
    return res.OK("Truy xuất nguồn gốc container thành công", traceability);
  }

  @Post("/issue/:itemId")
  @Summary("Quản lý: Ghi nhận hỏng/thiếu hàng tại chi nhánh, truy quét và quy trách nhiệm phạt nhân viên")
  async reportIssue(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("itemId") itemId: number,
    @BodyParams() body: ReportIssueDto
  ) {
    if (req.decodeUser.role !== UserRole.ADMIN) {
      throw new Forbidden("Chỉ quản lý mới có quyền báo cáo lỗi hàng hóa");
    }

    const { status } = body;
    const result = await this.pickingService.reportContainerItemIssue(itemId, status);
    return res.OK("Ghi nhận sự cố và truy quét nhân viên chịu trách nhiệm thành công", result);
  }

  @Post("/move")
  @Summary("Nhân viên: Di chuyển sản phẩm từ thùng cũ sang thùng mới (Move Item)")
  async moveContainerItem(
    @Req() req: any,
    @Res() res: Response,
    @BodyParams() body: MoveContainerItemDto
  ) {
    const { productId, oldContainerCode, newContainerCode, quantity } = body;
    const staffId = req.decodeUser.id;

    const result = await this.pickingService.moveContainerItem({
      productId,
      oldContainerCode,
      newContainerCode,
      quantity,
      staffId,
    });

    return res.OK("Di chuyển hàng sang thùng mới thành công", result);
  }

  @Post("/incident")
  @Summary("Nhân viên: Báo cáo sự cố thiếu hàng tại kệ (Shortage Report)")
  async reportIncident(
    @Req() req: any,
    @Res() res: Response,
    @BodyParams() body: ReportIncidentDto
  ) {
    const reporterId = req.decodeUser.id;
    const { taskId, photoUrl, reason } = body;

    let finalPhotoUrl = "";
    if (photoUrl) {
      if (photoUrl.startsWith("data:image/")) {
        try {
          const uploadResult = await cloudinary.uploader.upload(photoUrl, {
            folder: "kingfoods/incidents",
          });
          finalPhotoUrl = uploadResult.secure_url;
        } catch (err) {
          console.error("Cloudinary upload failed", err);
          finalPhotoUrl = ""; // Failsafe fallback
        }
      } else {
        finalPhotoUrl = photoUrl;
      }
    }

    const incident = await IncidentReport.createAndSave({
      taskId,
      reporterId,
      photoUrl: finalPhotoUrl,
      reason,
      status: IncidentStatus.PENDING
    });

    return res.OK("Gửi báo cáo thiếu hàng thành công", incident);
  }

  @Get("/incidents")
  @Summary("Quản lý: Xem danh sách sự cố thiếu hàng tại kệ (Incident Center)")
  async getIncidents(@Req() req: any, @Res() res: Response) {
    const where: any = {};
    if (req.decodeUser.role !== UserRole.ADMIN) {
      where.reporterId = req.decodeUser.id;
    }

    const incidents = await IncidentReport.find({
      where,
      relations: [
        "reporter",
        "task",
        "task.location",
        "task.orderDetail",
        "task.orderDetail.product"
      ],
      order: { createdAt: "DESC" }
    });

    return res.OK("Lấy danh sách sự cố thành công", incidents);
  }

  @Post("/incident/:id/resolve")
  @Summary("Quản lý: Đánh dấu đã xử lý xong sự cố")
  async resolveIncident(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number
  ) {
    if (req.decodeUser.role !== UserRole.ADMIN) {
      throw new Forbidden("Chỉ quản lý mới có quyền xử lý sự cố");
    }

    const incident = await IncidentReport.getByIdOrFail(id);
    incident.status = IncidentStatus.RESOLVED;
    await incident.save();

    return res.OK("Xử lý sự cố thành công", incident);
  }
}
