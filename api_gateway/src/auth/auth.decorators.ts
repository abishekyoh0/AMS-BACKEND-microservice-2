import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../common/enums/roles.enum';

/** Skip JWT on a route */
export const Public = () => SetMetadata('isPublic', true);

/** Restrict route to specific roles */
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

/** Inject the current authenticated user from request */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
);
