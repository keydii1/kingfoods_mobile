import { UseBefore, Context } from "@tsed/common";
import { Store } from "@tsed/core";
import { Schema } from "joi";
import { BadRequest } from "../core/ErrorResponse";

/**
 * Validator Decorator - Tự động validate dữ liệu bằng Joi
 * Hỗ trợ validate Query cho GET và Body cho các method khác
 */
export function Validator(schema: Schema) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Store.from(target, propertyKey, descriptor).set("joi_schema", schema);

    UseBefore((req: any, res: any, next: any) => {
      if (!schema) return next();

      const dataToValidate = req.method === "GET" ? req.query : req.body;

      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
      });

      if (error) {
        const message = error.details
          .map((detail: any) => detail.message.replace(/"/g, ""))
          .join(", ");
        return next(new BadRequest(message, error.details));
      }

      // Gán lại dữ liệu sạch sau validation
      if (req.method === "GET") {
        Object.keys(req.query).forEach(key => delete req.query[key]);
        Object.assign(req.query, value);
      } else {
        req.body = value;
      }
      next();
    })(target, propertyKey, descriptor);
  };
}
