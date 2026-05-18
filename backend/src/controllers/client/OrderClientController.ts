import { Docs } from "@tsed/swagger";
import { Controller } from "@tsed/di";
import {
  Get,
  Post,
  Patch,
  Security,
  Summary,
  Tags,
  Property,
  Enum,
} from "@tsed/schema";
import { BodyParams, PathParams, Req, Res, QueryParams } from "@tsed/common";
import { Response } from "express";
import { OrderService } from "../../services/OrderService";
import { OrderStatus } from "../../Entity/Order";
import { CreateOrderSchema } from "../../schemas/OrderSchema";
import { Validator } from "../../decorators/Validator";

class OrderProductParams {
  @Property()
  productId: number;
  @Property()
  quantity: number;
}

class CreateOrderParams {
  @Property({ type: OrderProductParams }) products: OrderProductParams[];
}

class UpdateOrderParams {

  @Property()
  @Enum(OrderStatus)
  status?: OrderStatus;
}

@Docs("customer")
@Controller("/client/orders")
@Tags("Client - Orders")
@Security("bearer")
export class OrderClientController {
  constructor(private orderService: OrderService) {}

  @Get("/")
  @Summary("Danh sách đơn hàng của tôi")
  async getMyOrders(@Req() req: any, @Res() res: Response) {
    const orders = await this.orderService.getOrdersByCustomer(
      req.decodeUser.branchId || req.decodeUser.id,
    );
    return res.OK("Orders fetched successfully", orders);
  }

  @Get("/statistics")
  @Summary("Thống kê cửa hàng theo ngày")
  async getStatistics(
    @Req() req: any,
    @Res() res: Response,
    @QueryParams("startDate") startDate?: string,
    @QueryParams("endDate") endDate?: string,
  ) {
    const result = await this.orderService.getStoreStatistics(
      req.decodeUser.branchId || req.decodeUser.id,
      startDate,
      endDate,
    );
    return res.OK("Statistics fetched successfully", result);
  }

  @Get("/history/:status")
  @Summary("Lịch sử đơn hàng")
  async getOrderHistory(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("status") status: OrderStatus,
  ) {
    const orders = await this.orderService.getHistory(
      req.decodeUser.branchId || req.decodeUser.id,
      status,
    );
    return res.OK("Orders history fetched successfully", orders);
  }

  @Get("/detail/:orderId")
  @Summary("Chi tiết đơn hàng")
  async getOrderDetail(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("orderId") orderId: number,
  ) {
    const customerId = req.decodeUser.branchId || req.decodeUser.id;
    const order = await this.orderService.getOrderDetailForClient(
      orderId,
      customerId,
    );
    return res.OK("Order detail fetched successfully", order);
  }

  @Post("/")
  @Validator(CreateOrderSchema)
  @Summary("Tạo đơn hàng")
  async createOrder(
    @Req() req: any,
    @Res() res: Response,
    @BodyParams() body: CreateOrderParams,
  ) {
    const result = await this.orderService.createOrder({
      customerId: req.decodeUser.branchId || req.decodeUser.id,
      products: body.products,
    });
    return res.CREATED("Order created successfully", result);
  }

  @Patch("/:id")
  @Summary("Hủy đơn")
  async updateOrderByClient(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
    @BodyParams() body: UpdateOrderParams,
  ) {
    const customerId = req.decodeUser.branchId || req.decodeUser.id;
    const order = await this.orderService.updateOrderByClient(id, body, customerId);
    return res.OK("Order updated successfully", order);
  }
}
