import { Service } from "@tsed/di";
import { Customer, AccountStatus } from "../Entity/Customer";
import { Unauthorized, BadRequest } from "../core/ErrorResponse";
import * as bcrypt from "bcrypt";
import { AppConfig } from "../config/AppConfig";
import { createAccessToken, createRefreshToken } from "../auth/TokenService";

@Service()
export class CustomerAuthService {
  async login(body: any) {
    const { email, password } = body;
    const customer = await Customer.findOneAndIncludePassword({ email });

    if (!customer) throw new Unauthorized("Invalid email or password");

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) throw new Unauthorized("Invalid email or password");

    if (customer.status !== AccountStatus.ACTIVE)
      throw new Unauthorized("Account is inactive");

    delete (customer as any).password;

    const accessToken = createAccessToken(customer);
    const refreshToken = createRefreshToken(customer);

    return { customer, accessToken, refreshToken };
  }

  async register(body: any) {
    const { email, password, name, phone } = body;

    const existing = await Customer.findOneBy({ email });
    if (existing) throw new BadRequest("Email already registered");

    const hashedPassword = await bcrypt.hash(password, AppConfig.SALT_ROUNDS);

    const customer = new Customer({
      name,
      email,
      password: hashedPassword,
      phone,
      status: AccountStatus.ACTIVE,
    });

    return await customer.save();
  }
}
