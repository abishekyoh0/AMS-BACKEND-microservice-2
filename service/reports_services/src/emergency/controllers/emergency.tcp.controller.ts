import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmergencyService } from '../services/emergency.service';

@Controller()
export class EmergencyTcpController {
  constructor(private readonly service: EmergencyService) { }

  @MessagePattern('emergency.create')
  create(@Payload() d: any) {
    return this.service.create(d.dto);
  }

  @MessagePattern('emergency.resolve')
  resolve(@Payload() d: any) {
    return this.service.resolveEmergency(d.emergency_id);
  }
  @MessagePattern('emergency.acknowledge')
  acknowledge(@Payload() d: any) { return this.service.acknowledge(d.emergency_id); }

  @MessagePattern('emergency.find_all')
  findAll() { return this.service.findAll(); }

  @MessagePattern('emergency.find_active')
  findActive() { return this.service.getActive(); }

  @MessagePattern('emergency.find_one')
  findOne(@Payload() d: any) { return this.service.findOne(d.emergency_id); }

  @MessagePattern('emergency.stats')
  stats() { return this.service.getStats(); }
}
