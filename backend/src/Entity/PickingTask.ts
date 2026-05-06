import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { Property, Enum } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { Order } from "./Order";
import { Product } from "./Product";
import { User } from "./User";

export enum PickingTaskStatus {
  PENDING = "pending",
  PICKING = "picking",
  COMPLETED = "completed",
}

@Entity("picking_tasks")
export class PickingTask extends BaseEntity {
  @Column({ name: "order_id", nullable: false })
  @Property()
  orderId: number;

  @Column({ name: "product_id", nullable: false })
  @Property()
  productId: number;

  @Column({ name: "assigned_user_id", nullable: false })
  @Property()
  assignedUserId: number; // Nhân viên chịu trách nhiệm pick

  @Column({ type: "int", name: "quantity_to_pick", nullable: false })
  @Property()
  quantityToPick: number; // Số lượng cần pick được giao

  @Column({ type: "int", name: "quantity_picked", default: 0 })
  @Property()
  quantityPicked: number; // Số lượng đã pick thực tế

  @Column({ type: "enum", enum: PickingTaskStatus, default: PickingTaskStatus.PENDING })
  @Enum(PickingTaskStatus)
  status: PickingTaskStatus;

  @Column({ nullable: true })
  @Property()
  location: string; // Vị trí kệ hàng, ví dụ: "Kệ A-12"

  @ManyToOne(() => Order)
  @JoinColumn({ name: "order_id" })
  order: Order;

  @ManyToOne(() => Product)
  @JoinColumn({ name: "product_id" })
  product: Product;

  @ManyToOne(() => User)
  @JoinColumn({ name: "assigned_user_id" })
  assignedUser: User;

  constructor(partial?: Partial<PickingTask>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default PickingTask;
