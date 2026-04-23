import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError, BadUserRequestError } from "../core/error.response";
import asyncHandler from "../helpers/asyncHandler.helper";
import { createToken } from "../auth/auth.util";
import bcrypt from "bcrypt";

class UserController {
  login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) throw new BadUserRequestError("Invalid username or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new BadUserRequestError("Invalid username or password");

    const token = createToken({ userId: user._id, isAdmin: user.isAdmin });

    new OK({
      message: "Login successfully",
      metadata: { user, token },
    }).send(res);
  });

  create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ ...req.body, password: hashedPassword });

    new CREATED({
      message: "User created successfully",
      metadata: newUser,
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
