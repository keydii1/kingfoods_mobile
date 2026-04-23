import { Controller } from "@tsed/common";
import { Get, Post, Put, Delete } from "@tsed/schema";
import { BodyParams, PathParams } from "@tsed/platform-express";
import User from "../models/user.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError, BadUserRequestError } from "../core/error.response";
import { createToken } from "../auth/auth.util";
import bcrypt from "bcrypt";

@Controller("/users")
export class UserController {
  @Post("/login")
  async login(@BodyParams() body: any) {
    const { username, password } = body;
    const user = await User.findOne({ username });
    if (!user) throw new BadUserRequestError("Invalid username or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new BadUserRequestError("Invalid username or password");

    const token = createToken({ userId: user._id, isAdmin: user.isAdmin });

    return new OK({
      message: "Login successfully",
      metadata: { user, token },
    });
  }

  @Post("/")
  async create(@BodyParams() body: any) {
    const { password } = body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ ...body, password: hashedPassword });

    return new CREATED({
      message: "User created successfully",
      metadata: newUser,
    });
  }

  @Get("/")
  async getAll() {
    const users = await User.find({});
    return new OK({
      message: "Get all users successfully",
      metadata: users,
    });
  }

  @Get("/:id")
  async getById(@PathParams("id") id: string) {
    const user = await User.findById(id);
    if (!user) throw new BadRequestError("User not found");
    return new OK({
      message: "Get user successfully",
      metadata: user,
    });
  }

  @Put("/:id")
  async update(@PathParams("id") id: string, @BodyParams() body: any) {
    const user = await User.findByIdAndUpdate(id, body, { new: true });
    if (!user) throw new BadRequestError("User not found");
    return new OK({
      message: "User updated successfully",
      metadata: user,
    });
  }

  @Delete("/:id")
  async delete(@PathParams("id") id: string) {
    const user = await User.findByIdAndDelete(id);
    if (!user) throw new BadRequestError("User not found");
    return new OK({
      message: "User deleted successfully",
      metadata: user,
    });
  }
}
