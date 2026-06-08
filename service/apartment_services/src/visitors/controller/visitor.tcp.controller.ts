import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { VisitorService } from '../services/visitor-service';

@Controller()
export class VisitorTcpController {

  constructor(private readonly visitorService: VisitorService) {}

  @MessagePattern('visitor.create')
  create(@Payload() data: any) {
    return this.visitorService.create(data);
  }

  @MessagePattern('visitor.findAll')
  findAll() {
    return this.visitorService.findAll();
  }

  @MessagePattern('visitor.findOne')
  findOne(@Payload() data: { id: string }) {
    return this.visitorService.findOne(data.id);
  }

  @MessagePattern('visitor.updateStatus')
  updateStatus(@Payload() data: { id: string; status: string }) {
    return this.visitorService.updateStatus(data.id, data.status);
  }

  @MessagePattern('visitor.markEntry')
  markEntry(@Payload() data: { id: string }) {
    return this.visitorService.markEntry(data.id);
  }

  @MessagePattern('visitor.markExit')
  markExit(@Payload() data: { id: string }) {
    return this.visitorService.markExit(data.id);
  }

  @MessagePattern('visitor.delete')
  remove(@Payload() data: { id: string }) {
    return this.visitorService.delete(data.id);
  }
}