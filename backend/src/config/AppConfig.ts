import dotenv from "dotenv";
dotenv.config();

export class AppConfig {
  static readonly PORT = process.env.PORT || 3000;
  static readonly JWT_SECRET = process.env.JWT_SECRET!;
  static readonly JWT_ACCESS_EXPIRES = "15m";
  static readonly JWT_REFRESH_EXPIRES = "7d";
  static readonly JWT_RESET_EXPIRES = "3m";
  static readonly SALT_ROUNDS = 10;
  static readonly TABLE_PREFIX = "KingFood_";
  static readonly OTP_EXPIRE_MINUTES = 10;
  static readonly ADMIN_SECRET_KEY =
    process.env.ADMIN_SECRET_KEY || "KingFood_secret_2026";
}
