import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Visitor, VisitorDocument } from '../schema/visitor-schema';
import { Model } from 'mongoose';
import { CreateVisitorDto } from '../dto/visitor-create.dto';

@Injectable()
export class VisitorService {

  constructor(
    @InjectModel(Visitor.name) private visitorModel: Model<VisitorDocument>,
  ) { }

  async create(createVisitorDto: CreateVisitorDto) {
    const visitor = new this.visitorModel(createVisitorDto);
    return visitor.save();
  }

  async findAll() {
    return this.visitorModel.find({ is_deleted: false });
  }

  async findOne(id: string) {
    const visitor = await this.visitorModel.findById(id);
    if (!visitor) throw new NotFoundException('Visitors not found');
    return visitor;
  }

  async updateStatus(id: string, status: string) {
    return this.visitorModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  }

  async markEntry(id: string) {
    return this.visitorModel.findByIdAndUpdate(
      id,
      { entry_time: new Date(), status: 'Approved' },
      { new: true }
    );
  }

  async markExit(id: string) {
    return this.visitorModel.findByIdAndUpdate(
      id,
      { exit_time: new Date(), status: 'Completed' },
      { new: true }
    );
  }

  async delete(id: string) {
    return this.visitorModel.findByIdAndUpdate(
      id,
      { is_deleted: true },
      { new: true }
    );
  }
}