import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BaseMySQLModel } from "./baseMySQL.model";

@Entity({ name: "categories" })
export class CategoryEntity extends BaseMySQLModel {
  @PrimaryColumn()
  _id!: number;

  @Column()
  name!: string;

  @Column({ default: "active" })
  status!: string;

  @Column({ default: false })
  isDeleted!: boolean;

  @Column({ nullable: true })
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export default CategoryEntity;
export type ICategory = CategoryEntity;
