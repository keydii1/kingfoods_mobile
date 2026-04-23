import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { connect } from "./configs/database.config";
import rootRoute from "./routes/index.route";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connect();
rootRoute(app);
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
