import { Schema, model, Document } from "mongoose";

export interface IBranch extends Document<number> {
  _id: number;
  name: string;
  street: string;
  openHour: string;
  closeHour: string;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    _id: { type: Number, required: true },
    name: { type: String, required: true },
    street: { type: String, required: true },
    openHour: { type: String, required: true },
    closeHour: { type: String, required: true },
  },
  { timestamps: true },
);

const Branch = model<IBranch>("Branch", branchSchema);

export default Branch;
