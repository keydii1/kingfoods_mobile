import { Docs } from "@tsed/swagger";
import { Controller, Inject } from "@tsed/di";
import { Post, Patch, Summary, Tags, Property, Returns } from "@tsed/schema";
import { BodyParams, Req, Res, HeaderParams } from "@tsed/common";
import { Request, Response } from "express";
import { LoginUserSchema, UserResetPasswordSchema } from "../../schemas/UserSchema";
import { Validator } from "../../decorators/Validator";
import { AppConfig } from "../../config/AppConfig";
import { UserAuthService } from "../../services/UserAuthService";

class LoginParams {
  @Property() username: string;
  @Property() password: string;
}

class ResetPasswordParams {
  @Property() password: string;
}

@Docs("auth")
@Controller("/auth/user")
@Tags("Auth - User/Staff")
export class UserAuthController {
  @Inject()
  userAuthService: UserAuthService;

  @Post("/init-admin")
  @Summary("Khởi tạo Admin đầu tiên")
  @Returns(201)
  async initAdmin(@Req() req: Request, @Res() res: Response, @HeaderParams("secret-key") secretKey: string, @BodyParams() body: any) {
    const result = await this.userAuthService.initAdmin(secretKey, body);
    return res.CREATED("First Admin initialized successfully", result);
  }

  @Post("/login")
  @Validator(LoginUserSchema)
  @Summary("Đăng nhập Nhân viên/Admin")
  async login(@Req() req: Request, @Res() res: Response, @BodyParams() body: LoginParams) {
    const result = await this.userAuthService.login(body);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.OK("Login successfully", { user: result.user, accessToken: result.accessToken });
  }

  @Post("/logout")
  @Summary("Đăng xuất")
  async logout(@Req() req: Request, @Res() res: Response) {
    res.clearCookie("refreshToken");
    return res.OK("User logged out successfully");
  }

  @Post("/forget-password")
  @Summary("Quên mật khẩu")
  async forgetPassword(@Req() req: Request, @Res() res: Response, @BodyParams("email") email: string) {
    const result = await this.userAuthService.forgetPassword(email);
    return res.OK("OTP sent successfully", result);
  }

  @Post("/verify-otp")
  @Summary("Xác thực OTP")
  async verifyOtp(@Req() req: Request, @Res() res: Response, @BodyParams("otp") otp: string, @BodyParams("email") email: string) {
    const result = await this.userAuthService.verifyOtp(email, otp);
    return res.OK("Verify OTP successfully", result);
  }

  @Patch("/reset-password")
  @Validator(UserResetPasswordSchema)
  @Summary("Đặt lại mật khẩu")
  async resetPassword(@Req() req: Request, @Res() res: Response, @HeaderParams("reset-token") resetToken: string, @BodyParams() body: ResetPasswordParams) {
    await this.userAuthService.resetPassword(resetToken, body);
    return res.OK("Password reset successfully");
  }
}
