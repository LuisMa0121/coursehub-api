import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  CourseNotFoundError,
  CourseOwnershipError,
} from '../../courses/domain/course-errors.js';

/**
 * Filtro global: toda respuesta de error tiene la misma forma
 * { statusCode, error, message, path, timestamp } y nunca expone trazas,
 * SQL ni variables de entorno. El detalle de los 500 queda solo en el log interno.
 */
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = request.url.split('?')[0];

    const { status, message } = this.resolve(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${path}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      // "NOT_FOUND" -> "Not Found"
      error: (HttpStatus[status] ?? 'ERROR')
        .toLowerCase()
        .split('_')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' '),
      message,
      path,
      timestamp: new Date().toISOString(),
    });
  }

  private resolve(exception: unknown): {
    status: number;
    message: string | string[];
  } {
    if (exception instanceof CourseNotFoundError) {
      return { status: HttpStatus.NOT_FOUND, message: exception.message };
    }
    if (exception instanceof CourseOwnershipError) {
      return { status: HttpStatus.FORBIDDEN, message: exception.message };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= 500) {
        return { status, message: 'Internal server error' };
      }
      const body = exception.getResponse();
      if (typeof body === 'string') return { status, message: body };
      if (typeof body === 'object' && body !== null && 'message' in body) {
        return { status, message: (body as { message: string | string[] }).message };
      }
      return { status, message: exception.message };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
