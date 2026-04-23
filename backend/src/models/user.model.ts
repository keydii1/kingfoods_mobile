import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  gmail: string;
  password: string;
  username: string;
  shift: string;
  isAdmin: boolean;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    gmail: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    shift: { type: String },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const User = model<IUser>("User", userSchema);

export default User;
