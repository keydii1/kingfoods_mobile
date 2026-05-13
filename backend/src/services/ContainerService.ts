import { Service } from "@tsed/di";
import { Container } from "../Entity/Container";
import { BadRequest } from "../core/ErrorResponse";

@Service()
export class ContainerService {
  async createContainer(body: any) {
    const existing = await Container.findOne({ where: { code: body.code } });
    if (existing) {
      throw new BadRequest("Container code already exists");
    }
    return await Container.createAndSave(body);
  }

  async updateContainer(id: number, body: any) {
    const container = await Container.getByIdOrFail(id);
    if (body.code && body.code !== container.code) {
      const existing = await Container.findOne({ where: { code: body.code } });
      if (existing) throw new BadRequest("Container code already exists");
    }
    return await container.update(body);
  }

  async deleteContainer(id: number) {
    const container = await Container.getByIdOrFail(id);
    return await container.softDelete();
  }

  async getAllContainers(query: any) {
    return await Container.paginate(query);
  }

  async getContainer(id: number) {
    return await Container.getByIdOrFail(id, {
      relations: ["items", "items.product", "items.pickedBy"]
    });
  }
}
