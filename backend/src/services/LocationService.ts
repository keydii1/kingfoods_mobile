import { Service } from "@tsed/di";
import { Location } from "../Entity/Location";
import { BadRequest } from "../core/ErrorResponse";

@Service()
export class LocationService {
  async createLocation(body: any) {
    const existing = await Location.findOne({ where: { code: body.code } });
    if (existing) {
      throw new BadRequest("Location code already exists");
    }
    return await Location.createAndSave(body);
  }

  async updateLocation(id: number, body: any) {
    const location = await Location.getByIdOrFail(id);
    if (body.code && body.code !== location.code) {
      const existing = await Location.findOne({ where: { code: body.code } });
      if (existing) throw new BadRequest("Location code already exists");
    }
    return await location.update(body);
  }

  async deleteLocation(id: number) {
    const location = await Location.getByIdOrFail(id);
    return await location.softDelete();
  }

  async getAllLocations(query: any) {
    return await Location.paginate(query);
  }

  async getLocation(id: number) {
    return await Location.getByIdOrFail(id);
  }
}
