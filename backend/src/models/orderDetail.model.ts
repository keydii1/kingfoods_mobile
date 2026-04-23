import { Schema, model, Document, Types } from "mongoose";

export interface IOrderDetail extends Document<number> {
  _id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderDetailSchema = new Schema<IOrderDetail>(
  {
    _id: { type: Number, required: true },
    order_id: { type: Number, ref: "Order", required: true },
    product_id: { type: Number, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true },
);

const OrderDetail = model<IOrderDetail>("OrderDetail", orderDetailSchema);

export default OrderDetail;
