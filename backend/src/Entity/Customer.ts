import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Property, Enum } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { Branch } from "./Branch";

export enum AccountStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export interface CustomerPayload {
  id: number;
  name: string;
  email: string;
  role: string;
  branchId: number;
}

@Entity("customers")
export class Customer extends BaseEntity {
  @Index()
  @Column({ name: "branch_id", nullable: false })
  @Property()
  branchId: number; // ID chi nhánh mà tài khoản này trực thuộc

  @Column({ nullable: false })
  @Property()
  name: string; // Tên của người dùng quản lý chi nhánh (ví dụ: "Nguyễn Văn A")

  @Column({ unique: true, nullable: false })
  @Property()
  email: string; // Email dùng để đăng nhập đặt hàng cho chi nhánh

  @Column({ select: false, nullable: false })
  password: string;

  @Column({ name: "phone_number", nullable: true })
  @Property()
  phoneNumber: string;

  @Index()
  @Column({ type: "enum", enum: AccountStatus, default: AccountStatus.ACTIVE })
  @Enum(AccountStatus)
  status: AccountStatus;

  @Column({ nullable: true, select: false, default: "" })
  otp: string;

  @Column({
    type: "datetime",
    name: "otp_expire",
    nullable: true,
    select: false,
  })
  otpExpire: Date;

  @ManyToOne(() => Branch, (branch) => branch.accounts)
  @JoinColumn({ name: "branch_id" })
  branch: Branch;

  constructor(partial?: Partial<Customer>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default Customer;
