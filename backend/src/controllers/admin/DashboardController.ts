import { Controller, Inject } from "@tsed/di";
import { Get, Security, Summary, Tags } from "@tsed/schema";
import { Req, Res, QueryParams } from "@tsed/common";
import { Response } from "express";
import { DashboardService } from "../../services/DashboardService";

@Controller("/admin/dashboard")
@Tags("Admin - Dashboard")
@Security("bearer")
export class DashboardController {
  @Inject()
  private dashboardService: DashboardService;

  @Get("/stats")
  @Summary("Thống kê tổng quan")
  async getStats(@Req() req: any, @Res() res: Response) {
    const result = await this.dashboardService.getStats();
    return res.OK("Stats fetched successfully", result);
  }

  @Get("/revenue")
  @Summary("Doanh thu theo thời gian")
  async getRevenue(
    @Req() req: any,
    @Res() res: Response,
    @QueryParams("startDate") startDate: string,
    @QueryParams("endDate") endDate: string
  ) {
    const result = await this.dashboardService.getRevenueByDate(
      new Date(startDate),
      new Date(endDate)
    );
    return res.OK("Revenue fetched successfully", { revenue: result });
  }
}
