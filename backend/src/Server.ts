import { Configuration, Inject } from "@tsed/common";
import { PlatformExpress } from "@tsed/platform-express";
import "@tsed/platform-express"; // /!\ IMPORT THIS
import bodyParser from "body-parser";
import cors from "cors";
import { connect } from "./configs/database.config";

export const rootDir = __dirname;

@Configuration({
  rootDir,
  acceptMimes: ["application/json"],
  port: process.env.PORT || 8083,
  mount: {
    "/v1": [`${rootDir}/controllers/**/*.ts`],
  },
  middlewares: [
    cors(),
    "cookie-parser",
    "compression",
    "method-override",
    bodyParser.json(),
    bodyParser.urlencoded({
      extended: true,
    }),
  ],
})
export class Server {
  @Inject()
  protected app: PlatformExpress;

  $beforeInit() {
    connect();
  }
}
