import { Entity, Column, OneToMany, Index } from "typeorm";
import { Property } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { Category } from "./Category";

@Entity("locations")
export class Location extends BaseEntity {
  @Index()
  @Column({ unique: true, nullable: false })
  @Property()
  code: string; // Mã vị trí, ví dụ: "ZONE-A", "SHELF-COLD-01"

  @Column({ nullable: false })
  @Property()
  name: string; // Tên khu vực, ví dụ: "Khu vực đông lạnh", "Kệ rau củ quả sấy"

  @Column({ nullable: true, default: "" })
  @Property()
  description: string; // Mô tả thêm về vị trí

  @OneToMany(() => Category, (category) => category.location)
  categories: Category[];

  constructor(partial?: Partial<Location>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default Location;
