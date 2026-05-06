import { StatusCode } from "./StatusCode";
import { errorReason } from "./ReasonPhrases";

export class ErrorResponse extends Error {
  readonly statusCode: number;
  readonly errorReason: string;
  readonly errors?: any[];

  constructor(message: string, statusCode: number, errorReason: string, errors?: any[]) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorReason = errorReason;
    this.errors = errors;
  }
}

export class BadRequest extends ErrorResponse {
  constructor(message = "Bad Request", errors?: any[]) {
    super(message, StatusCode.BAD_REQUEST, errorReason.BAD_REQUEST, errors);
  }
}

export class NotFound extends ErrorResponse {
  constructor(message = "Not Found") {
    super(message, StatusCode.NOT_FOUND, errorReason.NOT_FOUND);
  }
}

export class Unauthorized extends ErrorResponse {
  constructor(message = "Unauthorized") {
    super(message, StatusCode.UNAUTHORIZED, errorReason.UNAUTHORIZED);
  }
}

export class Forbidden extends ErrorResponse {
  constructor(message = "Forbidden") {
    super(message, StatusCode.FORBIDDEN, errorReason.FORBIDDEN);
  }
}
