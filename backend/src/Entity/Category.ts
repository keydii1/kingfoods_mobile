import { Entity, Column, OneToMany, Index, ManyToOne, JoinColumn } from "typeorm";
import { Enum, Property } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { Product } from "./Product";
import { Location } from "./Location";

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

  @Index()
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

  @Index()
  @Column({ name: "location_id", nullable: true })
  @Property()
  locationId: number | null;

  @ManyToOne(() => Location, (location) => location.categories)
  @JoinColumn({ name: "location_id" })
  location: Location | null;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  constructor(partial?: Partial<Category>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default Category;
