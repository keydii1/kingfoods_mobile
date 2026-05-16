import { Service, Inject } from "@tsed/di";
import { Order, OrderStatus } from "../Entity/Order";
import { OrderDetail } from "../Entity/OrderDetail";
import { Product } from "../Entity/Product";
import { NotFound, BadRequest } from "../core/ErrorResponse";
import { TypeORMService } from "@tsed/typeorm";
import { In } from "typeorm";

@Service()
export class OrderService {
  @Inject(TypeORMService)
  private typeORMService: TypeORMService;

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

  async updateOrderByClient(id: number, data: any) {
    const { status } = data;
    const order = await Order.getByIdOrFail(id);

    if (status === "cancelled") {
      if (order.status !== OrderStatus.PENDING)
        throw new BadRequest(
          "Order is not in pending status, customer can't cancel order",
        );
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
}
