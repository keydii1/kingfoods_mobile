import { Controller, Inject } from "@tsed/di";
import { Get, Patch, Security, Summary, Tags, Property } from "@tsed/schema";
import { BodyParams, Req, Res } from "@tsed/common";
import { Response } from "express";
import { Customer } from "../../Entity/Customer";
import { CustomerChangePasswordSchema } from "../../schemas/CustomerSchema";
import { Validator } from "../../decorators/Validator";
import { BadRequest } from "../../core/ErrorResponse";
import * as bcrypt from "bcrypt";
import { AppConfig } from "../../config/AppConfig";

class ChangePasswordParams {
  @Property() oldPassword: string;
  @Property() newPassword: string;
}

@Controller("/client/profile")
@Tags("Client - Profile")
@Security("bearer")
export class CustomerProfileController {
  @Get("/")
  @Summary("Thông tin cá nhân")
  async getProfile(@Req() req: any, @Res() res: Response) {
    const customer = await Customer.getByIdOrFail(req.decodeUser.id);
    return res.OK("Profile fetched successfully", customer);
  }

  @Patch("/")
  @Summary("Cập nhật hồ sơ")
  async updateProfile(@Req() req: any, @Res() res: Response, @BodyParams() body: Customer) {
    const customer = await Customer.getByIdOrFail(req.decodeUser.id);
    const result = await customer.update(body);
    return res.OK("Profile updated successfully", result);
  }

  @Patch("/change-password")
  @Validator(CustomerChangePasswordSchema)
  @Summary("Đổi mật khẩu")
  async changePassword(@Req() req: any, @Res() res: Response, @BodyParams() body: ChangePasswordParams) {
    const { oldPassword, newPassword } = body;
    const customer = await Customer.getByIdOrFail(req.decodeUser.id, {
      select: ["id", "password"]
    });

    const isMatch = await bcrypt.compare(oldPassword, customer.password);
    if (!isMatch) throw new BadRequest("Old password is incorrect");

    const hashedPassword = await bcrypt.hash(newPassword, AppConfig.SALT_ROUNDS);
    await customer.update({ password: hashedPassword });

    return res.OK("Password changed successfully");
  }
}
