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
import { Branch } from "../../Entity/Branch";
import { BranchService } from "../../services/BranchService";
import {
  CreateBranchSchema,
  UpdateBranchSchema,
} from "../../schemas/BranchSchema";
import { Validator } from "../../decorators/Validator";

@Docs("admin")
@Controller("/admin/branches")
@Tags("Admin - Branches")
@Security("bearer")
export class BranchAdminController {
  constructor(private branchService: BranchService) {}

  @Get("/")
  @Summary("Xem danh sách chi nhánh (có phân trang)")
  async getAllBranches(
    @Req() req: Request,
    @Res() res: Response,
    @QueryParams() query: any,
  ) {
    const result = await this.branchService.getAllBranches(query);
    return res.OK("Branches fetched successfully", result);
  }

  @Get("/list")
  @Summary("Lấy toàn bộ danh sách chi nhánh hoạt động (không phân trang để chọn ở dropdown)")
  async getActiveBranchesList(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.branchService.getActiveBranchesList();
    return res.OK("Active branches list fetched successfully", result);
  }

  @Get("/:id")
  @Summary("Xem chi tiết chi nhánh")
  async getBranchById(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
  ) {
    const result = await this.branchService.getBranch(id);
    return res.OK("Branch fetched successfully", result);
  }

  @Post("/")
  @Validator(CreateBranchSchema)
  @Summary("Thêm chi nhánh")
  async createBranch(
    @Req() req: any,
    @Res() res: Response,
    @BodyParams() body: Branch,
  ) {
    const result = await this.branchService.createBranch(body);
    return res.CREATED("Branch created successfully", result);
  }

  @Patch("/:id")
  @Validator(UpdateBranchSchema)
  @Summary("Cập nhật chi nhánh")
  async updateBranch(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
    @BodyParams() body: Branch,
  ) {
    const result = await this.branchService.updateBranch(id, body);
    return res.OK("Branch updated successfully", result);
  }

  @Delete("/:id")
  @Summary("Xóa chi nhánh")
  async deleteBranch(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
  ) {
    await this.branchService.deleteBranch(id);
    return res.OK("Branch deleted successfully");
  }
}
