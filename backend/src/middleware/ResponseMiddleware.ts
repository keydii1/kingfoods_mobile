import { Middleware, MiddlewareMethods, Req, Res, Next } from "@tsed/common";
import { Request, Response, NextFunction } from "express";
import { StatusCode } from "../core/StatusCode";

declare global {
  namespace Express {
    interface Response {
      /**
       * Gửi phản hồi thành công (HTTP 200 OK)
       * 
       * @param message Lời nhắn gửi cho Front-end (Ví dụ: "Đăng nhập thành công")
       * @param metadata Dữ liệu đính kèm (Ví dụ: { token, user })
       * @returns Trả về Express Response
       */
      OK(message?: string, metadata?: any): Response;

      /**
       * Gửi phản hồi tạo mới thành công (HTTP 201 Created)
       * 
       * @param message Lời nhắn gửi cho Front-end (Ví dụ: "Tạo user thành công")
       * @param metadata Dữ liệu trả về (Ví dụ: { newUser })
       * @returns Trả về Express Response
       */
      CREATED(message?: string, metadata?: any): Response;
    }
  }
}

@Middleware()
export class ResponseMiddleware implements MiddlewareMethods {
  use(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    /**
     * Định nghĩa method OK() viết hoa
     */
    res.OK = (message: string = "OK", metadata: any = {}) => {
      return res.status(StatusCode.OK).json({
        success: true,
        statusCode: StatusCode.OK,
        message,
        metadata,
      });
    };

    /**
     * Định nghĩa method CREATED() viết hoa
     */
    res.CREATED = (message: string = "Created", metadata: any = {}) => {
      return res.status(StatusCode.CREATED).json({
        success: true,
        statusCode: StatusCode.CREATED,
        message,
        metadata,
      });
    };

    next();
  }
}
