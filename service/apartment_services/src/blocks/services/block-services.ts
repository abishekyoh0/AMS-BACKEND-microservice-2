import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';

import { Block, BlockDocument } from '../schema/block-schema';
import { Flat, FlatDocument } from '../schema/flat-schema';
import { Floor, FloorDocument } from '../schema/floor-schema';
import { Unit, UnitDocument } from '../schema/unit-schema';

import { CreateBlockDto } from '../dto/create-block.dto';
import { UpdateBlockDto } from '../dto/update-block.dto';

@Injectable()
export class BlocksService {
  constructor(
    @InjectModel(Block.name)
    private blockModel: Model<BlockDocument>,

    @InjectModel(Flat.name)
    private flatModel: Model<FlatDocument>,

    @InjectModel(Floor.name)
    private floorModel: Model<FloorDocument>,

    @InjectModel(Unit.name)
    private unitModel: Model<UnitDocument>,
  ) { }

  async create(createBlockDto: CreateBlockDto) {
    const block = new this.blockModel(createBlockDto);
    return block.save();
  }

  async findAll() {
    return this.blockModel.find({ is_deleted: false });
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid Block ID');

    const block = await this.blockModel.findById(new Types.ObjectId(id));
    if (!block) throw new NotFoundException('Block not found');

    return block;
  }

  async update(id: string, updateBlockDto: UpdateBlockDto) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid Block ID');

    const updated = await this.blockModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      updateBlockDto,
      { new: true },
    );

    if (!updated) throw new NotFoundException('Block not found');

    return updated;
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid Block ID');

    const deleted = await this.blockModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      { is_deleted: true },
      { new: true },
    );

    if (!deleted) throw new NotFoundException('Block not found');

    return deleted;
  }

  async getFullDetails(blockId: string) {
    if (!isValidObjectId(blockId)) throw new BadRequestException('Invalid Block ID');

    const objectId = new Types.ObjectId(blockId);

    const block = await this.blockModel.findById(objectId);
    if (!block) throw new NotFoundException('Block not found');

    const floors = await this.floorModel.find({ block_id: objectId, is_deleted: false });
    const flats = await this.flatModel.find({ block_id: objectId, is_deleted: false });
    const units = await this.unitModel.find({ block_id: objectId, is_deleted: false });

    return {
      block,
      counts: {
        floors: floors.length,
        flats: flats.length,
        units: units.length,
      },
      floors,
      flats,
      units,
    };
  }
}  

