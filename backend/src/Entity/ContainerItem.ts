import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Property, Enum } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { Container } from "./Container";
import { Order } from "./Order";
import { Product } from "./Product";
import { User } from "./User";

export enum ContainerItemStatus {
  GOOD = "good",
  DAMAGED = "damaged",
  LOST = "lost",
}

@Entity("container_items")
export class ContainerItem extends BaseEntity {
  @Column({ name: "container_id", nullable: false })
  @Property()
  containerId: number;

  @Column({ name: "order_id", nullable: false })
  @Property()
  orderId: number;

  @Column({ name: "product_id", nullable: false })
  @Property()
  productId: number;

  @Column({ name: "picked_by_id", nullable: false })
  @Property()
  pickedById: number;

  @Column({ type: "int", nullable: false })
  @Property()
  quantity: number;

  @Column({ type: "enum", enum: ContainerItemStatus, default: ContainerItemStatus.GOOD })
  @Enum(ContainerItemStatus)
  status: ContainerItemStatus;

  @ManyToOne(() => Container, (container) => container.items)
  @JoinColumn({ name: "container_id" })
  container: Container;

  @ManyToOne(() => Order)
  @JoinColumn({ name: "order_id" })
  order: Order;

  @ManyToOne(() => Product)
  @JoinColumn({ name: "product_id" })
  product: Product;

  @ManyToOne(() => User)
  @JoinColumn({ name: "picked_by_id" })
  pickedBy: User;

  constructor(partial?: Partial<ContainerItem>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default ContainerItem;
