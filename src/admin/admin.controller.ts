import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Role } from '../users/enums/role.enum.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('dashboard')
  @Roles(Role.ADMIN)
  getDashboard() {
    return {
      message: 'Acceso concedido al panel exclusivo de administración',
      access: 'granted',
      role: Role.ADMIN,
      status: 'operational',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('users')
  @Roles(Role.ADMIN)
  getUsersSummary() {
    return {
      message: 'Listado administrativo de seguridad y gestión de identidades',
      metrics: {
        activeSessions: 1,
        defenseInDepth: 'enabled',
        rolesProtected: true,
      },
    };
  }
}
