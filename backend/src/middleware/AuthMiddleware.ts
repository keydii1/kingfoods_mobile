import { Middleware, MiddlewareMethods, Req, Context } from "@tsed/common";
import { Unauthorized, Forbidden } from "../core/ErrorResponse";
import * as jwt from "jsonwebtoken";
import { AppConfig } from "../config/AppConfig";
import { User, UserRole } from "../Entity/User";
import { Customer } from "../Entity/Customer";

@Middleware()
export class AuthMiddleware implements MiddlewareMethods {
  async use(@Req() req: any, @Context() ctx: Context) {
    const path = req.originalUrl;

    // 1. Bỏ qua các route công khai (Public / Auth / Swagger)
    const publicPaths = ["/auth/", "/public/", "/api-docs", "/"];
    
    // Nếu là root "/" chính xác thì cũng bỏ qua
    if (path === "/" || publicPaths.some((p) => p !== "/" && path.includes(p))) {
      return;
    }

    // 2. Kiểm tra Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Unauthorized("No token provided");
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, AppConfig.JWT_SECRET);
    } catch (error) {
      throw new Unauthorized("Invalid or expired token");
    }

    // 3. Phân quyền dựa trên Route Path

    // TRƯỜNG HỢP: ADMIN/STAFF ROUTES
    if (path.includes("/admin/")) {
      const user = await User.findOneBy({ id: decoded.id });
      if (!user)
        throw new Unauthorized("User not found or you are not a staff/admin");

      if (user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF) {
        throw new Forbidden("Access denied. Admin or Staff role required.");
      }

      req.decodeUser = user;
      return;
    }

    // TRƯỜNG HỢP: CLIENT ROUTES
    if (path.includes("/client/")) {
      const customer = await Customer.findOneBy({ id: decoded.id });
      if (!customer) throw new Unauthorized("Customer not found");

      req.decodeUser = customer;
      return;
    }
  }
}
