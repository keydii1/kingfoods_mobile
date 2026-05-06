import { Service } from "@tsed/di";
import { Product } from "../Entity/Product";
import { Category } from "../Entity/Category";
import { BadRequest } from "../core/ErrorResponse";

@Service()
export class ProductService {
  async createProduct(body: any) {
    const { category_id, price, discount } = body;

    if (price !== undefined && price < 0)
      throw new BadRequest("Price cannot be negative");
    if (discount !== undefined && (discount < 0 || discount > 100))
      throw new BadRequest("Discount must be between 0 and 100");

    if (category_id) {
      await Category.getByIdOrFail(category_id);
    }

    return await Product.createAndSave(body);
  }

  async updateProduct(id: number, body: any) {
    const { category_id, price, discount } = body;

    if (price !== undefined && price < 0)
      throw new BadRequest("Price cannot be negative");
    if (discount !== undefined && (discount < 0 || discount > 100))
      throw new BadRequest("Discount must be between 0 and 100");

    if (category_id) {
      await Category.getByIdOrFail(category_id);
    }

    const product = await Product.getByIdOrFail(id);
    return await product.update(body);
  }

  async deleteProduct(id: number) {
    const product = await Product.getByIdOrFail(id);
    return await product.softDelete();
  }

  async getAllProducts(query: any) {
    return await Product.paginate(query, {
      relations: ["category"],
    });
  }

  async getProduct(id: number) {
    return await Product.getByIdOrFail(id, {
      relations: ["category"],
    });
  }
}
