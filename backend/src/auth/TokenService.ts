import jwt from "jsonwebtoken";
import { AppConfig } from "../config/AppConfig";
import { Unauthorized } from "../core/ErrorResponse";

export const createAccessToken = (payload: any): string =>
  jwt.sign({ id: payload.id, email: payload.email, role: payload.role }, AppConfig.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: AppConfig.JWT_ACCESS_EXPIRES,
  });

export const createRefreshToken = (payload: any): string =>
  jwt.sign({ id: payload.id, email: payload.email, role: payload.role }, AppConfig.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: AppConfig.JWT_REFRESH_EXPIRES,
  });

export const createResetToken = (payload: object): string =>
  jwt.sign(payload, AppConfig.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: AppConfig.JWT_RESET_EXPIRES,
  });

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, AppConfig.JWT_SECRET);
  } catch {
    return null;
  }
};
