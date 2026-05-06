import * as Joi from "joi";
import { Status } from "../Entity/Category";

export const CreateCategorySchema = Joi.object({
  name: Joi.string().required(),
  status: Joi.string().valid(...Object.values(Status)).default(Status.ACTIVE),
  description: Joi.string().allow(null, ""),
});

export const UpdateCategorySchema = Joi.object({
  name: Joi.string(),
  status: Joi.string().valid(...Object.values(Status)),
  description: Joi.string().allow(null, ""),
});
