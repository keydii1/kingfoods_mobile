import { Service } from "@tsed/di";
import { User, UserRole, UserStatus } from "../Entity/User";
import { BadRequest } from "../core/ErrorResponse";
import * as bcrypt from "bcrypt";
import { AppConfig } from "../config/AppConfig";

@Service()
export class UserService {
  async register(body: any) {
    const { name, username, password, email, assignedLocationId, role } = body;

    const exists = await User.isExists([{ username }, { email }]);
    if (exists) throw new BadRequest("Username or Email already exists");

    const hashedPassword = await bcrypt.hash(password, AppConfig.SALT_ROUNDS);

    return await User.createAndSave({
      name,
      username,
      email,
      password: hashedPassword,
      role: role || UserRole.STAFF,
      status: UserStatus.ACTIVE,
      assignedLocationId: assignedLocationId || null,
    });
  }

  async changePassword(userId: number, body: any) {
    const user = await User.getByIdOrFail(userId, {
      select: ["id", "password"],
    });

    const isMatch = await bcrypt.compare(body.oldPassword, user.password);
    if (!isMatch) throw new BadRequest("Old password is incorrect");

    const hashedPassword = await bcrypt.hash(
      body.newPassword,
      AppConfig.SALT_ROUNDS,
    );
    await user.update({ password: hashedPassword });
    return true;
  }

  async getListUser() {
    return await User.find();
  }

  async getUser(id: number) {
    return await User.getByIdOrFail(id);
  }

  async updateUser(id: number, body: any) {
    const user = await User.getByIdOrFail(id);
    return await user.update(body);
  }

  async deleteUser(id: number) {
    const user = await User.getByIdOrFail(id);
    return await user.softDelete();
  }
}
