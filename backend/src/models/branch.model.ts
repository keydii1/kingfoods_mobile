import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BaseMySQLModel } from "./baseMySQL.model";

@Entity({ name: "branches" })
export class BranchEntity extends BaseMySQLModel {
  @PrimaryColumn()
  _id!: number;

  @Column()
  name!: string;

  @Column()
  street!: string;

  @Column()
  openHour!: string;

  @Column()
  closeHour!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export default BranchEntity;
export type IBranch = BranchEntity;
