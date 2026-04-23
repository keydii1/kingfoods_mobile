import { Schema, model, Document, Types } from "mongoose";

export interface IOrderDetail extends Document {
  order_id: Types.ObjectId;
  product_id: Types.ObjectId;
  quantity: number;
  price: number;
}

const orderDetailSchema = new Schema<IOrderDetail>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true },
);

const OrderDetail = model<IOrderDetail>("OrderDetail", orderDetailSchema);

export default OrderDetail;
