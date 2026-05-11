// notification.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { NotificationService } from '../service/notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private service: NotificationService) {}

  //  Create (single)
  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  //  Admin send
  @Post('admin')
  adminSend(@Body() dto: any) {
    return this.service.sendFromAdmin(dto);
  }

  //  Get user notifications
  @Get()
  findAll(@Req() req: any, @Query() query: any) {
    return this.service.findAll(req.user.id, query);
  }

  //  Mark as read
  @Patch(':id/read')
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.service.markRead(id, req.user.id);
  }

  //  Mark all read
  @Patch('mark-all/:panelType')
  markAll(@Req() req: any, @Param('panelType') panelType: string) {
    return this.service.markAll(req.user.id, panelType);
  }

  //  Counts (badge UI)
  @Get('counts/:panelType')
  counts(@Req() req: any, @Param('panelType') panelType: string) {
    return this.service.getCounts(req.user.id, panelType);
  }
}  
