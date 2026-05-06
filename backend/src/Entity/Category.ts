import { Entity, Column, OneToMany, Index } from "typeorm";
import { Enum, Property } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { Product } from "./Product";

/**
 * Trạng thái của danh mục sản phẩm
 */
export enum Status {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

@Entity("categories")
export class Category extends BaseEntity {
  @Column({ unique: true, nullable: false })
  @Property()
  name: string;

  @Column({
    type: "enum",
    enum: Status,
    default: Status.ACTIVE,
    nullable: false,
  })
  @Enum(Status)
  status: Status;

  @Column({ nullable: true, default: "" })
  @Property()
  description: string;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  constructor(partial?: Partial<Category>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default Category;
