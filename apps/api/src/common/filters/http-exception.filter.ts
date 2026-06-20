import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof exceptionResponse === "string"
        ? exceptionResponse
        : typeof exceptionResponse === "object" && exceptionResponse !== null && "message" in exceptionResponse
          ? Array.isArray((exceptionResponse as { message: unknown }).message)
            ? ((exceptionResponse as { message: string[] }).message).join("; ")
            : String((exceptionResponse as { message: unknown }).message)
          : "Internal server error";

    const error =
      status === HttpStatus.BAD_REQUEST
        ? "Bad Request"
        : status === HttpStatus.UNAUTHORIZED
          ? "Unauthorized"
          : status === HttpStatus.FORBIDDEN
            ? "Forbidden"
            : status === HttpStatus.NOT_FOUND
              ? "Not Found"
              : "Error";

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
