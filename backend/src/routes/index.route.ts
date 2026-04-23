import express from "express";
import productRoute from "./product.route";
import categoryRoute from "./category.route";

const app = express();
const rootRoute = (app: express.Application) => {
  const version1 = process.env.PREFIX;
  app.use(version1 + "/products", productRoute);
  app.use(version1 + "/categories", categoryRoute);
};

export default rootRoute;
