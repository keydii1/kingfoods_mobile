import { Service } from "@tsed/di";
import { Category } from "../Entity/Category";

@Service()
export class CategoryService {
  async createCategory(body: any) {
    return await Category.createAndSave(body);
  }

  async updateCategory(id: number, body: any) {
    const category = await Category.getByIdOrFail(id);
    return await category.update(body);
  }

  async deleteCategory(id: number) {
    const category = await Category.getByIdOrFail(id);
    return await category.softDelete();
  }

  async getAllCategories(query: any) {
    return await Category.paginate(query);
  }

  async getCategory(id: number) {
    return await Category.getByIdOrFail(id);
  }
}
