import { Middleware, MiddlewareMethods, Req, Res } from "@tsed/common";
import { Request, Response } from "express";
import Logger from "../helpers/Logger";

@Middleware()
export class LoggerMiddleware implements MiddlewareMethods {
  use(@Req() req: Request, @Res() res: Response) {
    const start = Date.now();
    const { method, url } = req;
    const timestamp = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    res.on("finish", () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      const colors = {
        reset: "\x1b[0m",
        bright: "\x1b[1m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        red: "\x1b[31m",
        cyan: "\x1b[36m",
      };

      let statusColor = colors.green;
      if (statusCode >= 400) statusColor = colors.yellow;
      if (statusCode >= 500) statusColor = colors.red;

      Logger.info(
        `${method} ${url} ${statusCode} - ${duration}ms`
      );
    });
  }
}
