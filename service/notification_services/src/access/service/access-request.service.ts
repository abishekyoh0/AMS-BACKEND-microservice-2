
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  AccessRequest,
  AccessRequestDocument,
} from '../schema/access-request.schema';

import { CreateAccessRequestDto } from '../dto/access-request/create-access-request.dto';
import { UpdateAccessRequestDto } from '../dto/access-request/update-access-request.dto';

@Injectable()
export class AccessRequestService {
  constructor(
    @InjectModel(AccessRequest.name)
    private readonly accessRequestModel: Model<AccessRequestDocument>,
  ) {}

  // CREATE
  async create(
    createAccessRequestDto: CreateAccessRequestDto,
  ): Promise<AccessRequest> {
    // Optional unique residentId check
    if (createAccessRequestDto.residentId) {
      const existingResident =
        await this.accessRequestModel.findOne({
          residentId: createAccessRequestDto.residentId,
        });

      if (existingResident) {
        throw new ConflictException('Resident ID already exists');
      }
    }

    const createdRequest = new this.accessRequestModel(
      createAccessRequestDto,
    );

    return createdRequest.save();
  }

  // FIND ALL
  async findAll(): Promise<AccessRequest[]> {
    return this.accessRequestModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  // FIND ONE
  async findOne(id: string): Promise<AccessRequest> {
    const accessRequest = await this.accessRequestModel
      .findById(id)
      .exec();

    if (!accessRequest) {
      throw new NotFoundException(
        `Access Request with ID ${id} not found`,
      );
    }

    return accessRequest;
  }

  // UPDATE
  async update(
    id: string,
    updateAccessRequestDto: UpdateAccessRequestDto,
  ): Promise<AccessRequest> {
    // Optional residentId duplicate check
    if (updateAccessRequestDto.residentId) {
      const existingResident =
        await this.accessRequestModel.findOne({
          residentId: updateAccessRequestDto.residentId,
          _id: { $ne: id },
        });

      if (existingResident) {
        throw new ConflictException('Resident ID already exists');
      }
    }

    const updatedAccessRequest =
      await this.accessRequestModel.findByIdAndUpdate(
        id,
        updateAccessRequestDto,
        {
          new: true,
          runValidators: true,
        },
      );

    if (!updatedAccessRequest) {
      throw new NotFoundException(
        `Access Request with ID ${id} not found`,
      );
    }

    return updatedAccessRequest;
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    const deletedAccessRequest =
      await this.accessRequestModel.findByIdAndDelete(id);

    if (!deletedAccessRequest) {
      throw new NotFoundException(
        `Access Request with ID ${id} not found`,
      );
    }

    return {
      message: 'Access Request deleted successfully',
    };
  }
}