import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, throwError } from 'rxjs';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip guard for @Public() routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('No token provided');

    // Ask auth microservice to validate
    const result = await firstValueFrom(
      this.authClient.send('auth.verify_token', { token }).pipe(
        timeout(5000),
        catchError(() =>
          throwError(() => new UnauthorizedException('Token verification failed')),
        ),
      ),
    );

    if (!result?.valid) throw new UnauthorizedException('Invalid or expired token');

    // Attach user to request so controllers can read it
    request.user = result.user;

    // Check @Roles() if present
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles?.length) {
      if (!requiredRoles.includes(request.user.role)) {
        throw new UnauthorizedException(
          `Access denied. Required: ${requiredRoles.join(', ')}`,
        );
      }
    }

    return true;
  }

  private extractToken(req: any): string | null {
    const header = req.headers?.authorization;
    if (!header) return null;
    const [type, token] = header.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
