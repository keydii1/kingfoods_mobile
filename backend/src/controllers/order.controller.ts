import { Request, Response, NextFunction } from "express";
import Order from "../models/order.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError } from "../core/error.response";
import asyncHandler from "../helpers/asyncHandler.helper";

class OrderController {
  create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    new CREATED({
      message: "Order created successfully",
      metadata: await Order.create(req.body),
    }).send(res);
  });

  getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    new OK({
      message: "Get all orders successfully",
      metadata: await Order.find({}).populate("branch_id user_id"),
    }).send(res);
  });

  getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const order = await Order.findById(req.params.id).populate("branch_id user_id");
    if (!order) throw new BadRequestError("Order not found");
    new OK({
      message: "Get order successfully",
      metadata: order,
    }).send(res);
  });

  update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) throw new BadRequestError("Order not found");
    new OK({
      message: "Order updated successfully",
      metadata: order,
    }).send(res);
  });

  delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) throw new BadRequestError("Order not found");
    new OK({
      message: "Order deleted successfully",
      metadata: order,
    }).send(res);
  });
}

export default new OrderController();
