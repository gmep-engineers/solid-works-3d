import { Injectable, CanActivate, ExecutionContext, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Strict Supplier Isolation Rule:
    // If authenticated user is a SUPPLIER and accesses any endpoint outside of /api/v1/supplier/*,
    // immediately return 404 Not Found (concealing all storefront, admin, and pricing endpoints).
    if (user && user.role === 'SUPPLIER') {
      const url = request.originalUrl || request.url;
      if (!url.startsWith('/api/v1/supplier')) {
        throw new NotFoundException('Resource not found');
      }
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!user) {
      return false;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      if (user.role === 'SUPPLIER') {
        throw new NotFoundException('Resource not found');
      }
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    return true;
  }
}
