import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Property, Enum } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { Container } from "./Container";
import { PickingTask } from "./PickingTask";

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

  @Column({ name: "task_id", nullable: false })
  @Property()
  taskId: number;

  @Column({ type: "int", nullable: false })
  @Property()
  quantity: number;

  @Column({ type: "enum", enum: ContainerItemStatus, default: ContainerItemStatus.GOOD })
  @Enum(ContainerItemStatus)
  status: ContainerItemStatus;

  @ManyToOne(() => Container, (container) => container.items)
  @JoinColumn({ name: "container_id" })
  container: Container;

  @ManyToOne(() => PickingTask)
  @JoinColumn({ name: "task_id" })
  task: PickingTask;

  constructor(partial?: Partial<ContainerItem>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default ContainerItem;
