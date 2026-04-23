import { statusCodes } from "./statusCodes";
import { reasonPhrases } from "./reasonPhrases";

interface SuccessResponseOptions {
  message?: string;
  statusCode?: number;
  reasonPhrasesCode?: string;
  metadata?: any;
}

export class SuccessResponse {
  message: string;
  statusCode: number;
  metadata: any;

  constructor(options: SuccessResponseOptions) {
    const {
      message = "",
      statusCode = statusCodes.OK,
      reasonPhrasesCode = reasonPhrases.OK,
      metadata = {},
    } = options;

    this.message = !message ? reasonPhrasesCode : message;
    this.statusCode = statusCode;
    this.metadata = metadata;
  }

  send(res: any, header: any = {}) {
    return res.status(this.statusCode).json(this);
  }
}

export class OK extends SuccessResponse {
  constructor(options: SuccessResponseOptions = {}) {
    const {
      message = "",
      statusCode = statusCodes.OK,
      reasonPhrasesCode = reasonPhrases.OK,
      metadata = {},
    } = options;

    super({ message, statusCode, reasonPhrasesCode, metadata });
  }
}

export class CREATED extends SuccessResponse {
  constructor(options: SuccessResponseOptions = {}) {
    const {
      message = "",
      statusCode = statusCodes.CREATED,
      reasonPhrasesCode = reasonPhrases.CREATED,
      metadata = {},
    } = options;

    super({ message, statusCode, reasonPhrasesCode, metadata });
  }
}
