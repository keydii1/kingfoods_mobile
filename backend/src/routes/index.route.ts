import express from "express";
import productRoute from "./product.route";
import categoryRoute from "./category.route";
import locationRoute from "./location.route";
import branchRoute from "./branch.route";
import userRoute from "./user.route";
import orderRoute from "./order.route";

const app = express();
const rootRoute = (app: express.Application) => {
  const version1 = process.env.PREFIX;
  app.use(version1 + "/products", productRoute);
  app.use(version1 + "/categories", categoryRoute);
  app.use(version1 + "/locations", locationRoute);
  app.use(version1 + "/branches", branchRoute);
  app.use(version1 + "/users", userRoute);
  app.use(version1 + "/orders", orderRoute);
};

export default rootRoute;
