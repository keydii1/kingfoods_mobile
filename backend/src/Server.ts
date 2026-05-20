import { Configuration, PlatformApplication } from "@tsed/common";
import "@tsed/platform-express";
import "@tsed/ajv";
import "@tsed/swagger";
import "@tsed/typeorm";
import { AppDataSource } from "./config/DataSource";
import { ErrorHandlerMiddleware } from "./middleware/ErrorHandlerMiddleware";
import { RequestIdMiddleware } from "./middleware/RequestIdMiddleware";
import { LoggerMiddleware } from "./middleware/LoggerMiddleware";
import { ResponseMiddleware } from "./middleware/ResponseMiddleware";
import { AuthMiddleware } from "./middleware/AuthMiddleware";
import { AppConfig } from "./config/AppConfig";
import * as controllers from "./controllers";
import { Request, Response } from "express";

@Configuration({
  rootDir: __dirname,
  acceptMimes: ["application/json"],
  httpPort: AppConfig.PORT,
  mount: {
    "/api/v1": [...Object.values(controllers)],
  },
  imports: [`${__dirname}/services/**/*.{ts,js}`, `${__dirname}/middleware/**/*.{ts,js}`],
  //
  swagger: [
    {
      path: "/api-docs/admin",
      doc: "admin",
      spec: {
        openapi: "3.0.1",
        info: {
          title: "KingFoods Admin API",
          description: "Tài liệu API dành cho Quản lý kho tổng",
          version: "1.1.0",
        },
        components: {
          securitySchemes: { bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
        },
      },
    },
    {
      path: "/api-docs/staff",
      doc: "staff",
      spec: {
        openapi: "3.0.1",
        info: {
          title: "KingFoods Staff API",
          description: "Tài liệu API dành cho Nhân viên kho",
          version: "1.1.0",
        },
        components: {
          securitySchemes: { bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
        },
      },
    },
    {
      path: "/api-docs/customer",
      doc: "customer",
      spec: {
        openapi: "3.0.1",
        info: {
          title: "KingFoods Customer API",
          description: "Tài liệu API dành cho Quản lý chi nhánh / Cửa hàng",
          version: "1.1.0",
        },
        components: {
          securitySchemes: { bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
        },
      },
    },
    {
      path: "/api-docs/auth",
      doc: "auth",
      spec: {
        openapi: "3.0.1",
        info: {
          title: "KingFoods Auth API",
          description: "Tài liệu API Xác thực (Đăng nhập) cho tất cả các Role",
          version: "1.1.0",
        },
        components: {
          securitySchemes: { bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
        },
      },
    }
  ],
  typeorm: [
    {
      name: "default",
      ...AppDataSource.options,
    } as any,
  ],
  // nếu file @ middleware đó có code nhưng k khai báo trong này thì nó k chạy
  // còn nếu k import ở đây thì ở file controller thì bạn phải import vào, và sử dụng hàm use ở mỗi route rất cực
  middlewares: [
    "cors",
    "cookie-parser",
    "compression",
    "method-override",
    { use: "json-parser", options: { limit: "50mb" } },
    { use: "urlencoded-parser", options: { limit: "50mb", extended: true } },
    RequestIdMiddleware,
    ResponseMiddleware,
    AuthMiddleware,
    //Việc đặt Logger ở middlewares chỉ là để Xí chỗ bấm giờ
    // và Cài bẫy. Còn hành động in Log thực sự lại diễn ra ở tận Phút chót (sau khi Controller đã làm xong xuôi)! Đó là sự kỳ diệu của NodeJS!
    LoggerMiddleware,
  ],
})
export class Server {
  constructor(protected app: PlatformApplication) {}

  $afterRoutesInit() {
    this.app.use(ErrorHandlerMiddleware);
    // tất cả các route không tìm thấy sẽ trả về 404
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        statusCode: 404,
        message: `Route ${req.method} ${req.originalUrl} không tồn tại`,
        errorReason: "NOT_FOUND",
      });
    });
  }
}
