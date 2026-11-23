import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Mide la duración del handler. No registra cuerpos ni oculta errores. */
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Timing');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const handler = `${context.getClass().name}.${context.getHandler().name}`;
    return next.handle().pipe(
      tap(() =>
        this.logger.debug(JSON.stringify({ handler, durationMs: Date.now() - start })),
      ),
    );
  }
}
