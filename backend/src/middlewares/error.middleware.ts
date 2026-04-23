import { NextFunction, Request, Response } from "express";
import { ErrorResponse, BadRequestError } from "../core/error.response";

const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Handle our custom ErrorResponse
  if (err instanceof ErrorResponse) {
    return err.send(res);
  }

  // Standard error response
  return res.status(statusCode).json({
    status: "Error",
    code: statusCode,
    message: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default errorMiddleware;
