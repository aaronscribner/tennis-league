import { User } from './user.model';

export enum EventType {
  SINGLES = 'singles',
  DOUBLES = 'doubles',
  MIXED = 'mixed',
}

export interface Event {
  _id?: string;
  title: string;
  date: Date;
  description?: string;
  location: string;
  maxPlayers: number;
  attendees?: User[] | string[];
  eventType: EventType;
  isCancelled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}