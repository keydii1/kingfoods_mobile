import { Service } from "@tsed/di";
import { User, UserRole, UserStatus } from "../Entity/User";
import { Unauthorized, BadRequest, NotFound } from "../core/ErrorResponse";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { AppConfig } from "../config/AppConfig";
import generateOTP from "../helpers/GenerateOTP";
import { createAccessToken, createRefreshToken } from "../auth/TokenService";

@Service()
export class UserAuthService {
  async initAdmin(secretKey: string, body: any) {
    if (secretKey !== AppConfig.ADMIN_SECRET_KEY)
      throw new Unauthorized("Invalid secret key");

    const count = await User.count();
    if (count > 0) throw new BadRequest("Admin already initialized");

    const { name, username, password, email } = body;
    const hashedPassword = await bcrypt.hash(password, AppConfig.SALT_ROUNDS);

    const admin = new User({
      name,
      username,
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    return await admin.save();
  }

  async login(body: any) {
    const { username, password } = body;
    const user = await User.findOneAndIncludePassword({ username });

    if (!user) throw new Unauthorized("Invalid username or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Unauthorized("Invalid username or password");

    if (user.status !== UserStatus.ACTIVE)
      throw new Unauthorized("User is inactive");
    delete user.password;
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    return { user, accessToken, refreshToken };
  }

  async forgetPassword(email: string) {
    const user = await User.findOneBy({ email });
    if (!user) throw new NotFound("User with this email not found");

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    console.log(`OTP for ${email}: ${otp}`);
    return { email };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await User.findOneBy({ email, otp });
    if (!user) throw new BadRequest("Invalid OTP");

    if (user.otpExpire && user.otpExpire < new Date()) {
      throw new BadRequest("OTP expired");
    }

    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      AppConfig.JWT_SECRET,
      {
        expiresIn: "10m",
      },
    );

    user.otp = null;
    user.otpExpire = null;
    await user.save();

    return { resetToken };
  }

  async resetPassword(resetToken: string, body: any) {
    try {
      const decoded = jwt.verify(resetToken, AppConfig.JWT_SECRET) as any;
      const user = await User.findOneBy({ id: decoded.id });
      if (!user) throw new NotFound("User not found");

      user.password = await bcrypt.hash(body.password, AppConfig.SALT_ROUNDS);
      await user.save();
      return true;
    } catch (error) {
      throw new BadRequest("Invalid or expired reset token");
    }
  }
}
