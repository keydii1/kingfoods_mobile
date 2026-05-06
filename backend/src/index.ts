import { PlatformExpress } from "@tsed/platform-express";
import { Server } from "./Server";
import Logger from "./helpers/Logger";
import { AppConfig } from "./config/AppConfig";

async function bootstrap() {
  try {
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
