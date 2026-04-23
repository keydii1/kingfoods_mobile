import { Controller } from "@tsed/common";
import { Get, Post, Put, Delete } from "@tsed/schema";
import { BodyParams, PathParams, UseBefore } from "@tsed/platform-express";
import Location from "../models/location.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError } from "../core/error.response";
import { authentication } from "../middlewares/auth.middleware";
import { adminOnly } from "../middlewares/role.middleware";

@Controller("/locations")
export class LocationController {
  @Post("/")
  @UseBefore(authentication)
  @UseBefore(adminOnly)
  async create(@BodyParams() body: any) {
    const location = await Location.create(body);
    return new CREATED({
      message: "Location created successfully",
      metadata: location,
    });
  }

  @Get("/")
  async getAll() {
    const locations = await Location.find({});
    return new OK({
      message: "Get all locations successfully",
      metadata: locations,
    });
  }

  @Get("/:id")
  async getById(@PathParams("id") id: string) {
    const location = await Location.findById(id);
    if (!location) throw new BadRequestError("Location not found");
    return new OK({
      message: "Get location successfully",
      metadata: location,
    });
  }

  @Put("/:id")
  @UseBefore(authentication)
  @UseBefore(adminOnly)
  async update(@PathParams("id") id: string, @BodyParams() body: any) {
    const location = await Location.findByIdAndUpdate(id, body, { new: true });
    if (!location) throw new BadRequestError("Location not found");
    return new OK({
      message: "Location updated successfully",
      metadata: location,
    });
  }

  @Delete("/:id")
  @UseBefore(authentication)
  @UseBefore(adminOnly)
  async delete(@PathParams("id") id: string) {
    const location = await Location.findByIdAndDelete(id);
    if (!location) throw new BadRequestError("Location not found");
    return new OK({
      message: "Location deleted successfully",
      metadata: location,
    });
  }
}
