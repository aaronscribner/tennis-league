import { UserRole } from './user.schema';

export interface User {
  id?: string;
  _id?: any;
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  auth0Id: string;
  role: UserRole;
  roles?: string[];
  isActive?: boolean;
  skillLevel?: number;
  preferSingles?: boolean;
  preferDoubles?: boolean;
}