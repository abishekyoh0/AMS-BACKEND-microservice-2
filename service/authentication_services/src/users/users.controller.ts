import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('users.create_admin')
  createAdmin(@Payload() d: any) {
    return this.usersService.createAdmin(d.creator_id, d.creator_role, d.dto);
  }

  @MessagePattern('users.create_sub_admin')
  createSubAdmin(@Payload() d: any) {
    return this.usersService.createSubAdmin(d.creator_id, d.creator_role, d.dto);
  }

  @MessagePattern('users.create_gatekeeper')
  createGatekeeper(@Payload() d: any) {
    return this.usersService.createGatekeeper(d.creator_id, d.creator_role, d.dto);
  }

  @MessagePattern('users.create_accountant')
  createAccountant(@Payload() d: any) {
    return this.usersService.createAccountant(d.creator_id, d.creator_role, d.dto);
  }

  @MessagePattern('users.create_resident')
  createResident(@Payload() d: any) {
    return this.usersService.createResident(d.creator_id, d.creator_role, d.dto);
  }

  @MessagePattern('users.create_worker')
  createWorker(@Payload() d: any) {
    return this.usersService.createWorker(d.creator_id, d.creator_role, d.dto);
  }

  @MessagePattern('users.approve_resident')
  approveResident(@Payload() d: { user_id: string }) {
    return this.usersService.approveResident(d.user_id);
  }

  @MessagePattern('users.get_by_creator')
  getByCreator(@Payload() d: { creator_id: string }) {
    return this.usersService.getByCreator(d.creator_id);
  }

  @MessagePattern('users.get_workers')
  getWorkers(@Payload() d: { creator_id: string }) {
    return this.usersService.getWorkersByCreator(d.creator_id);
  }

  @MessagePattern('users.get_by_id')
  getById(@Payload() d: { id: string }) {
    return this.usersService.findById(d.id);
  }

  @MessagePattern('users.deactivate')
  deactivate(@Payload() d: { user_id: string }) {
    return this.usersService.deactivate(d.user_id);
  }
}
