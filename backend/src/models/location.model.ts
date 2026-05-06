import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BaseMySQLModel } from "./baseMySQL.model";

@Entity({ name: "locations" })
export class LocationEntity extends BaseMySQLModel {
  @PrimaryColumn()
  _id!: number;

  @Column()
  name!: string;

  @Column({ default: "active" })
  status!: string;

  @Column({ nullable: true })
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export default LocationEntity;
export type ILocation = LocationEntity;
