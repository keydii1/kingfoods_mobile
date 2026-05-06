import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BaseMySQLModel } from "./baseMySQL.model";

@Entity({ name: "orders" })
export class OrderEntity extends BaseMySQLModel {
  @PrimaryColumn()
  _id!: number;

  @Column()
  branch_id!: number;

  @Column()
  user_id!: number;

  @Column({ default: "pending" })
  status!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  total_amount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export default OrderEntity;
export type IOrder = OrderEntity;
