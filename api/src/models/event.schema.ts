import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type EventDocument = Event & Document;

export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

@Schema({ timestamps: true })
export class Event {
  @ApiProperty({ 
    description: 'Title of the event',
    example: 'Sunday Tennis Match', 
  })
  @Prop({ required: true })
  title: string;

  @ApiProperty({ 
    description: 'Description of the event',
    example: 'Weekly tennis match at Central Park courts', 
  })
  @Prop()
  description: string;

  @ApiProperty({ 
    description: 'Date and time of the event',
    type: Date,
    example: '2025-05-15T14:00:00Z', 
  })
  @Prop({ required: true })
  date: Date;

  @ApiProperty({ 
    description: 'Location of the event',
    example: 'Central Park Tennis Courts', 
  })
  @Prop({ required: true })
  location: string;

  @ApiProperty({ 
    description: 'Array of attendee user IDs',
    type: [String],
    example: ['60d0fe4f5311236168a109ca'], 
  })
  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'User' }], default: [] })
  attendees: any[];

  @ApiProperty({ 
    description: 'Maximum number of singles players allowed',
    example: 8, 
  })
  @Prop({ required: true, default: 8 })
  maxSinglesPlayers: number;

  @ApiProperty({ 
    description: 'Maximum number of doubles players allowed',
    example: 16, 
  })
  @Prop({ required: true, default: 16 })
  maxDoublesPlayers: number;

  @ApiProperty({ 
    description: 'Whether the event is cancelled',
    default: false,
    example: false, 
  })
  @Prop({ default: false })
  isCancelled: boolean;

  @ApiProperty({ 
    description: 'Whether singles matches are allowed',
    default: true,
    example: true, 
  })
  @Prop({ default: true })
  isSinglesAllowed: boolean;

  @ApiProperty({ 
    description: 'Whether doubles matches are allowed',
    default: true,
    example: true, 
  })
  @Prop({ default: true })
  isDoublesAllowed: boolean;

  @ApiProperty({
    description: 'Series ID - connects recurring events together',
    example: '60d0fe4f5311236168a109ca',
  })
  @Prop({ type: String })
  seriesId: string;

  @ApiProperty({
    description: 'Recurrence type',
    enum: RecurrenceType,
    default: RecurrenceType.NONE,
    example: 'weekly',
  })
  @Prop({ default: RecurrenceType.NONE, type: String, enum: RecurrenceType })
  recurrenceType: RecurrenceType;

  @ApiProperty({
    description: 'End date for recurring events',
    type: Date,
    example: '2025-05-15T14:00:00Z',
  })
  @Prop()
  recurrenceEndDate: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);