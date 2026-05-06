import { Service } from "@tsed/di";
import { Customer } from "../Entity/Customer";

@Service()
export class CustomerService {
  async getAllCustomers(query: any) {
    return await Customer.paginate(query);
  }

  async deleteCustomer(id: number) {
    const customer = await Customer.getByIdOrFail(id);
    return await customer.softDelete();
  }
}
