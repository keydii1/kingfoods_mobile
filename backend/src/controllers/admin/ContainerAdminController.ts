import { Docs } from "@tsed/swagger";
import { Controller, Inject } from "@tsed/di";
import { Get, Post, Delete, Patch, Security, Summary, Tags } from "@tsed/schema";
import { BodyParams, PathParams, Req, Res, QueryParams } from "@tsed/common";
import { Response } from "express";
import { Container } from "../../Entity/Container";
import { ContainerService } from "../../services/ContainerService";

@Docs("admin")
@Controller("/admin/containers")
@Tags("Admin - Containers")
@Security("bearer")
export class ContainerAdminController {
  @Inject()
  containerService: ContainerService;

  @Get("/")
  @Summary("Xem danh sách thùng hàng")
  async getAllContainers(@Req() req: any, @Res() res: Response, @QueryParams() query: any) {
    const result = await this.containerService.getAllContainers(query);
    return res.OK("Containers fetched successfully", result);
  }

  @Get("/:id")
  @Summary("Xem chi tiết thùng hàng")
  async getContainerById(@Req() req: any, @Res() res: Response, @PathParams("id") id: number) {
    const result = await this.containerService.getContainer(id);
    return res.OK("Container fetched successfully", result);
  }

  @Post("/")
  @Summary("Thêm thùng hàng mới")
  async createContainer(@Req() req: any, @Res() res: Response, @BodyParams() body: Container) {
    const result = await this.containerService.createContainer(body);
    return res.CREATED("Container created successfully", result);
  }

  @Patch("/:id")
  @Summary("Cập nhật thùng hàng")
  async updateContainer(@Req() req: any, @Res() res: Response, @PathParams("id") id: number, @BodyParams() body: Container) {
    const result = await this.containerService.updateContainer(id, body);
    return res.OK("Container updated successfully", result);
  }

  @Delete("/:id")
  @Summary("Xóa thùng hàng")
  async deleteContainer(@Req() req: any, @Res() res: Response, @PathParams("id") id: number) {
    await this.containerService.deleteContainer(id);
    return res.OK("Container deleted successfully");
  }
}
