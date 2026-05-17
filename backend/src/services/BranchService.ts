import { Service } from "@tsed/di";
import { Branch, BranchStatus } from "../Entity/Branch";

@Service()
export class BranchService {
  async createBranch(body: any) {
    return await Branch.createAndSave(body);
  }

  async updateBranch(id: number, body: any) {
    const branch = await Branch.getByIdOrFail(id);
    return await branch.update(body);
  }

  async deleteBranch(id: number) {
    const branch = await Branch.getByIdOrFail(id);
    return await branch.softDelete();
  }

  async getAllBranches(query: any) {
    // Standard paginated listing
    return await Branch.paginate(query);
  }

  async getBranch(id: number) {
    return await Branch.getByIdOrFail(id);
  }

  async getActiveBranchesList() {
    // Plain list of active branches for dropdown selections
    return await Branch.find({
      where: { status: BranchStatus.ACTIVE },
      order: { name: "ASC" },
    });
  }
}
