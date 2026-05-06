import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import UserEntity from "../models/user.model";
import KeyTokenEntity from "../models/keyToken.model";
import BranchEntity from "../models/branch.model";
import CategoryEntity from "../models/category.model";
import LocationEntity from "../models/location.model";
import ProductEntity from "../models/product.model";
import OrderEntity from "../models/order.model";
import OrderDetailEntity from "../models/orderDetail.model";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "king_food_database",
  synchronize: true, // Auto create/update table schemas on startup (perfect for development!)
  logging: process.env.NODE_ENV === "development",
  entities: [
    UserEntity,
    KeyTokenEntity,
    BranchEntity,
    CategoryEntity,
    LocationEntity,
    ProductEntity,
    OrderEntity,
    OrderDetailEntity,
  ],
  migrations: [],
  subscribers: [],
});

export const connect = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("Connect MySQL database successfully via TypeORM!");
  } catch (err) {
    console.log("Connect MySQL database fail:", err);
  }
};
export default AppDataSource;
