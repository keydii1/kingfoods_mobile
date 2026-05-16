import { Docs } from "@tsed/swagger";
import { Controller } from "@tsed/di";
import { Get, Delete, Patch, Security, Summary, Tags } from "@tsed/schema";
import { BodyParams, PathParams, Req, Res, QueryParams } from "@tsed/common";
import { Response } from "express";
import { IncidentReportService } from "../../services/IncidentReportService";
import { IncidentReport } from "../../Entity/IncidentReport";

@Docs("admin")
@Controller("/admin/incidents")
@Tags("Admin - Incidents")
@Security("bearer")
export class IncidentReportAdminController {
  constructor(private incidentService: IncidentReportService) {}

  @Get("/")
  @Summary("Xem danh sách báo cáo sự cố kệ trống")
  async getAllIncidents(@Req() req: any, @Res() res: Response, @QueryParams() query: any) {
    const result = await this.incidentService.getAllIncidents(query);
    return res.OK("Incidents fetched successfully", result);
  }

  @Get("/:id")
  @Summary("Xem chi tiết báo cáo sự cố")
  async getIncidentById(@Req() req: any, @Res() res: Response, @PathParams("id") id: number) {
    const result = await this.incidentService.getIncidentById(id);
    return res.OK("Incident fetched successfully", result);
  }

  @Patch("/:id")
  @Summary("Cập nhật thông tin báo cáo sự cố")
  async updateIncident(@Req() req: any, @Res() res: Response, @PathParams("id") id: number, @BodyParams() body: IncidentReport) {
    const result = await this.incidentService.updateIncident(id, body);
    return res.OK("Incident updated successfully", result);
  }

  @Delete("/:id")
  @Summary("Xóa báo cáo sự cố")
  async deleteIncident(@Req() req: any, @Res() res: Response, @PathParams("id") id: number) {
    await this.incidentService.deleteIncident(id);
    return res.OK("Incident deleted successfully");
  }
}
