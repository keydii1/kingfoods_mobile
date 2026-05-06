import * as Joi from "joi";

export const CreateProductSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(null, ""),
  price: Joi.number().min(0).required(),
  discount: Joi.number().min(0).default(0),
  categoryId: Joi.number().integer().required(),
  image: Joi.string().allow(null, ""),
  status: Joi.string().valid("active", "inactive").default("active"),
});

export const UpdateProductSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow(null, ""),
  price: Joi.number().min(0),
  discount: Joi.number().min(0),
  categoryId: Joi.number().integer(),
  image: Joi.string().allow(null, ""),
  status: Joi.string().valid("active", "inactive"),
});
