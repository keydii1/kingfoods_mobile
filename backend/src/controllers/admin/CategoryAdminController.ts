import { Docs } from "@tsed/swagger";
import { Controller } from "@tsed/di";
import {
  Post,
  Delete,
  Patch,
  Get,
  Security,
  Summary,
  Tags,
} from "@tsed/schema";
import { BodyParams, PathParams, Req, Res, QueryParams } from "@tsed/common";
import { Response } from "express";
import { Category } from "../../Entity/Category";
import { CategoryService } from "../../services/CategoryService";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
} from "../../schemas/CategorySchema";
import { Validator } from "../../decorators/Validator";

@Docs("admin")
@Controller("/admin/categories")
@Tags("Admin - Categories")
@Security("bearer")
export class CategoryAdminController {
  constructor(private categoryService: CategoryService) {}

  @Get("/")
  @Summary("Xem danh sách danh mục (có phân trang)")
  async getAllCategories(
    @Req() req: Request,
    @Res() res: Response,
    @QueryParams() query: any,
  ) {
    const result = await this.categoryService.getAllCategories(query);
    return res.OK("Categories fetched successfully", result);
  }

  @Get("/:id")
  @Summary("Xem chi tiết danh mục")
  async getCategoryById(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
  ) {
    const result = await this.categoryService.getCategory(id);
    return res.OK("Category fetched successfully", result);
  }

  @Post("/")
  @Validator(CreateCategorySchema)
  @Summary("Thêm danh mục")
  async createCategory(
    @Req() req: any,
    @Res() res: Response,
    @BodyParams() body: Category,
  ) {
    const result = await this.categoryService.createCategory(body);
    return res.CREATED("Category created successfully", result);
  }

  @Patch("/:id")
  @Validator(UpdateCategorySchema)
  @Summary("Cập nhật danh mục")
  async updateCategory(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
    @BodyParams() body: Category,
  ) {
    const result = await this.categoryService.updateCategory(id, body);
    return res.OK("Category updated successfully", result);
  }

  @Delete("/:id")
  @Summary("Xóa danh mục")
  async deleteCategory(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
  ) {
    await this.categoryService.deleteCategory(id);
    return res.OK("Category deleted successfully");
  }
}
