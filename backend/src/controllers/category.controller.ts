import { Controller } from "@tsed/common";
import { Get, Post, Put, Delete } from "@tsed/schema";
import { BodyParams, PathParams, QueryParams, UseBefore } from "@tsed/platform-express";
import Category from "../models/category.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError } from "../core/error.response";
import { authentication } from "../middlewares/auth.middleware";
import { adminOnly } from "../middlewares/role.middleware";

@Controller("/categories")
export class CategoryController {
  @Post("/")
  @UseBefore(authentication)
  @UseBefore(adminOnly)
  async create(@BodyParams() body: any) {
    const category = await Category.create(body);
    return new CREATED({
      message: "Category created successfully",
      metadata: category,
    });
  }

  @Get("/")
  async getAll(
    @QueryParams("page") pageQuery: string,
    @QueryParams("limit") limitQuery: string
  ) {
    const page = parseInt(pageQuery) || 1;
    const limit = parseInt(limitQuery) || 10;
    const skip = (page - 1) * limit;

    const categories = await Category.find({ isDeleted: false })
      .select("-isDeleted -__v")
      .skip(skip)
      .limit(limit);

    const total = await Category.countDocuments({ isDeleted: false });

    return new OK({
      message: "Get all categories successfully",
      metadata: {
        categories,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  }

  @Get("/:id")
  async getById(@PathParams("id") id: string) {
    const category = await Category.findById(id);
    if (!category || category.isDeleted) throw new BadRequestError("Category not found");
    return new OK({
      message: "Get category successfully",
      metadata: category,
    });
  }

  @Put("/:id")
  @UseBefore(authentication)
  @UseBefore(adminOnly)
  async update(@PathParams("id") id: string, @BodyParams() body: any) {
    const category = await Category.findByIdAndUpdate(id, body, { new: true });
    if (!category) throw new BadRequestError("Category not found");
    return new OK({
      message: "Category updated successfully",
      metadata: category,
    });
  }

  @Delete("/:id")
  @UseBefore(authentication)
  @UseBefore(adminOnly)
  async delete(@PathParams("id") id: string) {
    const category = await Category.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!category) throw new BadRequestError("Category not found");
    return new OK({
      message: "Category deleted successfully",
      metadata: category,
    });
  }
}
