import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LineupsService } from './lineups.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../models/user.schema';
import { Match } from '../models/match.model';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('lineups')
@Controller('lineups')
export class LineupsController {
  constructor(private readonly lineupsService: LineupsService) {}

  @ApiOperation({ summary: 'Get lineup by event ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Return the lineup for the event' })
  @Get('event/:eventId')
  async getLineupByEvent(@Param('eventId') eventId: string) {
    try {
      const lineup = await this.lineupsService.getLineupByEvent(eventId);
      return lineup;
    } catch (error) {
      // If no lineup exists, create one
      return this.lineupsService.createLineup(eventId);
    }
  }

  @ApiOperation({ summary: 'Create a new lineup for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 201, description: 'Lineup successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Post('event/:eventId')
  async createLineup(@Param('eventId') eventId: string) {
    return this.lineupsService.createLineup(eventId);
  }

  @ApiOperation({ summary: 'Generate a lineup for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 201, description: 'Lineup successfully generated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Post('event/:eventId/generate')
  async generateLineup(@Param('eventId') eventId: string) {
    return this.lineupsService.generateLineup(eventId);
  }

  @ApiOperation({ summary: 'Republish a lineup' })
  @ApiParam({ name: 'lineupId', description: 'Lineup ID' })
  @ApiResponse({ status: 200, description: 'Lineup successfully republished' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lineup not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Post(':lineupId/republish')
  async republishLineup(@Param('lineupId') lineupId: string) {
    return this.lineupsService.republishLineup(lineupId);
  }

  @ApiOperation({ summary: 'Get match details' })
  @ApiParam({ name: 'matchId', description: 'Match ID' })
  @ApiResponse({ status: 200, description: 'Return the match details' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @Get('match/:matchId')
  async getMatch(@Param('matchId') matchId: string): Promise<Match> {
    return await this.lineupsService.getMatch(matchId);
  }

  @ApiOperation({ summary: 'Update match score' })
  @ApiParam({ name: 'matchId', description: 'Match ID' })
  @ApiBody({
    description: 'Match score data',
    schema: {
      type: 'object',
      properties: {
        teamAScore: { type: 'number', example: 6 },
        teamBScore: { type: 'number', example: 4 },
        notes: { type: 'string', example: 'Great match!' }
      },
      required: ['teamAScore', 'teamBScore']
    }
  })
  @ApiResponse({ status: 200, description: 'Match score successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('match/:matchId/score')
  async updateMatchScore(
    @Param('matchId') matchId: string,
    @Body('teamAScore') teamAScore: number,
    @Body('teamBScore') teamBScore: number,
    @Body('notes') notes?: string,
  ): Promise<Match> {
    return this.lineupsService.updateMatchScore(
      matchId,
      teamAScore,
      teamBScore,
      notes,
    );
  }
}