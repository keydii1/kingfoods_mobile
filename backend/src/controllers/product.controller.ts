import { Request, Response, NextFunction } from "express";
import Product from "../models/product.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError } from "../core/error.response";
import asyncHandler from "../helpers/asyncHandler.helper";

class ProductController {
  create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    new CREATED({
      message: "Product created successfully",
      metadata: await Product.create(req.body),
    }).send(res);
  });

  getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    new OK({
      message: "Get all products successfully",
      metadata: await Product.find({ isDeleted: false }).populate("category_id location_id"),
    }).send(res);
  });

  getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id).populate("category_id location_id");
    if (!product || product.isDeleted) throw new BadRequestError("Product not found");
    new OK({
      message: "Get product successfully",
      metadata: product,
    }).send(res);
  });

  update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) throw new BadRequestError("Product not found");
    new OK({
      message: "Product updated successfully",
      metadata: product,
    }).send(res);
  });

  delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!product) throw new BadRequestError("Product not found");
    new OK({
      message: "Product deleted successfully",
      metadata: product,
    }).send(res);
  });
}

export default new ProductController();
