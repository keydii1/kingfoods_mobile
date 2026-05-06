import { Configuration, Inject } from "@tsed/common";
import { PlatformExpress } from "@tsed/platform-express";
import "@tsed/platform-express";
import "@tsed/swagger";
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
  swagger: [
    {
      path: "/docs",
      specVersion: "3.0.1",
      spec: {
        info: {
          title: "King Foods API Documentation",
          version: "1.0.0",
          description: "API Documentation for King Foods Mobile Application backend, built with Ts.ED, TypeORM, and MySQL.",
        },
      },
    }
  ],
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
  protected app!: PlatformExpress;

  $beforeInit() {
    connect();
  }
}
