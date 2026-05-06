import * as Joi from "joi";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const CreateUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  username: Joi.string().min(5).required(),
  password: Joi.string().pattern(passwordPattern).min(8).required()
});

export const LoginUserSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

export const ChangePasswordSchema = Joi.object({
  oldPassword: Joi.string().min(8).required(),
  newPassword: Joi.string().pattern(passwordPattern).min(8).required()
});

export const UserResetPasswordSchema = Joi.object({
  password: Joi.string().pattern(passwordPattern).min(8).required()
});

export const UserUpdateSchema = Joi.object({
  dateOfBirth: Joi.date().iso().allow(null),
  phoneNumber: Joi.string().allow(null, "")
});
