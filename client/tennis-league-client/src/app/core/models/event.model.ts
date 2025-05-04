import { User } from './user.model';

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
}