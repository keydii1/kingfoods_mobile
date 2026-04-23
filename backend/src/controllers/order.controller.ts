import { Controller } from "@tsed/common";
import { Get, Post, Put, Delete } from "@tsed/schema";
import { BodyParams, PathParams } from "@tsed/platform-express";
import Order from "../models/order.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError } from "../core/error.response";
import dayjs from "dayjs";

@Controller("/orders")
export class OrderController {
  @Post("/")
  async create(@BodyParams() body: any) {
    const order = await Order.create(body);
    return new CREATED({
      message: "Order created successfully",
      metadata: order,
    });
  }

  @Get("/")
  async getAll() {
    const orders = await Order.find({}).populate("branch_id user_id");
    
    // Formatting date for Mobile UI
    const formattedOrders = orders.map(order => ({
      ...order.toObject(),
      formattedDate: dayjs(order.createdAt).format("DD/MM/YYYY HH:mm"),
    }));

    return new OK({
      message: "Get all orders successfully",
      metadata: formattedOrders,
    });
  }

  @Get("/:id")
  async getById(@PathParams("id") id: string) {
    const order = await Order.findById(id).populate("branch_id user_id");
    if (!order) throw new BadRequestError("Order not found");
    return new OK({
      message: "Get order successfully",
      metadata: order,
    });
  }

  @Put("/:id")
  async update(@PathParams("id") id: string, @BodyParams() body: any) {
    const order = await Order.findByIdAndUpdate(id, body, { new: true });
    if (!order) throw new BadRequestError("Order not found");
    return new OK({
      message: "Order updated successfully",
      metadata: order,
    });
  }

  @Delete("/:id")
  async delete(@PathParams("id") id: string) {
    const order = await Order.findByIdAndDelete(id);
    if (!order) throw new BadRequestError("Order not found");
    return new OK({
      message: "Order deleted successfully",
      metadata: order,
    });
  }
}
