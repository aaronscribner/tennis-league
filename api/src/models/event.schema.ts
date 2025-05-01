import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @ApiProperty({ description: 'Title of the event', example: 'Sunday Tennis Match' })
  @Prop({ required: true })
  title: string;

  @ApiProperty({ description: 'Description of the event', example: 'Weekly tennis match at Central Park courts' })
  @Prop()
  description: string;

  @ApiProperty({ description: 'Date and time of the event', type: Date, example: '2025-05-15T14:00:00Z' })
  @Prop({ required: true })
  date: Date;

  @ApiProperty({ description: 'Location of the event', example: 'Central Park Tennis Courts' })
  @Prop({ required: true })
  location: string;

  @ApiProperty({ description: 'Array of attendee user IDs', type: [String], example: ['60d0fe4f5311236168a109ca'] })
  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'User' }], default: [] })
  attendees: any[];

  @ApiProperty({ description: 'Whether singles matches are allowed', default: true, example: true })
  @Prop({ default: true })
  allowSingles: boolean;

  @ApiProperty({ description: 'Whether doubles matches are allowed', default: true, example: true })
  @Prop({ default: true })
  allowDoubles: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);