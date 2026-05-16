import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Property, Enum } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { OrderDetail } from "./OrderDetail";
import { User } from "./User";
import { Location } from "./Location";

export enum PickingTaskStatus {
  PENDING = "pending",
  PICKING = "picking",
  COMPLETED = "completed",
}

@Entity("picking_tasks")
@Index(["assignedUserId", "status"])
export class PickingTask extends BaseEntity {
  @Index()
  @Column({ name: "order_detail_id", nullable: false })
  @Property()
  orderDetailId: number;

  @Index()
  @Column({ name: "assigned_user_id", nullable: false })
  @Property()
  assignedUserId: number; // Nhân viên chịu trách nhiệm pick

  @Column({ type: "int", name: "quantity_to_pick", nullable: false })
  @Property()
  quantityToPick: number; // Số lượng cần pick được giao

  @Column({ type: "int", name: "quantity_picked", default: 0 })
  @Property()
  quantityPicked: number; // Số lượng đã pick thực tế

  @Index()
  @Column({ type: "enum", enum: PickingTaskStatus, default: PickingTaskStatus.PENDING })
  @Enum(PickingTaskStatus)
  status: PickingTaskStatus;

  @Index()
  @Column({ name: "location_id", nullable: true })
  @Property()
  locationId: number; // ID của Vị trí kệ hàng

  @ManyToOne(() => Location)
  @JoinColumn({ name: "location_id" })
  location: Location;

  @ManyToOne(() => OrderDetail)
  @JoinColumn({ name: "order_detail_id" })
  orderDetail: OrderDetail;

  @ManyToOne(() => User)
  @JoinColumn({ name: "assigned_user_id" })
  assignedUser: User;

  constructor(partial?: Partial<PickingTask>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default PickingTask;
