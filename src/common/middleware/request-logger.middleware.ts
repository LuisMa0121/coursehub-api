import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * Registra contexto operativo de cada solicitud: método, ruta, estado y duración.
 * Nunca registra el header Authorization, contraseñas, tokens ni el body.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    res.on('finish', () => {
      this.logger.log(
        JSON.stringify({
          method: req.method,
          // Sin query string: podría contener tokens u otros datos sensibles
          path: req.originalUrl.split('?')[0],
          status: res.statusCode,
          durationMs: Date.now() - start,
        }),
      );
    });
    next();
  }
}
