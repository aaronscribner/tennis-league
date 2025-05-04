import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../models/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }
    
    // First check if user has roles from Auth0 token
    if (user.roles && Array.isArray(user.roles)) {
      const auth0Roles = user.roles.map(role => role.toLowerCase());
      
      // Check if any required role is in the Auth0 roles
      const hasRoleFromAuth0 = requiredRoles.some(role => 
        auth0Roles.includes(role.toLowerCase())
      );
      
      if (hasRoleFromAuth0) {
        return true;
      }
    }
    
    // If no match in Auth0 roles, check the database
    const dbUser = await this.userModel.findOne({ auth0Id: user.userId }).exec();
    
    if (!dbUser) {
      return false;
    }
    
    // Check primary role
    if (requiredRoles.includes(dbUser.role)) {
      return true;
    }
    
    // Check roles array in database
    if (dbUser.roles && Array.isArray(dbUser.roles) && dbUser.roles.length > 0) {
      const userRoles = dbUser.roles.map(role => role.toLowerCase());
      return requiredRoles.some(role => userRoles.includes(role.toLowerCase()));
    }
    
    return false;
  }
}