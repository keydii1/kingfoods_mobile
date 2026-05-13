import { Docs } from "@tsed/swagger";
import { Controller, Inject } from "@tsed/di";
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
import { BodyParams, PathParams, Req, Res } from "@tsed/common";
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
  @Property() address: string;
}

class UpdateOrderParams {
  @Property()
  address?: string;

  @Property()
  @Enum(OrderStatus)
  status?: OrderStatus;
}

@Docs("customer")
@Controller("/client/orders")
@Tags("Client - Orders")
@Security("bearer")
export class OrderClientController {
  @Inject()
  private orderService: OrderService;

  @Get("/")
  @Summary("Danh sách đơn hàng của tôi")
  async getMyOrders(@Req() req: any, @Res() res: Response) {
    const orders = await this.orderService.getOrdersByCustomer(
      req.decodeUser.id,
    );
    return res.OK("Orders fetched successfully", orders);
  }

  @Get("/history/:status")
  @Summary("Lịch sử đơn hàng")
  async getOrderHistory(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("status") status: OrderStatus,
  ) {
    const orders = await this.orderService.getHistory(
      req.decodeUser.id,
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
    const result = await this.orderService.getOrderDetail(orderId);
    return res.OK("Order detail fetched successfully", {
      OrderDetail: result.detail,
      totalPrice: result.totalPriceOfOrder,
    });
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
      customerId: req.decodeUser.id,
      products: body.products,
      address: body.address,
    });
    return res.CREATED("Order created successfully", result);
  }

  @Patch("/:id")
  @Summary("Cập nhật địa chỉ hoặc hủy đơn")
  async updateOrderByClient(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
    @BodyParams() body: UpdateOrderParams,
  ) {
    const order = await this.orderService.updateOrderByClient(id, body);
    return res.OK("Order updated successfully", order);
  }
}
