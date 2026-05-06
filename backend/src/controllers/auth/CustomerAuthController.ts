import { Controller, Inject } from "@tsed/di";
import { Post, Summary, Tags, Property } from "@tsed/schema";
import { BodyParams, Req, Res } from "@tsed/common";
import { Response } from "express";
import { Customer, AccountStatus } from "../../Entity/Customer";
import { LoginCustomerSchema, RegisterCustomerSchema } from "../../schemas/CustomerSchema";
import { Validator } from "../../decorators/Validator";
import { AppConfig } from "../../config/AppConfig";
import { CustomerAuthService } from "../../services/CustomerAuthService";

class CustomerLoginParams {
  @Property() email: string;
  @Property() password: string;
}

@Controller("/auth/customer")
@Tags("Auth - Customer")
export class CustomerAuthController {
  @Inject()
  customerAuthService: CustomerAuthService;

  @Post("/login")
  @Validator(LoginCustomerSchema)
  @Summary("Đăng nhập Khách hàng")
  async login(@Req() req: any, @Res() res: Response, @BodyParams() body: CustomerLoginParams) {
    const result = await this.customerAuthService.login(body);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.OK("Login successfully", { customer: result.customer, accessToken: result.accessToken });
  }

  @Post("/register")
  @Validator(RegisterCustomerSchema)
  @Summary("Đăng ký Khách hàng")
  async register(@Req() req: any, @Res() res: Response, @BodyParams() body: Customer) {
    const result = await this.customerAuthService.register(body);
    return res.CREATED("Customer registered successfully", result);
  }
}
