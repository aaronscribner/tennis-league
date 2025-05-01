import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  PLAYER = 'player',
  COORDINATOR = 'coordinator',
}

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ description: 'User first name', example: 'John' })
  @Prop({ required: true })
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @Prop({ required: false })
  lastName: string;

  @ApiProperty({ description: 'User email address', example: 'john.doe@example.com' })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({ description: 'Auth0 user ID', example: 'auth0|1234567890' })
  @Prop({ required: true })
  auth0Id: string;

  @ApiProperty({ 
    description: 'User role', 
    enum: UserRole, 
    default: UserRole.PLAYER,
    example: UserRole.PLAYER 
  })
  @Prop({ enum: UserRole, default: UserRole.PLAYER })
  role: UserRole;

  @ApiProperty({ description: 'Whether the user is active', default: true, example: true })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ 
    description: 'User tennis skill level (0-10)', 
    default: 0, 
    minimum: 0, 
    maximum: 10,
    example: 5 
  })
  @Prop({ default: 0 })
  skillLevel: number;

  @ApiProperty({ 
    description: 'Whether the user prefers playing singles matches', 
    default: false,
    example: false 
  })
  @Prop({ default: false })
  preferSingles: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);