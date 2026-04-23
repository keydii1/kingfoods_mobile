import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError } from "../core/error.response";
import asyncHandler from "../helpers/asyncHandler.helper";

class UserController {
  create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    new CREATED({
      message: "User created successfully",
      metadata: await User.create(req.body),
    }).send(res);
  });

  getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    new OK({
      message: "Get all users successfully",
      metadata: await User.find({}),
    }).send(res);
  });

  getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new BadRequestError("User not found");
    new OK({
      message: "Get user successfully",
      metadata: user,
    }).send(res);
  });

  update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) throw new BadRequestError("User not found");
    new OK({
      message: "User updated successfully",
      metadata: user,
    }).send(res);
  });

  delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new BadRequestError("User not found");
    new OK({
      message: "User deleted successfully",
      metadata: user,
    }).send(res);
  });
}

export default new UserController();
