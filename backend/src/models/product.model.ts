import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BaseMySQLModel } from "./baseMySQL.model";

@Entity({ name: "products" })
export class ProductEntity extends BaseMySQLModel {
  @PrimaryColumn()
  _id!: number;

  @Column()
  name!: string;

  @Column()
  category_id!: number;

  @Column({ default: "active" })
  status!: string;

  @Column()
  location_id!: number;

  @Column({ default: false })
  isDeleted!: boolean;

  @Column({ nullable: true })
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export default ProductEntity;
export type IProduct = ProductEntity;
