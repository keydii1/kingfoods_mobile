import { Middleware, MiddlewareMethods, Req, Res, Next } from "@tsed/common";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      decodeUser: any;
    }
  }
}

@Middleware()
export class RequestIdMiddleware implements MiddlewareMethods {
  use(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    req.requestId = uuidv4();
    res.setHeader("X-Request-Id", req.requestId);
    next();
  }
}
