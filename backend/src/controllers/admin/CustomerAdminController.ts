import { Docs } from "@tsed/swagger";
import { Controller } from "@tsed/di";
import {
  Post,
  Delete,
  Patch,
  Get,
  Security,
  Summary,
  Tags,
} from "@tsed/schema";
import { BodyParams, PathParams, Req, Res, QueryParams } from "@tsed/common";
import { Request, Response } from "express";
import { Customer } from "../../Entity/Customer";
import { CustomerService } from "../../services/CustomerService";
import {
  CreateCustomerAdminSchema,
  UpdateCustomerAdminSchema,
} from "../../schemas/CustomerSchema";
import { Validator } from "../../decorators/Validator";

@Docs("admin")
@Controller("/admin/customers")
@Tags("Admin - Customers")
@Security("bearer")
export class CustomerAdminController {
  constructor(private customerService: CustomerService) {}

  @Get("/")
  @Summary("Xem danh sách cửa hàng (có phân trang)")
  async getAllCustomers(
    @Req() req: Request,
    @Res() res: Response,
    @QueryParams() query: any,
  ) {
    const result = await this.customerService.getAllCustomers(query);
    return res.OK("Customers fetched successfully", result);
  }

  @Get("/:id")
  @Summary("Xem chi tiết cửa hàng")
  async getCustomerById(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
  ) {
    const result = await this.customerService.getCustomerById(id);
    return res.OK("Customer fetched successfully", result);
  }

  @Post("/")
  @Validator(CreateCustomerAdminSchema)
  @Summary("Tạo cửa hàng mới")
  async createCustomer(
    @Req() req: any,
    @Res() res: Response,
    @BodyParams() body: Customer,
  ) {
    const result = await this.customerService.createCustomer(body);
    return res.CREATED("Customer created successfully", result);
  }

  @Patch("/:id")
  @Validator(UpdateCustomerAdminSchema)
  @Summary("Cập nhật cửa hàng")
  async updateCustomer(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
    @BodyParams() body: Customer,
  ) {
    const result = await this.customerService.updateCustomer(id, body);
    return res.OK("Customer updated successfully", result);
  }

  @Delete("/:id")
  @Summary("Xóa cửa hàng")
  async deleteCustomer(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
  ) {
    await this.customerService.deleteCustomer(id);
    return res.OK("Customer deleted successfully");
  }
}
