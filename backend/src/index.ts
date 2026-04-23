import { $log } from "@tsed/common";
import { PlatformExpress } from "@tsed/platform-express";
import { Server } from "./Server";
import dotenv from "dotenv";

dotenv.config();

async function bootstrap() {
  try {
    const platform = await PlatformExpress.bootstrap(Server);
    await platform.listen();

    $log.debug("Server initialized");
  } catch (er) {
    $log.error(er);
  }
}

bootstrap();
