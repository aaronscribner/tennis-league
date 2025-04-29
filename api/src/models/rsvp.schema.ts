import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { Event } from './event.schema';

export type RsvpDocument = Rsvp & Document;

@Schema({ timestamps: true })
export class Rsvp {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  event: Event;

  @Prop({ default: false })
  preferSingles: boolean;

  @Prop({ default: false })
  isAttending: boolean;
  
  @Prop()
  notes: string;
}

export const RsvpSchema = SchemaFactory.createForClass(Rsvp);