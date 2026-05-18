import { Service } from "@tsed/di";
import { Order, OrderStatus } from "../Entity/Order";
import { OrderDetail } from "../Entity/OrderDetail";
import { Product } from "../Entity/Product";
import { NotFound, BadRequest } from "../core/ErrorResponse";
import { TypeORMService } from "@tsed/typeorm";
import { In } from "typeorm";

@Service()
export class OrderService {
  constructor(private typeORMService: TypeORMService) {}

  async getOrdersByCustomer(customerId: number) {
    return await Order.find({
      where: { customerId },
      relations: ["orderDetails", "orderDetails.product"],
    });
  }

  async getHistory(customerId: number, status: OrderStatus) {
    return await Order.find({
      where: { customerId, status },
      relations: ["orderDetails", "orderDetails.product"],
    });
  }

  async getOrderDetail(orderId: number) {
    const order = await Order.getByIdOrFail(orderId, {
      relations: ["orderDetails", "orderDetails.product"],
    });
    return {
      detail: order.orderDetails,
      totalPriceOfOrder: order.totalPrice,
    };
  }

  async getOrderDetailForClient(orderId: number, customerId: number) {
    const order = await Order.findOne({
      where: { id: orderId, customerId },
      relations: ["orderDetails", "orderDetails.product", "branch"],
    });
    if (!order) throw new NotFound("Order not found");
    return order;
  }

  async createOrder(data: {
    customerId: number;
    products: any[];
  }) {
    const { customerId, products } = data;

    return await this.typeORMService
      .get()
      .transaction(async (transactionalEntityManager) => {
        const productIds = products.map((p) => p.productId);
        const productsDb = await transactionalEntityManager.findBy(Product, {
          id: In(productIds),
        });

        const newOrder = transactionalEntityManager.create(Order, {
          customerId,
          status: OrderStatus.PENDING,
          totalPrice: 0,
        });

        const savedOrder = await transactionalEntityManager.save(newOrder);

        const orderDetailData = products.map((item) => {
          const product = productsDb.find((p) => p.id === item.productId);
          if (!product)
            throw new BadRequest(`Product ${item.productId} not found`);

          return transactionalEntityManager.create(OrderDetail, {
            orderId: savedOrder.id,
            productId: product.id,
            quantity: item.quantity,
          });
        });

        const savedOrderDetails =
          await transactionalEntityManager.save(orderDetailData);

        const totalPrice = products.reduce((acc, item) => {
          const product = productsDb.find((p) => p.id === item.productId);
          return acc + (product ? product.price * item.quantity : 0);
        }, 0);

        savedOrder.totalPrice = totalPrice;
        await transactionalEntityManager.save(savedOrder);

        return { order: savedOrder, orderDetail: savedOrderDetails };
      });
  }

  async updateOrderByClient(id: number, data: any, customerId?: number) {
    const { status } = data;
    const order = await Order.getByIdOrFail(id);

    if (customerId != null && order.customerId !== customerId) {
      throw new BadRequest("You do not have permission to update this order");
    }

    if (status === "cancelled") {
      if (
        order.status !== OrderStatus.PENDING &&
        order.status !== OrderStatus.PROCESSING
      ) {
        throw new BadRequest(
          "Order can only be cancelled while pending or processing",
        );
      }
      order.status = OrderStatus.CANCELLED;
    }
    return await order.save();
  }

  async getAllOrders(status?: OrderStatus) {
    const where = status ? { status } : {};
    return await Order.find({
      where,
      relations: ["branch", "orderDetails", "orderDetails.product"],
      order: { createdAt: "DESC" },
    });
  }

  async updateByAdmin(id: number, status: OrderStatus) {
    const order = await Order.getByIdOrFail(id);
    order.status = status;
    return await order.save();
  }

  async deleteOrder(id: number) {
    const order = await Order.getByIdOrFail(id);
    return await order.softDelete();
  }

  async getStoreStatistics(customerId: number, startDate?: string, endDate?: string) {
    let query = Order.createQueryBuilder("order")
      .leftJoinAndSelect("order.orderDetails", "detail")
      .leftJoinAndSelect("detail.product", "product")
      .leftJoinAndSelect("order.branch", "branch")
      .where("order.customerId = :customerId", { customerId });

    if (startDate) {
      query = query.andWhere("order.created_at >= :startDate", { startDate: new Date(startDate + "T00:00:00.000Z") });
    }
    if (endDate) {
      query = query.andWhere("order.created_at <= :endDate", { endDate: new Date(endDate + "T23:59:59.999Z") });
    }

    const orders = await query.orderBy("order.created_at", "DESC").getMany();

    // Aggregate Top Products
    const productAgg: { [key: number]: { name: string; qty: number; unit: string } } = {};
    for (const order of orders) {
      if (order.orderDetails) {
        for (const detail of order.orderDetails) {
          if (detail.product) {
            const pId = detail.product.id;
            const pName = detail.product.name;
            const qty = detail.quantity || 0;
            const pUnit = "Sản phẩm";

            if (!productAgg[pId]) {
              productAgg[pId] = { name: pName, qty: 0, unit: pUnit };
            }
            productAgg[pId].qty += qty;
          }
        }
      }
    }

    const topProducts = Object.values(productAgg)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      orders,
      topProducts,
    };
  }
}
