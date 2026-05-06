import { Controller, Inject } from "@tsed/di";
import { Get, Delete, Patch, Security, Summary, Tags } from "@tsed/schema";
import { BodyParams, PathParams, Req, Res } from "@tsed/common";
import { Response } from "express";
import { OrderService } from "../../services/OrderService";

@Controller("/admin/orders")
@Tags("Admin - Orders")
@Security("bearer")
export class OrderAdminController {
  @Inject()
  private orderService: OrderService;

  @Patch("/:id")
  @Summary("Cập nhật trạng thái đơn hàng")
  async updateByAdmin(@Req() req: any, @Res() res: Response, @PathParams("id") id: number, @BodyParams() body: any) {
    const order = await this.orderService.updateByAdmin(id, body);
    return res.OK("Order updated successfully", order);
  }

  @Delete("/:id")
  @Summary("Xóa đơn hàng")
  async deleteOrder(@Req() req: any, @Res() res: Response, @PathParams("id") id: number) {
    await this.orderService.deleteOrder(id);
    return res.OK("Order deleted successfully");
  }
}
