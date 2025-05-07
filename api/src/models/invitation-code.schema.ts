import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type InvitationCodeDocument = InvitationCode & Document;

@Schema({ timestamps: true })
export class InvitationCode {
  @ApiProperty({ 
    description: 'Unique invitation code',
    example: 'TENNIS2025', 
  })
  @Prop({ required: true, unique: true })
  code: string;

  @ApiProperty({ 
    description: 'Optional email this code is restricted to',
    example: 'player@example.com', 
  })
  @Prop()
  email?: string;

  @ApiProperty({ 
    description: 'When the code expires',
    type: Date,
    example: '2025-06-06T00:00:00Z', 
  })
  @Prop()
  expiresAt?: Date;

  @ApiProperty({ 
    description: 'Whether the code has been used',
    default: false,
    example: false, 
  })
  @Prop({ default: false })
  isUsed: boolean;

  @ApiProperty({ 
    description: 'When the code was used',
    type: Date,
    example: '2025-05-15T14:00:00Z', 
  })
  @Prop()
  usedAt?: Date;

  @ApiProperty({ 
    description: 'Auth0 ID of the user who used the code',
    example: 'auth0|123456789', 
  })
  @Prop()
  usedByUserId?: string;

  @ApiProperty({
    description: 'Email of the user who used the code',
    example: 'player@example.com',
  })
  @Prop()
  usedByEmail?: string;

  @ApiProperty({
    description: 'Notes about this invitation code',
    example: 'For spring 2025 tournament players',
  })
  @Prop()
  notes?: string;
}

export const InvitationCodeSchema = SchemaFactory.createForClass(InvitationCode);