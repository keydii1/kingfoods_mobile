import { Request, Response, NextFunction } from "express";
import Branch from "../models/branch.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError } from "../core/error.response";
import asyncHandler from "../helpers/asyncHandler.helper";

class BranchController {
  create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    new CREATED({
      message: "Branch created successfully",
      metadata: await Branch.create(req.body),
    }).send(res);
  });

  getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    new OK({
      message: "Get all branches successfully",
      metadata: await Branch.find({}),
    }).send(res);
  });

  getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const branch = await Branch.findById(req.params.id);
    if (!branch) throw new BadRequestError("Branch not found");
    new OK({
      message: "Get branch successfully",
      metadata: branch,
    }).send(res);
  });

  update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!branch) throw new BadRequestError("Branch not found");
    new OK({
      message: "Branch updated successfully",
      metadata: branch,
    }).send(res);
  });

  delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) throw new BadRequestError("Branch not found");
    new OK({
      message: "Branch deleted successfully",
      metadata: branch,
    }).send(res);
  });
}

export default new BranchController();
