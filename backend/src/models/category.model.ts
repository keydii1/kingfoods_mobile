import { Schema, model, Document } from "mongoose";

export interface ICategory extends Document<number> {
  _id: number;
  name: string;
  status: string;
  isDeleted: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    _id: { type: Number, required: true },
    name: { type: String, required: true },
    status: { type: String, default: "active" },
    isDeleted: { type: Boolean, default: false },
    description: { type: String },
  },
  { timestamps: true },
);

const Category = model<ICategory>("Category", categorySchema);

export default Category;
