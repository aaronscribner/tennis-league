import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { Event } from './event.schema';

export type MatchDocument = Match & Document;

@Schema()
export class Team {
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  players: User[];
  
  @Prop({ default: 0 })
  score: number;
}

@Schema({ timestamps: true })
export class Match {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  event: Event;

  @Prop({ required: true })
  matchNumber: number;

  @Prop({ type: Object })
  teamA: Team;

  @Prop({ type: Object })
  teamB: Team;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop()
  notes: string;
  
  @Prop({ default: Date.now })
  scheduledTime: Date;
}

export const MatchSchema = SchemaFactory.createForClass(Match);

export type LineupDocument = Lineup & Document;

@Schema({ timestamps: true })
export class Lineup {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  event: Event;

  @Prop({ type: [{ type: Object }] })
  matches: Match[];

  @Prop({ default: false })
  isPublished: boolean;
  
  @Prop({ default: 'auto' })
  generationType: string;
}

export const LineupSchema = SchemaFactory.createForClass(Lineup);