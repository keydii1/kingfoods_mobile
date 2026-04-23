import express from "express";
import productRoute from "./product.route";

const app = express();
const rootRoute = (app: express.Application) => {
  const version1 = process.env.PREFIX;
  app.use(version1 + "/products", productRoute);
};

export default rootRoute;
