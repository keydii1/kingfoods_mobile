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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ isDeleted: false })
      .select("-isDeleted -__v -createdAt -updatedAt")
      .populate("category_id", "name")
      .populate("location_id", "name")
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({ isDeleted: false });

    new OK({
      message: "Get all products successfully",
      metadata: {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
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
