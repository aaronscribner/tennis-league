import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InvitationCode } from '../models/invitation-code.schema';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationCodesService {
  constructor(
    @InjectModel(InvitationCode.name) private invitationCodeModel: Model<InvitationCode>
  ) {}

  /**
   * Get all invitation codes
   */
  async findAll(): Promise<InvitationCode[]> {
    return this.invitationCodeModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Get a specific invitation code by ID
   */
  async findById(id: string): Promise<InvitationCode> {
    const code = await this.invitationCodeModel.findById(id).exec();
    if (!code) {
      throw new NotFoundException(`Invitation code with ID ${id} not found`);
    }
    return code;
  }

  /**
   * Create a new invitation code
   */
  async create(codeData: Partial<InvitationCode>): Promise<InvitationCode> {
    // Generate a random code if one wasn't provided
    if (!codeData.code) {
      codeData.code = this.generateInvitationCode();
    }
    
    // Default values
    codeData.isUsed = false;
    
    const newCode = new this.invitationCodeModel(codeData);
    return newCode.save();
  }

  /**
   * Update an invitation code
   */
  async update(id: string, updateData: Partial<InvitationCode>): Promise<InvitationCode> {
    // Prevent changing the code if it's already used
    const existingCode = await this.findById(id);
    if (existingCode.isUsed && (updateData.isUsed === false || updateData.code)) {
      throw new BadRequestException('Cannot modify code or usage status of a used invitation code');
    }

    const updatedCode = await this.invitationCodeModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).exec();

    if (!updatedCode) {
      throw new NotFoundException(`Invitation code with ID ${id} not found`);
    }

    return updatedCode;
  }

  /**
   * Delete an invitation code
   */
  async remove(id: string): Promise<InvitationCode> {
    const deletedCode = await this.invitationCodeModel.findByIdAndDelete(id).exec();
    if (!deletedCode) {
      throw new NotFoundException(`Invitation code with ID ${id} not found`);
    }
    return deletedCode;
  }

  /**
   * Validate an invitation code
   */
  async validateCode(code: string, email?: string): Promise<boolean> {
    // Find the code
    const invitationCode = await this.invitationCodeModel.findOne({ code }).exec();
    
    if (!invitationCode) {
      return false;
    }
    
    // Check if it's already used
    if (invitationCode.isUsed) {
      return false;
    }
    
    // Check if it's expired
    if (invitationCode.expiresAt && new Date(invitationCode.expiresAt) < new Date()) {
      return false;
    }
    
    // If code has an email restriction, check if it matches
    if (invitationCode.email && email && invitationCode.email !== email) {
      return false;
    }
    
    return true;
  }

  /**
   * Mark an invitation code as used
   */
  async markCodeAsUsed(code: string, userId: string, email: string): Promise<InvitationCode> {
    // Find the code
    const invitationCode = await this.invitationCodeModel.findOne({ code }).exec();
    
    if (!invitationCode) {
      throw new NotFoundException(`Invitation code ${code} not found`);
    }
    
    // Check if it's already used
    if (invitationCode.isUsed) {
      throw new BadRequestException(`Invitation code ${code} has already been used`);
    }
    
    // Check if it's expired
    if (invitationCode.expiresAt && new Date(invitationCode.expiresAt) < new Date()) {
      throw new BadRequestException(`Invitation code ${code} has expired`);
    }
    
    // If code has an email restriction, check if it matches
    if (invitationCode.email && invitationCode.email !== email) {
      throw new BadRequestException(
        `This invitation code is restricted to ${invitationCode.email} and cannot be used with ${email}`
      );
    }
    
    // Update the code
    invitationCode.isUsed = true;
    invitationCode.usedAt = new Date();
    invitationCode.usedByUserId = userId;
    invitationCode.usedByEmail = email;
    
    return invitationCode.save();
  }

  /**
   * Generate a random invitation code
   */
  private generateInvitationCode(length: number = 8): string {
    // Generate a random code using randomBytes
    const bytes = randomBytes(Math.ceil(length / 2));
    // Convert to a string of hexadecimal characters
    const randomHex = bytes.toString('hex').slice(0, length);
    // Convert to uppercase for better readability
    return randomHex.toUpperCase();
  }
}