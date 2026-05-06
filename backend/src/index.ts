import { PlatformExpress } from "@tsed/platform-express";
import { Server } from "./Server";
import Logger from "./helpers/Logger";
import { AppConfig } from "./config/AppConfig";
import mysql from "mysql2/promise";

async function bootstrap() {
  try {
    // Tự động tạo database nếu chưa tồn tại
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD ?? "123456",
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "kingfood"}\`;`);
    await connection.end();
    Logger.info(`Database "${process.env.DB_NAME || "kingfood"}" checked/created successfully.`);

    const platform = await PlatformExpress.bootstrap(Server);
    await platform.listen();

    const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    Logger.info(`
      **************************************************
      * SERVER STARTED SUCCESSFULLY
      * Time: ${now}
      * Port: ${AppConfig.PORT}
      * Env: ${process.env.NODE_ENV || "development"}
      **************************************************
    `);
  } catch (er) {
    Logger.error("Error during server bootstrap:");
    Logger.error(er);
  }
}

bootstrap();
