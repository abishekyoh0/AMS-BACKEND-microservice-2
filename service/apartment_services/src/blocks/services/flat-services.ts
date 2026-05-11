import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Flat, FlatDocument } from '../schema/flat-schema';
import { Model, Types, isValidObjectId } from 'mongoose';
import { CreateFlatDto } from '../dto/create-flat.dto';
import { UpdateFlatDto } from '../dto/update-flat.dto';

@Injectable()
export class FlatsService {
  constructor(
    @InjectModel(Flat.name)
    private flatModel: Model<FlatDocument>,
  ) { }

  async create(dto: CreateFlatDto) {
    if (!isValidObjectId(dto.block_id) || !isValidObjectId(dto.floor_id)) {
      throw new BadRequestException('Invalid block_id or floor_id');
    }

    const flat = new this.flatModel({
      ...dto,
      block_id: new Types.ObjectId(dto.block_id),
      floor_id: new Types.ObjectId(dto.floor_id),
    });

    return flat.save();
  }

  async findAll() {
    return this.flatModel
      .find({ is_deleted: false })
      .populate('block_id')
      .populate('floor_id');
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid Flat ID');

    const flat = await this.flatModel
      .findById(id)
      .populate('block_id')
      .populate('floor_id');

    if (!flat) throw new NotFoundException('Flat not found');

    return flat;
  }

  async update(id: string, dto: UpdateFlatDto) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid Flat ID');

    const flat = await this.flatModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    );

    if (!flat) throw new NotFoundException('Flat not found');

    return flat;
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid Flat ID');

    const flat = await this.flatModel.findByIdAndDelete(id);

    if (!flat) throw new NotFoundException('Flat not found');

    return { message: 'Flat deleted successfully' };
  }

  async findByBlock(blockId: string) {
    if (!isValidObjectId(blockId)) throw new BadRequestException('Invalid Block ID');
    return this.flatModel.find({ block_id: new Types.ObjectId(blockId), is_deleted: false });
  }

  async findByFloor(floorId: string) {
    if (!isValidObjectId(floorId)) throw new BadRequestException('Invalid Floor ID');
    return this.flatModel.find({ floor_id: new Types.ObjectId(floorId), is_deleted: false });
  }
} 
