import * as Joi from "joi";

export const CreatePickingTaskSchema = Joi.object({
  orderDetailId: Joi.number().integer().positive().required(),
  assignedUserId: Joi.number().integer().positive().required(),
  quantityToPick: Joi.number().integer().positive().required(),
  quantityPicked: Joi.number().integer().min(0).default(0).optional(),
  status: Joi.string().valid("pending", "picking", "completed").default("pending").optional(),
  locationId: Joi.number().integer().positive().allow(null).optional(),
});

export const UpdatePickingTaskSchema = Joi.object({
  orderDetailId: Joi.number().integer().positive().optional(),
  assignedUserId: Joi.number().integer().positive().optional(),
  quantityToPick: Joi.number().integer().positive().optional(),
  quantityPicked: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid("pending", "picking", "completed").optional(),
  locationId: Joi.number().integer().positive().allow(null).optional(),
});
