import { Controller, Inject } from "@tsed/di";
import { Get, Summary, Tags, Property, Default } from "@tsed/schema";
import { PathParams, Req, Res, QueryParams } from "@tsed/common";
import { Docs } from "@tsed/swagger";
import { Response } from "express";
import { ProductService } from "../../services/ProductService";
import { PaginationSchema } from "../../schemas/PaginationSchema";
import { Validator } from "../../decorators/Validator";

class PaginationParams {
  @Property() @Default(1) page?: number;
  @Property() @Default(10) limit?: number;
  @Property() @Default("id") sortKey?: string;
  @Property() @Default("ASC") sortValue?: string;
}

@Docs("customer")
@Controller("/public/products")
@Tags("Public - Products")
export class ProductPublicController {
  @Inject()
  productService: ProductService;

  @Get("/")
  @Validator(PaginationSchema)
  @Summary("Xem danh sách sản phẩm")
  async getAllProducts(@Req() req: any, @Res() res: Response, @QueryParams() query: PaginationParams) {
    const result = await this.productService.getAllProducts(query);
    return res.OK("Products fetched successfully", result);
  }

  @Get("/:id")
  @Summary("Xem chi tiết sản phẩm")
  async getProduct(@Req() req: any, @Res() res: Response, @PathParams("id") id: number) {
    const product = await this.productService.getProduct(id);
    return res.OK("Product fetched successfully", product);
  }
}
