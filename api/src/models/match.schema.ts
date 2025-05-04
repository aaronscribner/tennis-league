import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { Event } from './event.schema';

export type MatchDocument = Match & Document;

// Set class for singles and doubles match
@Schema()
export class Set {
  @Prop({ default: 0 })
  teamAGames: number;
  
  @Prop({ default: 0 })
  teamBGames: number;
  
  @Prop({ default: false })
  isTiebreak: boolean;
  
  @Prop()
  tiebreakScore: string;
  
  @Prop({ default: false })
  isCompleted: boolean;
}

// Game class for singles matches
@Schema()
export class Game {
  @Prop({ default: 0 })
  playerAScore: number;
  
  @Prop({ default: 0 })
  playerBScore: number;
  
  @Prop({ default: false })
  isCompleted: boolean;
}

// Singles Set model (contains games for singles matches)
@Schema()
export class SinglesSet {
  @Prop({ default: 0 })
  playerAGames: number;
  
  @Prop({ default: 0 })
  playerBGames: number;
  
  @Prop({ default: false })
  isTiebreak: boolean;
  
  @Prop()
  tiebreakScore: string;
  
  @Prop({ default: false })
  isCompleted: boolean;
  
  @Prop({ type: [{ type: Object }], default: [] })
  games: Game[];
}

@Schema()
export class Team {
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  players: User[];
  
  @Prop({ default: 0 })
  score: number;
}

// Base match class with common properties
@Schema({ 
  timestamps: true, 
  discriminatorKey: 'matchType' 
})
export class Match {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  event: Event;

  @Prop({ required: true })
  matchNumber: number;

  @Prop({ 
    type: String, 
    enum: ['singles', 'doubles'], 
    required: true 
  })
  matchType: string;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop()
  notes: string;
  
  @Prop({ default: Date.now })
  scheduledTime: Date;
  
  @Prop({ default: 'regular' })
  scoringFormat: string;
}

// Singles match with two individual players
@Schema()
export class SinglesMatch extends Match {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  playerA: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  playerB: User;
  
  @Prop({ type: [{ type: Object }], default: [] })
  sets: SinglesSet[];
  
  @Prop({ default: 0 })
  playerASetsWon: number;
  
  @Prop({ default: 0 })
  playerBSetsWon: number;
  
  @Prop({ default: 3 })
  maxSets: number;
}

// Configuration for doubles match combinations
@Schema()
export class DoublesTeamCombination {
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], required: true })
  teamA: User[];
  
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], required: true })
  teamB: User[];
  
  @Prop({ type: [{ type: Object }], default: [] })
  sets: Set[];
  
  @Prop({ default: 0 })
  teamASetsWon: number;
  
  @Prop({ default: 0 })
  teamBSetsWon: number;
  
  @Prop()
  combinationName: string;
  
  @Prop({ default: false })
  isCompleted: boolean;
}

// Doubles match with four players in different combinations
@Schema()
export class DoublesMatch extends Match {
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], required: true })
  players: User[];
  
  @Prop({ type: [{ type: Object }], default: [] })
  combinations: DoublesTeamCombination[];
  
  @Prop()
  winningCombination: string;
  
  @Prop({ default: 3 })
  maxSets: number;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
export const SinglesMatchSchema = SchemaFactory.createForClass(SinglesMatch);
export const DoublesMatchSchema = SchemaFactory.createForClass(DoublesMatch);

export type LineupDocument = Lineup & Document;

@Schema({ timestamps: true })
export class Lineup {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  event: Event;

  @Prop({ type: [{ type: Object }], default: [] })
  singlesMatches: SinglesMatch[];
  
  @Prop({ type: [{ type: Object }], default: [] })
  doublesMatches: DoublesMatch[];

  @Prop({ default: false })
  isPublished: boolean;
  
  @Prop({ default: 'auto' })
  generationType: string;
  
  @Prop()
  date: Date;
}

export const LineupSchema = SchemaFactory.createForClass(Lineup);