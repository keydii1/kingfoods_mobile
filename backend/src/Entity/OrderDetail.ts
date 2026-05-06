import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Property } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { Order } from "./Order";
import { Product } from "./Product";
import { ColumnNumericTransformer } from "../helpers/ColumnTransformer";

@Entity("order_details")
export class OrderDetail extends BaseEntity {
  @Column({ name: "order_id", nullable: false })
  @Property()
  orderId: number;

  @Column({ name: "product_id", nullable: false })
  @Property()
  productId: number;

  @Column({ nullable: false })
  @Property()
  quantity: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: false,
  })
  @Property()
  price: number;

  @ManyToOne(() => Order, (order) => order.orderDetails)
  @JoinColumn({ name: "order_id" })
  order: Order;

  @ManyToOne(() => Product)
  @JoinColumn({ name: "product_id" })
  product: Product;

  constructor(partial?: Partial<OrderDetail>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default OrderDetail;
