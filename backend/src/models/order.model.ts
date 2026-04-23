import { Schema, model, Document, Types } from "mongoose";

export interface IOrder extends Document {
  branch_id: Types.ObjectId;
  user_id: Types.ObjectId;
  status: string;
  total_amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    branch_id: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, default: "pending" },
    total_amount: { type: Number, required: true },
  },
  { timestamps: true },
);

const Order = model<IOrder>("Order", orderSchema);

export default Order;
