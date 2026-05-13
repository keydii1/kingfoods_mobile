import { Docs } from "@tsed/swagger";
import { Controller, Inject } from "@tsed/di";
import {
  Get,
  Delete,
  Patch,
  Security,
  Summary,
  Tags,
  Enum,
} from "@tsed/schema";
import { BodyParams, PathParams, Req, Res, QueryParams } from "@tsed/common";
import { Response } from "express";
import { OrderService } from "../../services/OrderService";
import { OrderStatus } from "../../Entity/Order";

@Docs("admin")
@Controller("/admin/orders")
@Tags("Admin - Orders")
@Security("bearer")
export class OrderAdminController {
  @Inject()
  private orderService: OrderService;

  @Get("/")
  @Summary("Danh sách toàn bộ đơn hàng")
  async getAllOrders(
    @Req() req: any,
    @Res() res: Response,
    @QueryParams("status") status?: OrderStatus,
  ) {
    const orders = await this.orderService.getAllOrders(status);
    return res.OK("All orders fetched successfully", orders);
  }

  @Patch("/:id")
  @Summary("Cập nhật trạng thái đơn hàng")
  async updateByAdmin(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
    @BodyParams("status") status: OrderStatus,
  ) {
    const order = await this.orderService.updateByAdmin(id, status);
    return res.OK("Order updated successfully", order);
  }

  @Delete("/:id")
  @Summary("Xóa đơn hàng")
  async deleteOrder(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
  ) {
    await this.orderService.deleteOrder(id);
    return res.OK("Order deleted successfully");
  }
}
