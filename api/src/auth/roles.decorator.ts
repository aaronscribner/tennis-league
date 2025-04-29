import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../models/user.schema';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);