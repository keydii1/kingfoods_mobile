import * as Joi from "joi";
import { BranchStatus } from "../Entity/Branch";

export const CreateBranchSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().allow(null, "").optional(),
  status: Joi.string().valid(...Object.values(BranchStatus)).default(BranchStatus.ACTIVE),
});

export const UpdateBranchSchema = Joi.object({
  name: Joi.string().optional(),
  address: Joi.string().allow(null, "").optional(),
  status: Joi.string().valid(...Object.values(BranchStatus)).optional(),
});
