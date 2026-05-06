import { Controller, Inject } from "@tsed/di";
import { Post, Delete, Patch, Security, Summary, Tags } from "@tsed/schema";
import { BodyParams, PathParams, Req, Res } from "@tsed/common";
import { Response } from "express";
import { Category } from "../../Entity/Category";
import { CategoryService } from "../../services/CategoryService";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
} from "../../schemas/CategorySchema";
import { Validator } from "../../decorators/Validator";

@Controller("/admin/categories")
@Tags("Admin - Categories")
@Security("bearer")
export class CategoryAdminController {
  @Inject()
  categoryService: CategoryService;

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
