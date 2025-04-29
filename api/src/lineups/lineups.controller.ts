import { Controller, Get, Post, Body, Param, Put, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { LineupsService } from './lineups.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../models/user.schema';

@Controller('lineups')
export class LineupsController {
  constructor(private readonly lineupsService: LineupsService) {}

  @Get('event/:eventId')
  async getEventLineup(@Param('eventId') eventId: string) {
    try {
      const lineup = await this.lineupsService.findByEvent(eventId);
      if (!lineup) {
        return { message: 'No lineup found for this event', lineup: null };
      }
      return lineup;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('event/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createLineup(@Param('eventId') eventId: string) {
    try {
      return await this.lineupsService.createLineup(eventId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':lineupId')
  @UseGuards(JwtAuthGuard)
  async updateLineup(
    @Param('lineupId') lineupId: string,
    @Body() updates: any[]
  ) {
    try {
      return await this.lineupsService.updateLineup(lineupId, updates);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':lineupId/republish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async republishLineup(@Param('lineupId') lineupId: string) {
    try {
      return await this.lineupsService.republishLineup(lineupId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('match/:matchId')
  async getMatch(@Param('matchId') matchId: string) {
    try {
      return await this.lineupsService.getMatchById(matchId);
    } catch (error) {
      throw new HttpException('Match not found', HttpStatus.NOT_FOUND);
    }
  }

  @Put('match/:matchId/score')
  @UseGuards(JwtAuthGuard)
  async updateMatchScore(
    @Param('matchId') matchId: string,
    @Body() scoreData: { teamAScore: number; teamBScore: number }
  ) {
    try {
      return await this.lineupsService.updateMatchScore(
        matchId, 
        scoreData.teamAScore, 
        scoreData.teamBScore
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}