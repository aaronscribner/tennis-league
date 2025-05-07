import { User } from './user.model';

export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export interface Event {
  _id?: string;
  title: string;
  date: Date;
  description?: string;
  location: string;
  maxSinglesPlayers: number;
  maxDoublesPlayers: number;
  attendees?: User[] | string[];
  isCancelled: boolean;
  isSinglesAllowed: boolean;
  isDoublesAllowed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  seriesId?: string;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: Date;
}