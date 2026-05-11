
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AccessRequestService } from '../service/access-request.service';

import { CreateAccessRequestDto } from '../dto/access-request/create-access-request.dto';
import { UpdateAccessRequestDto } from '../dto/access-request/update-access-request.dto';

@ApiTags('Access Requests')
@Controller('access-requests')
export class AccessRequestController {
  constructor(
    private readonly accessRequestService: AccessRequestService,
  ) {}

  // CREATE
  @Post()
  @ApiOperation({ summary: 'Create access request' })
  @ApiResponse({
    status: 201,
    description: 'Access request created successfully',
  })
  create(
    @Body() createAccessRequestDto: CreateAccessRequestDto,
  ) {
    return this.accessRequestService.create(
      createAccessRequestDto,
    );
  }

  // GET ALL
  @Get()
  @ApiOperation({ summary: 'Get all access requests' })
  @ApiResponse({
    status: 200,
    description: 'List of all access requests',
  })
  findAll() {
    return this.accessRequestService.findAll();
  }

  // GET ONE
  @Get(':id')
  @ApiOperation({ summary: 'Get access request by ID' })
  @ApiResponse({
    status: 200,
    description: 'Access request found',
  })
  @ApiResponse({
    status: 404,
    description: 'Access request not found',
  })
  findOne(@Param('id') id: string) {
    return this.accessRequestService.findOne(id);
  }

  // UPDATE
  @Patch(':id')
  @ApiOperation({ summary: 'Update access request' })
  @ApiResponse({
    status: 200,
    description: 'Access request updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Access request not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateAccessRequestDto: UpdateAccessRequestDto,
  ) {
    return this.accessRequestService.update(
      id,
      updateAccessRequestDto,
    );
  }

  // DELETE
  @Delete(':id')
  @ApiOperation({ summary: 'Delete access request' })
  @ApiResponse({
    status: 200,
    description: 'Access request deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Access request not found',
  })
  remove(@Param('id') id: string) {
    return this.accessRequestService.remove(id);
  }
}