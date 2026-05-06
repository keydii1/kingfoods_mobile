import { Controller, Inject } from "@tsed/di";
import {
  Get,
  Delete,
  Security,
  Summary,
  Tags,
  Property,
  Default,
} from "@tsed/schema";
import { PathParams, Req, Res, QueryParams } from "@tsed/common";
import { Response } from "express";
import { Customer } from "../../Entity/Customer";
import { CustomerService } from "../../services/CustomerService";
import { PaginationSchema } from "../../schemas/PaginationSchema";
import { Validator } from "../../decorators/Validator";

class PaginationParams {
  @Property() @Default(1) page?: number;
  @Property() @Default(10) limit?: number;
  @Property() @Default("id") sortKey?: string;
  @Property() @Default("ASC") sortValue?: string;
}

@Controller("/admin/customers")
@Tags("Admin - Customers")
@Security("bearer")
export class CustomerAdminController {
  @Inject()
  customerService: CustomerService;

  @Get("/")
  @Validator(PaginationSchema)
  @Summary("Danh sách khách hàng")
  async getAllCustomers(
    @Req() req: any,
    @Res() res: Response,
    @QueryParams() query: PaginationParams,
  ) {
    const result = await this.customerService.getAllCustomers(query);
    return res.OK("Customers fetched successfully", result);
  }

  @Delete("/:id")
  @Summary("Xóa khách hàng")
  async deleteCustomer(
    @Req() req: any,
    @Res() res: Response,
    @PathParams("id") id: number,
  ) {
    await this.customerService.deleteCustomer(id);
    return res.OK("Customer deleted successfully");
  }
}
