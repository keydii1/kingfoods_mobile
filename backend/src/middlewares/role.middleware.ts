import { Request, Response, NextFunction } from "express";
import { BadUser2RequestError } from "../core/error.response";
import asyncHandler from "../helpers/asyncHandler.helper";

export const adminOnly = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !user.isAdmin) {
      throw new BadUser2RequestError("Access denied. Admin rights required.");
    }
    next();
  },
);
