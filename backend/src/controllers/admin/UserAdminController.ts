import { Docs } from "@tsed/swagger";
import { Controller, Inject } from "@tsed/di";
import { Post, Get, Delete, Patch, Security, Summary, Tags, Property } from "@tsed/schema";
import { BodyParams, PathParams, Req, Res } from "@tsed/common";
import { Request, Response } from "express";
import { User, UserRole, UserStatus } from "../../Entity/User";
import { CreateUserSchema, UserUpdateSchema, ChangePasswordSchema } from "../../schemas/UserSchema";
import { Validator } from "../../decorators/Validator";
import { UserService } from "../../services/UserService";

class ChangePasswordParams {
  @Property() oldPassword: string;
  @Property() newPassword: string;
}

@Docs("admin")
@Controller("/admin/users")
@Tags("Admin - Users")
@Security("bearer")
export class UserAdminController {
  @Inject()
  userService: UserService;

  @Post("/")
  @Validator(CreateUserSchema)
  @Summary("Tạo nhân viên mới")
  async register(@Req() req: Request, @Res() res: Response, @BodyParams() body: User) {
    const result = await this.userService.register(body);
    return res.CREATED("User created successfully", result);
  }

  @Patch("/change-password")
  @Validator(ChangePasswordSchema)
  @Summary("Đổi mật khẩu nhân viên (Yêu cầu login)")
  async changePassword(@Req() req: any, @Res() res: Response, @BodyParams() body: ChangePasswordParams) {
    await this.userService.changePassword(req.decodeUser.id, body);
    return res.OK("Password changed successfully");
  }

  @Get("/")
  @Summary("Lấy danh sách nhân viên")
  async getListUser(@Req() req: Request, @Res() res: Response) {
    const users = await this.userService.getListUser();
    return res.OK("Users fetched successfully", users);
  }

  @Get("/:id")
  @Summary("Chi tiết nhân viên")
  async getUser(@Req() req: Request, @Res() res: Response, @PathParams("id") id: number) {
    const user = await this.userService.getUser(id);
    return res.OK("User fetched successfully", user);
  }

  @Patch("/:id")
  @Validator(UserUpdateSchema)
  @Summary("Cập nhật nhân viên")
  async updateUser(@Req() req: Request, @Res() res: Response, @PathParams("id") id: number, @BodyParams() body: User) {
    const result = await this.userService.updateUser(id, body);
    return res.OK("User updated successfully", result);
  }

  @Delete("/:id")
  @Summary("Xóa nhân viên")
  async deleteUser(@Req() req: Request, @Res() res: Response, @PathParams("id") id: number) {
    await this.userService.deleteUser(id);
    return res.OK("User deleted successfully");
  }
}
