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

  @ApiProperty({ description: 'User nickname', example: 'JD', required: false })
  @Prop({ required: false })
  nickname: string;

  @ApiProperty({ description: 'Whether to display only nickname to other users', example: false, default: false })
  @Prop({ default: false })
  displayOnlyNickname: boolean;

  @ApiProperty({ description: 'User email address', example: 'john.doe@example.com' })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({ description: 'User phone number', example: '+1 (123) 456-7890', required: false })
  @Prop({ required: false })
  phoneNumber: string;

  @ApiProperty({ description: 'User city', example: 'Seattle', required: false })
  @Prop({ required: false })
  city: string;

  @ApiProperty({ description: 'Auth0 user ID', example: 'auth0|1234567890' })
  @Prop({ required: true })
  auth0Id: string;

  @ApiProperty({ 
    description: 'Primary user role', 
    enum: UserRole, 
    default: UserRole.PLAYER,
    example: UserRole.PLAYER 
  })
  @Prop({ enum: UserRole, default: UserRole.PLAYER })
  role: UserRole;

  @ApiProperty({ 
    description: 'User roles array from Auth0',
    type: [String], 
    example: ['player', 'coordinator'] 
  })
  @Prop({ type: [String], default: [] })
  roles: string[];

  @ApiProperty({ description: 'Whether the user is active', default: true, example: true })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ 
    description: 'User tennis skill level (1.00-5.00)', 
    default: 1.00, 
    minimum: 1.00, 
    maximum: 5.00,
    example: 3.75 
  })
  @Prop({ default: 1.00, type: Number })
  skillLevel: number;

  @ApiProperty({ 
    description: 'Whether the user prefers playing singles matches', 
    default: false,
    example: false 
  })
  @Prop({ default: false })
  preferSingles: boolean;

  @ApiProperty({ 
    description: 'Whether the user prefers playing doubles matches', 
    default: false,
    example: false 
  })
  @Prop({ default: false })
  preferDoubles: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);