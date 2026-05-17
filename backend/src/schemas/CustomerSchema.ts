import * as Joi from "joi";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const RegisterCustomerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(passwordPattern).min(8).required(),
  phone: Joi.string().required(),
  dateOfBirth: Joi.date().iso().allow(null),
  gender: Joi.string().valid("male", "female", "other").allow(null),
  avatar: Joi.string().allow(null, ""),
});

export const LoginCustomerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const UpdateCustomerProfileSchema = Joi.object({
  name: Joi.string(),
  phone: Joi.string().allow(null, ""),
  dateOfBirth: Joi.date().iso().allow(null),
  gender: Joi.string().valid("male", "female", "other").allow(null),
  avatar: Joi.string().allow(null, ""),
});

export const CustomerChangePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().pattern(passwordPattern).min(8).required(),
});

export const CreateCustomerAdminSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(passwordPattern).min(8).required(),
  phoneNumber: Joi.string().allow(null, "").optional(),
  branchId: Joi.number().integer().positive().required(),
  status: Joi.string().valid("active", "inactive").default("active").optional(),
});

export const UpdateCustomerAdminSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().pattern(passwordPattern).min(8).optional(),
  phoneNumber: Joi.string().allow(null, "").optional(),
  branchId: Joi.number().integer().positive().optional(),
  status: Joi.string().valid("active", "inactive").optional(),
});

