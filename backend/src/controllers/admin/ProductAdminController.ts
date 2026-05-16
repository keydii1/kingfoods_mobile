import { Docs } from "@tsed/swagger";
import { Controller } from "@tsed/di";
import { Post, Delete, Patch, Get, Security, Summary, Tags } from "@tsed/schema";
import { BodyParams, PathParams, Req, Res, QueryParams } from "@tsed/common";
import { Response } from "express";
import { Product } from "../../Entity/Product";
import { ProductService } from "../../services/ProductService";
import { CreateProductSchema, UpdateProductSchema } from "../../schemas/ProductSchema";
import { Validator } from "../../decorators/Validator";

@Docs("admin")
@Controller("/admin/products")
@Tags("Admin - Products")
@Security("bearer")
export class ProductAdminController {
  constructor(private productService: ProductService) {}

  @Get("/")
  @Summary("Xem danh sách sản phẩm (có phân trang)")
  async getAllProducts(@Req() req: any, @Res() res: Response, @QueryParams() query: any) {
    const result = await this.productService.getAllProducts(query);
    return res.OK("Products fetched successfully", result);
  }

  @Get("/:id")
  @Summary("Xem chi tiết sản phẩm")
  async getProductById(@Req() req: any, @Res() res: Response, @PathParams("id") id: number) {
    const result = await this.productService.getProduct(id);
    return res.OK("Product fetched successfully", result);
  }

  @Post("/")
  @Validator(CreateProductSchema)
  @Summary("Thêm sản phẩm")
  async createProduct(@Req() req: any, @Res() res: Response, @BodyParams() body: Product) {
    const result = await this.productService.createProduct(body);
    return res.CREATED("Product created successfully", result);
  }

  @Patch("/:id")
  @Validator(UpdateProductSchema)
  @Summary("Cập nhật sản phẩm")
  async updateProduct(@Req() req: any, @Res() res: Response, @PathParams("id") id: number, @BodyParams() body: Product) {
    const result = await this.productService.updateProduct(id, body);
    return res.OK("Product updated successfully", result);
  }

  @Delete("/:id")
  @Summary("Xóa sản phẩm")
  async deleteProduct(@Req() req: any, @Res() res: Response, @PathParams("id") id: number) {
    await this.productService.deleteProduct(id);
    return res.OK("Product deleted successfully");
  }
}
