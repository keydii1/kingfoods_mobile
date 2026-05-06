import { Middleware, MiddlewareMethods, Err, Req, Res } from "@tsed/common";
import { Request, Response } from "express";
import { ErrorResponse, NotFound } from "../core/ErrorResponse";
import Logger from "../helpers/Logger";

/**
 * Middleware xử lý lỗi toàn cục
 * Mọi error được throw đều đi qua đây trước khi trả về client
 */
@Middleware()
// khi ghi này implements MiddlewareMethods  thì bắt buộc để tên method k là báo lỗi, còn k ghi thì muốn để gì cũng được hàm vẫn chạy bình thường
export class ErrorHandlerMiddleware implements MiddlewareMethods {
  use(@Err() err: any, @Req() req: Request, @Res() res: Response): Response {
    const statusCode =
      err instanceof ErrorResponse
        ? err.statusCode
        : err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const errorReason =
      err instanceof ErrorResponse ? err.errorReason : "INTERNAL_SERVER_ERROR";
    const errors = err instanceof ErrorResponse ? err.errors : undefined;

    // Bắt buộc phải log khi có lỗi
    Logger.error(
      `[${req.method} ${req.originalUrl}] [${statusCode}] ${message}`,
    );
    if (statusCode === 500 && err.stack) Logger.error(err.stack);

    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errorReason,
      errors,
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
