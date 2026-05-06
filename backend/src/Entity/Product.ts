import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Property } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { Category } from "./Category";
import { ColumnNumericTransformer } from "../helpers/ColumnTransformer";

export enum ProductStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

@Entity("products")
export class Product extends BaseEntity {
  @Column({ name: "category_id" })
  @Property(Number)
  categoryId: Category["id"];

  @Column()
  @Property()
  name: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  @Property()
  price: number;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  @Property()
  discount: number;

  @Column({ nullable: true, default: "" })
  @Property()
  image: string;

  @Column({ nullable: true, default: "" })
  @Property()
  description: string;

  @Column({ type: "enum", enum: ProductStatus, default: ProductStatus.ACTIVE })
  @Property()
  status: ProductStatus;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: "category_id" })
  category: Category;

  constructor(partial?: Partial<Product>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default Product;
