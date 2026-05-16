import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { AppConfig } from "./AppConfig";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "123456",
  database: process.env.DB_NAME || "mydb",
  synchronize: false,
  logging: false,
  entities: [__dirname + "/../Entity/*.{js,ts}"],
  entityPrefix: AppConfig.TABLE_PREFIX,
  timezone: "+07:00",
});
