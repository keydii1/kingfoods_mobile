import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from "typeorm";
import { Enum, Property } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { Branch } from "./Branch";
import { OrderDetail } from "./OrderDetail";
import { ColumnNumericTransformer } from "../helpers/ColumnTransformer";
import { User } from "./User";

export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

@Entity("orders")
@Index(["customerId", "status"])
export class Order extends BaseEntity {
  /**
   * FK lưu riêng để dễ query, quan hệ được định nghĩa qua @ManyToOne bên dưới
   */
  @Index()
  @Column({ name: "branch_id", nullable: false })
  @Property()
  customerId: number;

  get branchId(): number {
    return this.customerId;
  }
  set branchId(value: number) {
    this.customerId = value;
  }

  @Index()
  @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.PENDING })
  @Enum(OrderStatus)
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


  /**
   * Quan hệ ManyToOne với Branch
   * JoinColumn chỉ định tên cột FK trong database là "branch_id"
   */
  @ManyToOne(() => Branch, (branch) => branch.orders)
  @JoinColumn({ name: "branch_id" })
  branch: Branch;


  @OneToMany(() => OrderDetail, (detail) => detail.order)
  orderDetails: OrderDetail[];

  constructor(partial?: Partial<Order>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default Order;
