import { Controller } from "@tsed/common";
import { Get, Post, Put, Delete } from "@tsed/schema";
import { BodyParams, PathParams } from "@tsed/platform-express";
import OrderDetail from "../models/orderDetail.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError } from "../core/error.response";

@Controller("/order-details")
export class OrderDetailController {
  @Post("/")
  async create(@BodyParams() body: any) {
    const orderDetail = await OrderDetail.create(body);
    return new CREATED({
      message: "Order detail created successfully",
      metadata: orderDetail,
    });
  }

  @Get("/")
  async getAll() {
    const orderDetails = await OrderDetail.find({}).populate("order_id product_id");
    return new OK({
      message: "Get all order details successfully",
      metadata: orderDetails,
    });
  }

  @Get("/:id")
  async getById(@PathParams("id") id: string) {
    const orderDetail = await OrderDetail.findById(id).populate("order_id product_id");
    if (!orderDetail) throw new BadRequestError("Order detail not found");
    return new OK({
      message: "Get order detail successfully",
      metadata: orderDetail,
    });
  }

  @Put("/:id")
  async update(@PathParams("id") id: string, @BodyParams() body: any) {
    const orderDetail = await OrderDetail.findByIdAndUpdate(id, body, { new: true });
    if (!orderDetail) throw new BadRequestError("Order detail not found");
    return new OK({
      message: "Order detail updated successfully",
      metadata: orderDetail,
    });
  }

  @Delete("/:id")
  async delete(@PathParams("id") id: string) {
    const orderDetail = await OrderDetail.findByIdAndDelete(id);
    if (!orderDetail) throw new BadRequestError("Order detail not found");
    return new OK({
      message: "Order detail deleted successfully",
      metadata: orderDetail,
    });
  }
}
