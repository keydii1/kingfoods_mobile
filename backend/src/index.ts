import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { connect } from "./configs/database.config";
import rootRoute from "./routes/index.route";
const app = express();
connect();
rootRoute(app);
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
