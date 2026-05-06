import { Entity, Column, Index, OneToMany } from "typeorm";
import { Property, Enum } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import ContainerItem from "./ContainerItem";

export enum ContainerStatus {
  EMPTY = "empty",
  ACTIVE = "active",
  CLOSED = "closed",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
}

@Entity("containers")
export class Container extends BaseEntity {
  @Column({ unique: true })
  @Property()
  code: string;

  @Column()
  @Property()
  name: string;

  @Column({ type: "int", default: 50 })
  @Property()
  capacity: number;

  @Column({ type: "int", name: "current_usage", default: 0 })
  @Property()
  currentUsage: number;

  @Column({
    type: "enum",
    enum: ContainerStatus,
    default: ContainerStatus.EMPTY,
  })
  @Enum(ContainerStatus)
  status: ContainerStatus;

  @OneToMany(() => ContainerItem, (item) => item.container)
  items: ContainerItem[];

  constructor(partial?: Partial<Container>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default Container;
