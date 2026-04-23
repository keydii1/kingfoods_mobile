import { Schema, model, Document, Types } from "mongoose";

export interface IProduct extends Document {
  name: string;
  category_id: Types.ObjectId;
  status: string;
  location_id: Types.ObjectId;
  isDeleted: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    category_id: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    status: { type: String, default: "active" },
    location_id: { type: Schema.Types.ObjectId, ref: "Location", required: true },
    isDeleted: { type: Boolean, default: false },
    description: { type: String },
  },
  { timestamps: true },
);

const Product = model<IProduct>("Product", productSchema);

export default Product;
