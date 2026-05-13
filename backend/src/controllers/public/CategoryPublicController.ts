import { Controller, Inject } from "@tsed/di";
import { Get, Summary, Tags, Property, Default } from "@tsed/schema";
import { PathParams, Req, Res, QueryParams } from "@tsed/common";
import { Docs } from "@tsed/swagger";
import { Response } from "express";
import { Category } from "../../Entity/Category";
import { CategoryService } from "../../services/CategoryService";
import { PaginationSchema } from "../../schemas/PaginationSchema";
import { Validator } from "../../decorators/Validator";

class PaginationParams {
  @Property() @Default(1) page?: number;
  @Property() @Default(10) limit?: number;
  @Property() @Default("id") sortKey?: string;
  @Property() @Default("ASC") sortValue?: string;
}

@Docs("customer")
@Controller("/public/categories")
@Tags("Public - Categories")
export class CategoryPublicController {
  @Inject()
  categoryService: CategoryService;

  @Get("/")
  @Validator(PaginationSchema)
  @Summary("Xem danh sách danh mục")
  async getAllCategories(@Req() req: any, @Res() res: Response, @QueryParams() query: PaginationParams) {
    const result = await this.categoryService.getAllCategories(query);
    return res.OK("Categories fetched successfully", result);
  }

  @Get("/:id")
  @Summary("Xem chi tiết danh mục")
  async getCategory(@Req() req: any, @Res() res: Response, @PathParams("id") id: number) {
    const category = await this.categoryService.getCategory(id);
    return res.OK("Category fetched successfully", category);
  }
}
