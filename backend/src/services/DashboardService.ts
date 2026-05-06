import { Service } from "@tsed/di";
import { Order, OrderStatus } from "../Entity/Order";
import { Product } from "../Entity/Product";
import { Category } from "../Entity/Category";
import { Customer } from "../Entity/Customer";

@Service()
export class DashboardService {
  async getStats() {
    const totalOrders = await Order.count();
    const totalProducts = await Product.count();
    const totalCategories = await Category.count();
    const totalCustomers = await Customer.count();

    const revenueResult = await Order.createQueryBuilder("order")
      .select("SUM(order.total_price)", "total")
      .where("order.status = :status", { status: OrderStatus.DELIVERED })
      .getRawOne();

    const revenue = parseFloat(revenueResult?.total || "0");

    return {
      totals: {
        orders: totalOrders,
        products: totalProducts,
        categories: totalCategories,
        customers: totalCustomers,
      },
      revenue,
    };
  }

  async getRevenueByDate(startDate: Date, endDate: Date) {
    const revenueResult = await Order.createQueryBuilder("order")
      .select("SUM(order.total_price)", "total")
      .where("order.status = :status", { status: OrderStatus.DELIVERED })
      .andWhere("order.created_at BETWEEN :start AND :end", {
        start: startDate,
        end: endDate,
      })
      .getRawOne();

    return parseFloat(revenueResult?.total || "0");
  }
}
