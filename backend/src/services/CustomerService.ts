import { Service } from "@tsed/di";
import { Customer, AccountStatus } from "../Entity/Customer";
import { Branch } from "../Entity/Branch";
import { BadRequest } from "../core/ErrorResponse";
import * as bcrypt from "bcrypt";
import { AppConfig } from "../config/AppConfig";

@Service()
export class CustomerService {
  async getAllCustomers(query: any) {
    return await Customer.paginate(query, {
      relations: ["branch"]
    });
  }

  async getCustomerById(id: number) {
    return await Customer.getByIdOrFail(id, {
      relations: ["branch"]
    });
  }

  async createCustomer(body: any) {
    const { name, email, password, branchId, phoneNumber, status } = body;

    const exists = await Customer.isExists({ email });
    if (exists) throw new BadRequest("Email already exists");

    const branchExists = await Branch.isExists({ id: branchId });
    if (!branchExists) throw new BadRequest(`Branch with ID ${branchId} does not exist`);

    const hashedPassword = await bcrypt.hash(password, AppConfig.SALT_ROUNDS);

    return await Customer.createAndSave({
      name,
      email,
      password: hashedPassword,
      branchId,
      phoneNumber,
      status: status || AccountStatus.ACTIVE,
    });
  }

  async updateCustomer(id: number, body: any) {
    const customer = await Customer.getByIdOrFail(id);

    if (body.email && body.email !== customer.email) {
      const exists = await Customer.isExists({ email: body.email });
      if (exists) throw new BadRequest("Email already exists");
    }

    if (body.branchId) {
      const branchExists = await Branch.isExists({ id: body.branchId });
      if (!branchExists) throw new BadRequest(`Branch with ID ${body.branchId} does not exist`);
    }

    if (body.password) {
      body.password = await bcrypt.hash(body.password, AppConfig.SALT_ROUNDS);
    }

    return await customer.update(body);
  }

  async deleteCustomer(id: number) {
    const customer = await Customer.getByIdOrFail(id);
    return await customer.softDelete();
  }
}
