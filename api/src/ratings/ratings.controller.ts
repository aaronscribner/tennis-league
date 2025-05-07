import { Controller, Get, Post, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../models/user.schema';
import { RatingsService } from './ratings.service';

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  private readonly logger = new Logger(RatingsController.name);

  constructor(private readonly ratingsService: RatingsService) {}
}