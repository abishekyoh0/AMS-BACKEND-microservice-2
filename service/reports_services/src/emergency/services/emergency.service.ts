// import { Injectable, Inject } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { ClientKafka } from '@nestjs/microservices';
// import { Emergency, EmergencyDocument } from '../schema/emergency.schema';
// import { CreateEmergencyDto } from '../dto/create-emergency.dto';
// import { UpdateEmergencyDto } from '../dto/update-emergency.dto';
// import { KafkaService } from '../kafka/kafka.service';

// @Injectable()
// export class EmergencyService {
//   kafkaClient: any;

//   constructor(
//   @InjectModel(Emergency.name)
//   private emergencyModel: Model<EmergencyDocument>,
//   private kafkaService: KafkaService,
// ) {}

// async requestExcelReport(type: 'ALL' | 'SINGLE', id?: string) {
//   await this.kafkaService.sendEvent('generate-report', {
//     type,
//     id,
//   });

//   return { message: 'Report generation started' };
// }

//   async create(dto: CreateEmergencyDto) {

//     const count = await this.emergencyModel.countDocuments();

//     let prefix = "ALT";

//     if (dto.type.toLowerCase().includes("fire")) prefix = "FIRE";
//     else if (dto.type.toLowerCase().includes("medical")) prefix = "MEDICAL";
//     else if (dto.type.toLowerCase().includes("power")) prefix = "POWER";
//     else if (dto.type.toLowerCase().includes("water")) prefix = "WATER";

//     const alertId = `${prefix}${String(count + 1).padStart(3, "0")}`;

//     const time = new Date().toLocaleTimeString("en-IN", {
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });

//     const emergency = new this.emergencyModel({
//       ...dto,
//       alertId,
//       time,
//       acknowledged: 0,
//       status: "Active",
//     });

//     return emergency.save();
//   }
//   async findAll() {
//     return this.emergencyModel.find().sort({ createdAt: -1 });
//   }

//   async findOne(id: string) {
//     return this.emergencyModel.findById(id);
//   }

//   async update(id: string, dto: UpdateEmergencyDto) {
//     return this.emergencyModel.findByIdAndUpdate(id, dto, { new: true });
//   }

//   async remove(id: string) {
//     return this.emergencyModel.findByIdAndDelete(id);
//   }

//   async resolveEmergency(id: string) {
//     return this.emergencyModel.findByIdAndUpdate(
//       id,
//       { status: 'Resolved' },
//       { new: true },
//     );
//   }

//   async getStats() {
//     const total = await this.emergencyModel.countDocuments();
//     const active = await this.emergencyModel.countDocuments({ status: 'Active' });
//     const resolved = await this.emergencyModel.countDocuments({ status: 'Resolved' });

//     const highPriority = await this.emergencyModel.countDocuments({
//       priority: 'High',
//       status: 'Active',
//     });

//     return {
//       total,
//       active,
//       resolved,
//       highPriority,
//     };
//   }
// }

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Emergency, EmergencyDocument } from '../schema/emergency.schema';
import { CreateEmergencyDto } from '../dto/create-emergency.dto';
import { UpdateEmergencyDto } from '../dto/update-emergency.dto';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class EmergencyService {
  constructor(
    @InjectModel(Emergency.name)
    private emergencyModel: Model<EmergencyDocument>,
    private kafkaService: KafkaService,
  ) {}

  async create(dto: CreateEmergencyDto) {
    const count = await this.emergencyModel.countDocuments();

    let prefix = 'ALT';

    if (dto.type?.toLowerCase().includes('fire')) prefix = 'FIRE';
    else if (dto.type?.toLowerCase().includes('medical')) prefix = 'MED';
    else if (dto.type?.toLowerCase().includes('power')) prefix = 'PWR';
    else if (dto.type?.toLowerCase().includes('water')) prefix = 'WTR';

    const alertId = `${prefix}${String(count + 1).padStart(3, '0')}`;

    const time = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const emergency = new this.emergencyModel({
      ...dto,
      alertId,
      time,
      acknowledged: 0,
      status: 'Active',
    });

    return emergency.save();
  }

  async findAll() {
    return this.emergencyModel.find().sort({ createdAt: -1 });
  }

  async getActive() {
    return this.emergencyModel
      .find({ status: 'Active' })
      .sort({ createdAt: -1 });
  }

  async getHistory() {
    return this.emergencyModel
      .find()
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    return this.emergencyModel.findById(id);
  }

  async update(id: string, dto: UpdateEmergencyDto) {
    return this.emergencyModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async remove(id: string) {
    return this.emergencyModel.findByIdAndDelete(id);
  }

  async resolveEmergency(id: string) {
    return this.emergencyModel.findByIdAndUpdate(
      id,
      { status: 'Resolved' },
      { new: true },
    );
  }

  async acknowledge(id: string) {
    return this.emergencyModel.findByIdAndUpdate(
      id,
      { $inc: { acknowledged: 1 } },
      { new: true },
    );
  }

  async getStats() {
    const total = await this.emergencyModel.countDocuments();

    const active = await this.emergencyModel.countDocuments({
      status: 'Active',
    });

    const resolved = await this.emergencyModel.countDocuments({
      status: 'Resolved',
    });

    const highPriority = await this.emergencyModel.countDocuments({
      priority: 'High',
      status: 'Active',
    });

    return {
      total,
      active,
      resolved,
      highPriority,
    };
  }

  async requestExcelReport(type: 'ALL' | 'SINGLE', id?: string) {
    await this.kafkaService.sendEvent('generate-report', {
      type,
      id,
    });

    return { message: 'Report generation started' };
  }
}