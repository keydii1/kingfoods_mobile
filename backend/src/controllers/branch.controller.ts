import { Controller } from "@tsed/common";
import { Get, Post, Put, Delete } from "@tsed/schema";
import { BodyParams, PathParams, UseBefore } from "@tsed/platform-express";
import Branch from "../models/branch.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError } from "../core/error.response";
import { authentication } from "../middlewares/auth.middleware";
import { adminOnly } from "../middlewares/role.middleware";

@Controller("/branches")
export class BranchController {
  @Post("/")
  @UseBefore(authentication)
  @UseBefore(adminOnly)
  async create(@BodyParams() body: any) {
    const branch = await Branch.create(body);
    return new CREATED({
      message: "Branch created successfully",
      metadata: branch,
    });
  }

  @Get("/")
  async getAll() {
    const branches = await Branch.find({});
    return new OK({
      message: "Get all branches successfully",
      metadata: branches,
    });
  }

  @Get("/:id")
  async getById(@PathParams("id") id: string) {
    const branch = await Branch.findById(id);
    if (!branch) throw new BadRequestError("Branch not found");
    return new OK({
      message: "Get branch successfully",
      metadata: branch,
    });
  }

  @Put("/:id")
  @UseBefore(authentication)
  @UseBefore(adminOnly)
  async update(@PathParams("id") id: string, @BodyParams() body: any) {
    const branch = await Branch.findByIdAndUpdate(id, body, { new: true });
    if (!branch) throw new BadRequestError("Branch not found");
    return new OK({
      message: "Branch updated successfully",
      metadata: branch,
    });
  }

  @Delete("/:id")
  @UseBefore(authentication)
  @UseBefore(adminOnly)
  async delete(@PathParams("id") id: string) {
    const branch = await Branch.findByIdAndDelete(id);
    if (!branch) throw new BadRequestError("Branch not found");
    return new OK({
      message: "Branch deleted successfully",
      metadata: branch,
    });
  }
}
