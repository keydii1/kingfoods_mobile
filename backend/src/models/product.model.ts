import { Schema, model, Document, Types } from "mongoose";

export interface IProduct extends Document<number> {
  _id: number;
  name: string;
  category_id: number;
  status: string;
  location_id: number;
  isDeleted: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    _id: { type: Number, required: true },
    name: { type: String, required: true },
    category_id: { type: Number, ref: "Category", required: true },
    status: { type: String, default: "active" },
    location_id: { type: Number, ref: "Location", required: true },
    isDeleted: { type: Boolean, default: false },
    description: { type: String },
  },
  { timestamps: true },
);

const Product = model<IProduct>("Product", productSchema);

export default Product;
