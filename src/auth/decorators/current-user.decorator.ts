import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Role } from '../../users/enums/role.enum.js';

/** Identidad mínima que necesitan los casos de uso. */
export interface Actor {
  id: number;
  role: Role;
}

/**
 * Extrae del request el usuario autenticado como Actor (o null si es anónimo).
 * Así el controlador recibe la identidad ya transformada y es fácil de probar.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Actor | null => {
    const user = ctx.switchToHttp().getRequest<{ user?: Actor }>().user;
    return user ? { id: user.id, role: user.role } : null;
  },
);
