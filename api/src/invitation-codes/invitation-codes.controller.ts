import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query } from '@nestjs/common';
import { InvitationCodesService } from './invitation-codes.service';
import { InvitationCode } from '../models/invitation-code.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../models/user.schema';

@Controller('invitation-codes')
export class InvitationCodesController {
  constructor(private readonly invitationCodesService: InvitationCodesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  async findAll(): Promise<InvitationCode[]> {
    return this.invitationCodesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  async findOne(@Param('id') id: string): Promise<InvitationCode> {
    return this.invitationCodesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  async create(@Body() createCodeData: Partial<InvitationCode>): Promise<InvitationCode> {
    return this.invitationCodesService.create(createCodeData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  async update(
    @Param('id') id: string,
    @Body() updateCodeData: Partial<InvitationCode>
  ): Promise<InvitationCode> {
    return this.invitationCodesService.update(id, updateCodeData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  async remove(@Param('id') id: string): Promise<InvitationCode> {
    return this.invitationCodesService.remove(id);
  }

  @Get('validate/:code')
  async validateCode(
    @Param('code') code: string,
    @Query('email') email?: string
  ): Promise<{ valid: boolean }> {
    const isValid = await this.invitationCodesService.validateCode(code, email);
    return { valid: isValid };
  }

  @Post('mark-used')
  @UseGuards(JwtAuthGuard)
  async markCodeAsUsed(
    @Body() data: { code: string; userId: string; email: string }
  ): Promise<InvitationCode> {
    return this.invitationCodesService.markCodeAsUsed(
      data.code,
      data.userId,
      data.email
    );
  }
}