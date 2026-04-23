import { Request, Response, NextFunction } from "express";
import Category from "../models/category.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError } from "../core/error.response";
import asyncHandler from "../helpers/asyncHandler.helper";

class CategoryController {
  create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    new CREATED({
      message: "Category created successfully",
      metadata: await Category.create(req.body),
    }).send(res);
  });

  getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    new OK({
      message: "Get all categories successfully",
      metadata: await Category.find({ isDeleted: false }),
    }).send(res);
  });

  getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const category = await Category.findById(req.params.id);
    if (!category || category.isDeleted) throw new BadRequestError("Category not found");
    new OK({
      message: "Get category successfully",
      metadata: category,
    }).send(res);
  });

  update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) throw new BadRequestError("Category not found");
    new OK({
      message: "Category updated successfully",
      metadata: category,
    }).send(res);
  });

  delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const category = await Category.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!category) throw new BadRequestError("Category not found");
    new OK({
      message: "Category deleted successfully",
      metadata: category,
    }).send(res);
  });
}

export default new CategoryController();
