import { Schema, model, Document, Types } from "mongoose";

export interface IOrder extends Document<number> {
  _id: number;
  branch_id: number;
  user_id: number;
  status: string;
  total_amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    _id: { type: Number, required: true },
    branch_id: { type: Number, ref: "Branch", required: true },
    user_id: { type: Number, ref: "User", required: true },
    status: { type: String, default: "pending" },
    total_amount: { type: Number, required: true },
  },
  { timestamps: true },
);

const Order = model<IOrder>("Order", orderSchema);

export default Order;
