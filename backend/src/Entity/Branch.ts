import { Entity, Column, OneToMany } from "typeorm";
import { Property, Enum } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { Order } from "./Order";
import { Customer } from "./Customer"; // Represents the login accounts for this branch

export enum BranchStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

@Entity("branches")
export class Branch extends BaseEntity {
  @Column({ nullable: false })
  @Property()
  name: string; // Ví dụ: "Kingfood Nguyễn Thị Thập"

  @Column({ nullable: true })
  @Property()
  address: string; // Địa chỉ chi nhánh

  @Column({ type: "enum", enum: BranchStatus, default: BranchStatus.ACTIVE })
  @Enum(BranchStatus)
  status: BranchStatus;

  @OneToMany(() => Order, (order) => order.branch)
  orders: Order[];

  @OneToMany(() => Customer, (account) => account.branch)
  accounts: Customer[];

  constructor(partial?: Partial<Branch>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default Branch;
