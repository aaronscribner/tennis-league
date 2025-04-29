export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface User {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  auth0Id: string;
  role: UserRole;
  roles?: string[]; // Adding roles array for backwards compatibility
  isActive: boolean;
  skillLevel: number;
  preferSingles: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}