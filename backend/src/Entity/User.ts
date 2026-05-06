import { Entity, Column, Index } from "typeorm";
import { Property, Enum, Required, MinLength, Email } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";

export enum UserRole {
  ADMIN = "admin",
  STAFF = "staff",
}

export enum UserZone {
  CANDY = "🍬 Bánh kẹo",
  BEVERAGE = "🥤 Đồ uống",
  CHEMICAL = "🧴 Hóa phẩm",
  PROMOTION = "🎁 KM",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export interface UserPayload {
  id: number;
  name: string;
  email: string;
  role: string;
  assignedZone?: string;
}

@Entity("users")
export class User extends BaseEntity {
  @Column()
  @MinLength(2)
  name: string;

  @Column({ unique: true, nullable: true })
  @Email()
  email: string;

  @Column({ unique: true, name: "phone_number", nullable: true })
  @Property()
  phoneNumber: string;

  @Column({ type: "datetime", name: "date_of_birth", nullable: true })
  @Property()
  dateOfBirth: Date;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.ACTIVE })
  @Enum(UserStatus)
  status: UserStatus;

  @Column({ unique: true, nullable: false })
  @MinLength(5)
  username: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.STAFF })
  /*
    Trong Ts.ED, bản thân cái decorator @Enum() 
    (hay bất kỳ decorator định dạng nào khác 
    như @Email(), @Required(), @Min(), @Max()...) 
    đã bao hàm luôn chức năng của @Property() bên trong nó rồi.
    Khi bạn dán @Enum(), nó báo cho Ts.ED 2 việc cùng lúc:
    "Ê, mở cổng API cho biến này nhé!" (Đóng vai trò y chang @Property())
    "Và nhớ nói cho mọi người biết nó chỉ được nhận các giá trị trong cái Enum này thôi nhé!"
    Vì vậy, mã chuẩn xác và gọn gàng nhất sẽ viết như sau (chỉ dùng 1 cái thôi):
  */
  @Enum(UserRole)
  role: UserRole;

  @Column({ type: "enum", enum: UserZone, name: "assigned_zone", nullable: true })
  @Enum(UserZone)
  assignedZone: UserZone;

  /**
   * Hidden column — không trả về trong query mặc định
   */
  @Column({ select: false })
  password: string;

  @Column({ nullable: true, select: false })
  otp: string;

  @Column({
    type: "datetime",
    name: "otp_expire",
    nullable: true,
    select: false,
  })
  otpExpire: Date;

  constructor(partial?: Partial<User>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default User;
