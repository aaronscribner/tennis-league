import { User } from './user.model';
import { Event } from './event.model';

export interface Team {
  players: User[] | string[];
  score: number;
}

export interface Match {
  _id?: string;
  id?: string;
  event: Event | string;
  matchNumber: number;
  teamA: Team;
  teamB: Team;
  isCompleted: boolean;
  notes?: string;
  scheduledTime: Date;
  
  // Additional properties used in templates
  startTime?: Date;
  court?: string;
  eventId?: string;
}

export interface Lineup {
  _id?: string;
  event: Event | string;
  matches: Match[];
  isPublished: boolean;
  generationType: string;
  createdAt?: Date;
  updatedAt?: Date;
}