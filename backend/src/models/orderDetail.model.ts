import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BaseMySQLModel } from "./baseMySQL.model";

@Entity({ name: "order_details" })
export class OrderDetailEntity extends BaseMySQLModel {
  @PrimaryColumn()
  _id!: number;

  @Column()
  order_id!: number;

  @Column()
  product_id!: number;

  @Column()
  quantity!: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  price!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export default OrderDetailEntity;
export type IOrderDetail = OrderDetailEntity;
