import { statusCodes } from "./statusCodes";
import { reasonPhrases } from "./reasonPhrases";
export class ErrorResponse {
  message: string;
  statusCode: number;
  reasonPhrase: string;

  constructor(message: string, statusCode: number, reasonPhrase: string) {
    this.message = message;
    this.statusCode = statusCode;
    this.reasonPhrase = reasonPhrase;
  }
  send(res: any) {
    return res.status(this.statusCode).json(this);
  }
}

export class ConflictRequestError extends ErrorResponse {
  constructor(
    message: string = reasonPhrases.CONFLICT,
    statusCode: number = statusCodes.CONFLICT,
    reasonPhrase: string = reasonPhrases.CONFLICT,
  ) {
    super(message, statusCode, reasonPhrase);
  }
}

export class BadRequestError extends ErrorResponse {
  constructor(
    message: string = reasonPhrases.BAD_REQUEST,
    statusCode: number = statusCodes.BAD_REQUEST,
    reasonPhrase: string = reasonPhrases.BAD_REQUEST,
  ) {
    super(message, statusCode, reasonPhrase);
  }
}
export class BadUserRequestError extends ErrorResponse {
  constructor(
    message: string = reasonPhrases.UNAUTHORIZED,
    statusCode: number = statusCodes.UNAUTHORIZED,
    reasonPhrase: string = reasonPhrases.UNAUTHORIZED,
  ) {
    super(message, statusCode, reasonPhrase);
  }
}
export class BadUser2RequestError extends ErrorResponse {
  constructor(
    message: string = reasonPhrases.FORBIDDEN,
    statusCode: number = statusCodes.FORBIDDEN,
    reasonPhrase: string = reasonPhrases.FORBIDDEN,
  ) {
    super(message, statusCode, reasonPhrase);
  }
}
