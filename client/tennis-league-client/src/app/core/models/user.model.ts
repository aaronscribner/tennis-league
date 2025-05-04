export enum UserRole {
  PLAYER = 'player',
  COORDINATOR = 'coordinator',
}

export interface User {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string; // Added phone number field
  auth0Id: string;
  role: UserRole;
  roles?: string[]; // Adding roles array for backwards compatibility
  isActive: boolean;
  skillLevel: number;
  preferSingles: boolean;
  preferDoubles: boolean; // Added preference for doubles
  photoUrl?: string; // Optional profile photo URL
  createdAt?: Date;
  updatedAt?: Date;
}