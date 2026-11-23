import { Injectable, Optional } from '@nestjs/common';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  constructor(@Optional() options?: AuthModuleOptions) {
    super(options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest(err: any, user: any) {
    // Si no hay token o la autenticación falló, no lanzamos 401;
    // permitimos que continúe con user = null para no romper rutas públicas/compatibles
    return user || null;
  }
}
