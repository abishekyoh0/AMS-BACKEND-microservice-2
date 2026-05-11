import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Unit, UnitDocument } from '../schema/unit-schema';
import { Block, BlockDocument } from '../schema/block-schema';

@Injectable()
export class UnitsService {
  constructor(
    @InjectModel(Unit.name) private unitModel: Model<UnitDocument>,
    @InjectModel(Block.name) private blockModel: Model<BlockDocument>,
  ) { }

  async create(dto: { block_id: string; floor: number; unit_number: string; rent: number }) {
    const { block_id, floor, unit_number, rent } = dto;

    if (!isValidObjectId(block_id)) {
      throw new BadRequestException('Invalid Block ID');
    }

    const block = await this.blockModel.findById(block_id);
    if (!block) {
      throw new NotFoundException('Block not found');
    }

    const unit = new this.unitModel({
      block_id: new Types.ObjectId(block_id),
      floor,
      unit_number,
      rent,
      status: 'VACANT',
    });

    return unit.save();
  }

  async findAll() {
    return this.unitModel.find({ is_deleted: false });
  }

  async findByBlock(block_id: string) {
    if (!isValidObjectId(block_id)) throw new BadRequestException('Invalid Block ID');
    return this.unitModel.find({ block_id: new Types.ObjectId(block_id), is_deleted: false });
  }

  async update(id: string, dto: Partial<{ floor?: number; unit_number?: string; rent?: number }>) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid Unit ID');

    const unit = await this.unitModel.findByIdAndUpdate(id, dto, { new: true });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid Unit ID');
    const unit = await this.unitModel.findByIdAndDelete(id);
    if (!unit) throw new NotFoundException('Unit not found');
    return { message: 'Unit deleted successfully' };
  }
}