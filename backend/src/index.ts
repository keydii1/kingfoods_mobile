import { PlatformExpress } from "@tsed/platform-express";
import { Server } from "./Server";
import Logger from "./helpers/Logger";
import { AppConfig } from "./config/AppConfig";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");
process.env.TZ = "Asia/Ho_Chi_Minh";

async function bootstrap() {
  try {
    const platform = await PlatformExpress.bootstrap(Server);
    await platform.listen();

    const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const serverUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${AppConfig.PORT}`;
    Logger.info(`
      **************************************************
      * SERVER STARTED SUCCESSFULLY
      * Time: ${now}
      * URL: ${serverUrl}
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
