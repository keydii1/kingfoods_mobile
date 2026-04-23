import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../auth/auth.util";
import { BadUserRequestError } from "../core/error.response";
import asyncHandler from "../helpers/asyncHandler.helper";

export const authentication = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new BadUserRequestError("Invalid authorization header");
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = verifyToken(token);
      (req as any).user = decoded;
      next();
    } catch (error) {
      throw new BadUserRequestError("Invalid or expired token");
    }
  },
);
