import * as Joi from "joi";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const CreateUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  username: Joi.string().min(5).required(),
  password: Joi.string().pattern(passwordPattern).min(8).required(),
  assignedLocationId: Joi.number().integer().allow(null).optional(),
  role: Joi.string().valid("admin", "staff").optional()
});

export const LoginUserSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

export const ChangePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().pattern(passwordPattern).min(8).required()
});

export const UserResetPasswordSchema = Joi.object({
  password: Joi.string().pattern(passwordPattern).min(8).required()
});

export const UserUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  dateOfBirth: Joi.date().iso().allow(null).optional(),
  phoneNumber: Joi.string().allow(null, "").optional(),
  username: Joi.string().min(5).optional(),
  assignedZone: Joi.string().valid("🍬 Bánh kẹo", "🥤 Đồ uống", "🧴 Hóa phẩm", "🎁 KM").allow(null).optional()
});
