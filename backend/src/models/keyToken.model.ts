import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BaseMySQLModel } from "./baseMySQL.model";

@Entity({ name: "keys" })
export class KeyTokenEntity extends BaseMySQLModel {
  @PrimaryGeneratedColumn()
  _id!: number;

  @Column()
  user!: number;

  @Column({ type: "text" })
  refreshToken!: string;

  @Column("simple-array", { nullable: true })
  refreshTokensUsed!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Initialize array if empty to ensure compatibility with .push()
  constructor() {
    super();
    if (!this.refreshTokensUsed) {
      this.refreshTokensUsed = [];
    }
  }
}

export default KeyTokenEntity;
export type IKeyToken = KeyTokenEntity;
