import { Entity, Column, OneToMany, Index } from "typeorm";
import { Nullable, Property } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { Order } from "./Order";

export enum AccountStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export interface CustomerPayload {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Entity("customers")
export class Customer extends BaseEntity {
  @Column({ nullable: false })
  @Property()
  name: string;

  @Column({ unique: true, nullable: false })
  @Property()
  email: string;

  /**
   * Hidden column — không trả về trong query mặc định
   */
  @Column({ select: false, nullable: false })
  password: string;

  @Column({ unique: true, name: "phone_number", nullable: false })
  @Property()
  phone: string;

  @Column({ type: "date", name: "date_of_birth", nullable: true })
  @Property()
  dateOfBirth: Date;

  @Column({ type: "enum", enum: Gender, nullable: true })
  @Property()
  gender: Gender;

  @Column({ nullable: true, default: "" })
  @Property()
  avatar: string;

  @Column({ type: "enum", enum: AccountStatus, default: AccountStatus.ACTIVE })
  @Property()
  status: AccountStatus;

  /**
   * Hidden column — OTP cho reset password
   */
  @Column({ nullable: true, select: false, default: "" })
  otp: string;

  @Column({
    type: "datetime",
    name: "otp_expire",
    nullable: true,
    select: false,
  })
  otpExpire: Date;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  constructor(partial?: Partial<Customer>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default Customer;
