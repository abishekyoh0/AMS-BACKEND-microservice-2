import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ComplaintsDocument = HydratedDocument<Complaints>;

@Schema({ timestamps: true })
export class Complaints {

  @Prop()
  user_id!: string;

  @Prop({ required: true, unique: true })
  complaint_id!: string;

  @Prop()
  resident_id!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  })
  priority!: "Low" | "Medium" | "High";

  @Prop({
    enum: ["Open", "In Progress", "Completed", "Closed"],
    default: "Open",
  })
  status!: "Open" | "In Progress" | "Completed" | "Closed";

  @Prop()
  images!: string;

  @Prop({ default: false })
  is_deleted!: boolean;

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const ComplaintsSchema =
  SchemaFactory.createForClass(Complaints);