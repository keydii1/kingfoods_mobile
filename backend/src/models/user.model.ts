import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BaseMySQLModel } from "./baseMySQL.model";

@Entity({ name: "users" })
export class UserEntity extends BaseMySQLModel {
  @PrimaryColumn()
  _id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  gmail!: string;

  @Column()
  password!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ nullable: true })
  shift!: string;

  @Column({ default: false })
  isAdmin!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export default UserEntity;
export type IUser = UserEntity;
