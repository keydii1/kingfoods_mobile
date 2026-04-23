import { Schema, model, Document } from "mongoose";

export interface IBranch extends Document {
  name: string;
  street: string;
  openHour: string;
  closeHour: string;
}

const branchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true },
    street: { type: String, required: true },
    openHour: { type: String, required: true },
    closeHour: { type: String, required: true },
  },
  { timestamps: true },
);

const Branch = model<IBranch>("Branch", branchSchema);

export default Branch;
