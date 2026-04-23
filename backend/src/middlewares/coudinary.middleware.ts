import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import type { Request, Response, NextFunction } from "express";
import cloudinaryConfig from "../configs/coudinary.config";
cloudinaryConfig();
import asyncHandler from "../helpers/asyncHandler.helper";
export const uploadImage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const file = (req as any).file;
    if (!file) {
      return next();
    }
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "products",
      transformation: [{ width: 800, crop: "scale", quality: "auto" }],
    });
    fs.unlinkSync(file.path);
    req.body.image = result.secure_url;
    return next();
  },
);
