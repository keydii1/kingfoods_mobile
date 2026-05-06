import * as Joi from "joi";

export const PaginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortKey: Joi.string().default("id"),
  sortValue: Joi.string().valid("ASC", "DESC", "asc", "desc").default("ASC"),
});
