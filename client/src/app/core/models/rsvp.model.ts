import { User } from './user.model';
import { Event } from './event.model';

export interface Rsvp {
  _id?: string;
  user: User | string;
  event: Event | string;
  preferSingles: boolean;
  isAttending: boolean;
  playingSinglesOnly?: boolean;
  playingDoublesOnly?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}