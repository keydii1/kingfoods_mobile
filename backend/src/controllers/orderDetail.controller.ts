import { Request, Response, NextFunction } from "express";
import OrderDetail from "../models/orderDetail.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError } from "../core/error.response";
import asyncHandler from "../helpers/asyncHandler.helper";

class OrderDetailController {
  create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    new CREATED({
      message: "Order detail created successfully",
      metadata: await OrderDetail.create(req.body),
    }).send(res);
  });

  getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    new OK({
      message: "Get all order details successfully",
      metadata: await OrderDetail.find({}).populate("order_id product_id"),
    }).send(res);
  });

  getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const orderDetail = await OrderDetail.findById(req.params.id).populate("order_id product_id");
    if (!orderDetail) throw new BadRequestError("Order detail not found");
    new OK({
      message: "Get order detail successfully",
      metadata: orderDetail,
    }).send(res);
  });

  update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const orderDetail = await OrderDetail.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!orderDetail) throw new BadRequestError("Order detail not found");
    new OK({
      message: "Order detail updated successfully",
      metadata: orderDetail,
    }).send(res);
  });

  delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const orderDetail = await OrderDetail.findByIdAndDelete(req.params.id);
    if (!orderDetail) throw new BadRequestError("Order detail not found");
    new OK({
      message: "Order detail deleted successfully",
      metadata: orderDetail,
    }).send(res);
  });
}

export default new OrderDetailController();
