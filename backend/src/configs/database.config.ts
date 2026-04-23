import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
export const connect = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string, {
      maxPoolSize: 5,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connect DB successfully");
  } catch (err) {
    console.log("Connect DB fail:", err);
  }
};
