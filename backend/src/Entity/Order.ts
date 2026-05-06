import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from "typeorm";
import { Property } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { Customer } from "./Customer";
import { OrderDetail } from "./OrderDetail";
import { ColumnNumericTransformer } from "../helpers/ColumnTransformer";

export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

@Entity("orders")
export class Order extends BaseEntity {
  /**
   * FK lưu riêng để dễ query, quan hệ được định nghĩa qua @ManyToOne bên dưới
   */
  @Column({ name: "customer_id", nullable: false })
  @Property()
  customerId: number;

  @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.PENDING })
  @Property()
  status: OrderStatus;

  @Column({
    name: "total_price",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  @Property()
  totalPrice: number;

  @Column({ type: "text", nullable: false })
  @Property()
  address: string;

  /**
   * Quan hệ ManyToOne với Customer
   * JoinColumn chỉ định tên cột FK trong database là "customer_id"
   */
  @ManyToOne(() => Customer, (customer) => customer.orders)
  @JoinColumn({ name: "customer_id" })
  customer: Customer;

  @OneToMany(() => OrderDetail, (detail) => detail.order)
  orderDetails: OrderDetail[];

  constructor(partial?: Partial<Order>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default Order;
