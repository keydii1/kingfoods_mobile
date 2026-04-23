import { Controller, BodyParams, PathParams, QueryParams, UseBefore } from "@tsed/common";
import { Get, Post, Put, Delete } from "@tsed/schema";
import Product from "../models/product.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError } from "../core/error.response";
import { authentication } from "../middlewares/auth.middleware";
import { uploadImage } from "../middlewares/coudinary.middleware";
import multer from "multer";

const upload = multer({ storage: multer.diskStorage({}) });

@Controller("/products")
export class ProductController {
  @Get("/")
  async getAll(
    @QueryParams("page") pageQuery: string,
    @QueryParams("limit") limitQuery: string
  ) {
    const page = parseInt(pageQuery) || 1;
    const limit = parseInt(limitQuery) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ isDeleted: false })
      .select("-isDeleted -__v -createdAt -updatedAt")
      .populate("category_id", "name")
      .populate("location_id", "name")
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({ isDeleted: false });

    return new OK({
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
    });
  }

  @Get("/:id")
  async getById(@PathParams("id") id: string) {
    const product = await Product.findById(id).populate("category_id location_id");
    if (!product || product.isDeleted) throw new BadRequestError("Product not found");
    return new OK({
      message: "Get product successfully",
      metadata: product,
    });
  }

  @Post("/")
  @UseBefore(authentication)
  @UseBefore(upload.single("image"))
  @UseBefore(uploadImage)
  async create(@BodyParams() body: any) {
    const product = await Product.create(body);
    return new CREATED({
      message: "Product created successfully",
      metadata: product,
    });
  }

  @Put("/:id")
  @UseBefore(authentication)
  async update(@PathParams("id") id: string, @BodyParams() body: any) {
    const product = await Product.findByIdAndUpdate(id, body, { new: true });
    if (!product) throw new BadRequestError("Product not found");
    return new OK({
      message: "Product updated successfully",
      metadata: product,
    });
  }

  @Delete("/:id")
  @UseBefore(authentication)
  async delete(@PathParams("id") id: string) {
    const product = await Product.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!product) throw new BadRequestError("Product not found");
    return new OK({
      message: "Product deleted successfully",
      metadata: product,
    });
  }
}
