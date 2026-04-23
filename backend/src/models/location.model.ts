import { Schema, model, Document } from "mongoose";

export interface ILocation extends Document {
  name: string;
  status: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    name: { type: String, required: true },
    status: { type: String, default: "active" },
    description: { type: String },
  },
  { timestamps: true },
);

const Location = model<ILocation>("Location", locationSchema);

export default Location;
