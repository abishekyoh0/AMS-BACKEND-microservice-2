import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Floor, FloorDocument } from '../schema/floor-schema';
import { CreateFloorDto } from '../dto/create-floor.dto';
import { UpdateFloorDto } from '../dto/update-floor.dto';

@Injectable()
export class FloorsService {
  constructor(
    @InjectModel(Floor.name) private floorModel: Model<FloorDocument>,
  ) { }

  async create(createFloorDto: CreateFloorDto) {
    const { block_id, floor_number } = createFloorDto;

    if (!isValidObjectId(block_id)) {
      throw new BadRequestException('Invalid Block ID');
    }

    const floor = new this.floorModel({
      block_id: new Types.ObjectId(block_id),
      floor_number,
    });

    return floor.save();
  }

  async findAll() {
    return this.floorModel.find({ is_deleted: false });
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid Floor ID');

    const floor = await this.floorModel.findById(id);
    if (!floor) throw new NotFoundException('Floor not found');

    return floor;
  }

  async update(id: string, updateFloorDto: UpdateFloorDto) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid Floor ID');

    const floor = await this.floorModel.findByIdAndUpdate(id, updateFloorDto, { new: true });
    if (!floor) throw new NotFoundException('Floor not found');

    return floor;
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid Floor ID');

    const floor = await this.floorModel.findByIdAndDelete(id);
    if (!floor) throw new NotFoundException('Floor not found');

    return { message: 'Floor deleted successfully' };
  }
}