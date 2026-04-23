import { Request, Response, NextFunction } from "express";
import Location from "../models/location.model";
import { OK, CREATED } from "../core/success.response";
import { BadRequestError } from "../core/error.response";
import asyncHandler from "../helpers/asyncHandler.helper";

class LocationController {
  create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    new CREATED({
      message: "Location created successfully",
      metadata: await Location.create(req.body),
    }).send(res);
  });

  getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    new OK({
      message: "Get all locations successfully",
      metadata: await Location.find({}),
    }).send(res);
  });

  getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const location = await Location.findById(req.params.id);
    if (!location) throw new BadRequestError("Location not found");
    new OK({
      message: "Get location successfully",
      metadata: location,
    }).send(res);
  });

  update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!location) throw new BadRequestError("Location not found");
    new OK({
      message: "Location updated successfully",
      metadata: location,
    }).send(res);
  });

  delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) throw new BadRequestError("Location not found");
    new OK({
      message: "Location deleted successfully",
      metadata: location,
    }).send(res);
  });
}

export default new LocationController();
