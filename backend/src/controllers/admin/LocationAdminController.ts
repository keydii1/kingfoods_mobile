import { Docs } from "@tsed/swagger";
import { Controller } from "@tsed/di";
import { Get, Post, Delete, Patch, Security, Summary, Tags } from "@tsed/schema";
import { BodyParams, PathParams, Req, Res, QueryParams } from "@tsed/common";
import { Response } from "express";
import { Location } from "../../Entity/Location";
import { LocationService } from "../../services/LocationService";

@Docs("admin")
@Controller("/admin/locations")
@Tags("Admin - Locations")
@Security("bearer")
export class LocationAdminController {
  constructor(private locationService: LocationService) {}

  @Get("/")
  @Summary("Xem danh sách vị trí kho")
  async getAllLocations(@Req() req: any, @Res() res: Response, @QueryParams() query: any) {
    const result = await this.locationService.getAllLocations(query);
    return res.OK("Locations fetched successfully", result);
  }

  @Get("/:id")
  @Summary("Xem chi tiết vị trí kho")
  async getLocationById(@Req() req: any, @Res() res: Response, @PathParams("id") id: number) {
    const result = await this.locationService.getLocation(id);
    return res.OK("Location fetched successfully", result);
  }

  @Post("/")
  @Summary("Thêm vị trí kho")
  async createLocation(@Req() req: any, @Res() res: Response, @BodyParams() body: Location) {
    const result = await this.locationService.createLocation(body);
    return res.CREATED("Location created successfully", result);
  }

  @Patch("/:id")
  @Summary("Cập nhật vị trí kho")
  async updateLocation(@Req() req: any, @Res() res: Response, @PathParams("id") id: number, @BodyParams() body: Location) {
    const result = await this.locationService.updateLocation(id, body);
    return res.OK("Location updated successfully", result);
  }

  @Delete("/:id")
  @Summary("Xóa vị trí kho")
  async deleteLocation(@Req() req: any, @Res() res: Response, @PathParams("id") id: number) {
    await this.locationService.deleteLocation(id);
    return res.OK("Location deleted successfully");
  }
}
