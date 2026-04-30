import { Body, Controller, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiTags, ApiOperation, ApiBody, ApiResponse,
  ApiBearerAuth, ApiParam,
} from '@nestjs/swagger';
import { Roles, CurrentUser } from '../auth/auth.decorators';
import { Role } from '../common/enums/roles.enum';
import {
  CreateAdminBody, CreateSubAdminBody, CreateGatekeeperBody,
  CreateAccountantBody, CreateResidentBody, CreateWorkerBody,
} from '../common/swagger/api-bodies.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersGatewayController {
  constructor(@Inject('AUTH_SERVICE') private readonly auth: ClientProxy) {}

  @Roles(Role.SUPER_ADMIN)
  @Post('admin')
  @ApiOperation({ summary: 'SUPER_ADMIN creates an ADMIN' })
  @ApiBody({ type: CreateAdminBody })
  @ApiResponse({ status: 201, description: 'Admin created' })
  createAdmin(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(this.auth.send('users.create_admin', {
      creator_id: user._id || user.id, creator_role: user.role, dto: body,
    }));
  }

  @Roles(Role.ADMIN)
  @Post('sub-admin')
  @ApiOperation({
    summary: 'ADMIN creates a sub-admin',
    description: 'role field must be one of: admin_maintenance | admin_security | admin_account',
  })
  @ApiBody({ type: CreateSubAdminBody })
  createSubAdmin(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(this.auth.send('users.create_sub_admin', {
      creator_id: user._id || user.id, creator_role: user.role, dto: body,
    }));
  }

  @Roles(Role.ADMIN_SECURITY)
  @Post('gatekeeper')
  @ApiOperation({ summary: 'ADMIN_SECURITY creates a GATEKEEPER' })
  @ApiBody({ type: CreateGatekeeperBody })
  createGatekeeper(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(this.auth.send('users.create_gatekeeper', {
      creator_id: user._id || user.id, creator_role: user.role, dto: body,
    }));
  }

  @Roles(Role.ADMIN_ACCOUNT)
  @Post('accountant')
  @ApiOperation({ summary: 'ADMIN_ACCOUNT creates an ACCOUNTANT' })
  @ApiBody({ type: CreateAccountantBody })
  createAccountant(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(this.auth.send('users.create_accountant', {
      creator_id: user._id || user.id, creator_role: user.role, dto: body,
    }));
  }

  @Roles(Role.ADMIN)
  @Post('resident')
  @ApiOperation({
    summary: 'ADMIN creates a RESIDENT',
    description: 'No password set here — resident sets their own password during move-in form (first login).',
  })
  @ApiBody({ type: CreateResidentBody })
  createResident(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(this.auth.send('users.create_resident', {
      creator_id: user._id || user.id, creator_role: user.role, dto: body,
    }));
  }

  @Roles(Role.ADMIN_MAINTENANCE)
  @Post('worker')
  @ApiOperation({
    summary: 'ADMIN_MAINTENANCE adds a WORKER',
    description: 'Workers have NO login. This only creates a record used for maintenance task assignment.',
  })
  @ApiBody({ type: CreateWorkerBody })
  createWorker(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(this.auth.send('users.create_worker', {
      creator_id: user._id || user.id, creator_role: user.role, dto: body,
    }));
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve a pending resident account' })
  @ApiParam({ name: 'id', description: 'Resident user _id' })
  approveResident(@Param('id') id: string) {
    return firstValueFrom(this.auth.send('users.approve_resident', { user_id: id }));
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate any user account' })
  @ApiParam({ name: 'id', description: 'User _id' })
  deactivate(@Param('id') id: string) {
    return firstValueFrom(this.auth.send('users.deactivate', { user_id: id }));
  }

  @Get('my-team')
  @ApiOperation({ summary: 'List all users created by the current user' })
  getMyTeam(@CurrentUser() user: any) {
    return firstValueFrom(this.auth.send('users.get_by_creator', {
      creator_id: user._id || user.id,
    }));
  }

  @Roles(Role.ADMIN_MAINTENANCE)
  @Get('workers')
  @ApiOperation({ summary: 'List all workers created by this ADMIN_MAINTENANCE' })
  getWorkers(@CurrentUser() user: any) {
    return firstValueFrom(this.auth.send('users.get_workers', {
      creator_id: user._id || user.id,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User _id' })
  getById(@Param('id') id: string) {
    return firstValueFrom(this.auth.send('users.get_by_id', { id }));
  }
}
