import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { LineupsService } from './lineups.service';
import { MigrationService } from './migration.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../models/user.schema';
import { Match, SinglesMatch, DoublesMatch, Set, SinglesSet } from '../models/match.schema';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('lineups')
@Controller('lineups')
export class LineupsController {
  constructor(
    private readonly lineupsService: LineupsService,
    private readonly migrationService: MigrationService
  ) {}

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

  @ApiOperation({ summary: 'Get all matches for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Return all matches for the event' })
  @Get('event/:eventId/matches')
  async getEventMatches(@Param('eventId') eventId: string) {
    return this.lineupsService.getEventMatches(eventId);
  }

  @ApiOperation({ summary: 'Get singles matches for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Return singles matches for the event' })
  @Get('event/:eventId/singles')
  async getEventSinglesMatches(@Param('eventId') eventId: string) {
    return this.lineupsService.getEventSinglesMatches(eventId);
  }

  @ApiOperation({ summary: 'Get doubles matches for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Return doubles matches for the event' })
  @Get('event/:eventId/doubles')
  async getEventDoublesMatches(@Param('eventId') eventId: string) {
    return this.lineupsService.getEventDoublesMatches(eventId);
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

  @ApiOperation({ summary: 'Update a lineup' })
  @ApiParam({ name: 'lineupId', description: 'Lineup ID' })
  @ApiBody({
    description: 'Match updates',
    schema: {
      type: 'array',
      items: {
        type: 'object'
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Lineup successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lineup not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Put(':lineupId')
  async updateLineup(
    @Param('lineupId') lineupId: string,
    @Body() matchUpdates: any[]
  ) {
    return this.lineupsService.updateLineup(lineupId, matchUpdates);
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

  @ApiOperation({ summary: 'Get singles match details' })
  @ApiParam({ name: 'matchId', description: 'Singles match ID' })
  @ApiResponse({ status: 200, description: 'Return the singles match details' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @Get('match/singles/:matchId')
  async getSinglesMatch(@Param('matchId') matchId: string): Promise<SinglesMatch> {
    return await this.lineupsService.getSinglesMatch(matchId);
  }

  @ApiOperation({ summary: 'Get doubles match details' })
  @ApiParam({ name: 'matchId', description: 'Doubles match ID' })
  @ApiResponse({ status: 200, description: 'Return the doubles match details' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @Get('match/doubles/:matchId')
  async getDoublesMatch(@Param('matchId') matchId: string): Promise<DoublesMatch> {
    return await this.lineupsService.getDoublesMatch(matchId);
  }

  @ApiOperation({ summary: 'Update match score (legacy)' })
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
  @Put('match/:matchId/score')
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

  @ApiOperation({ summary: 'Update singles match score' })
  @ApiParam({ name: 'matchId', description: 'Singles match ID' })
  @ApiBody({
    description: 'Singles match score data',
    schema: {
      type: 'object',
      properties: {
        sets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              playerAGames: { type: 'number', example: 6 },
              playerBGames: { type: 'number', example: 4 },
              isTiebreak: { type: 'boolean', example: false },
              tiebreakScore: { type: 'string', example: '7-5' },
              isCompleted: { type: 'boolean', example: true },
              games: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    playerAScore: { type: 'number', example: 4 },
                    playerBScore: { type: 'number', example: 2 },
                    isCompleted: { type: 'boolean', example: true }
                  }
                }
              }
            }
          }
        }
      },
      required: ['sets']
    }
  })
  @ApiResponse({ status: 200, description: 'Singles match score successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('match/singles/:matchId/score')
  async updateSinglesMatchScore(
    @Param('matchId') matchId: string,
    @Body('sets') sets: SinglesSet[],
  ): Promise<SinglesMatch> {
    return this.lineupsService.updateSinglesMatchScore(matchId, sets);
  }

  @ApiOperation({ summary: 'Update doubles match score for a specific combination' })
  @ApiParam({ name: 'matchId', description: 'Doubles match ID' })
  @ApiParam({ name: 'combinationId', description: 'Combination ID' })
  @ApiBody({
    description: 'Doubles match score data',
    schema: {
      type: 'object',
      properties: {
        sets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              teamAGames: { type: 'number', example: 6 },
              teamBGames: { type: 'number', example: 4 },
              isTiebreak: { type: 'boolean', example: false },
              tiebreakScore: { type: 'string', example: '7-5' },
              isCompleted: { type: 'boolean', example: true }
            }
          }
        },
        combinationName: { type: 'string', example: 'First Round' },
        isCompleted: { type: 'boolean', example: true }
      },
      required: ['sets']
    }
  })
  @ApiResponse({ status: 200, description: 'Doubles match score successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match or combination not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('match/doubles/:matchId/combination/:combinationId/score')
  async updateDoublesMatchScore(
    @Param('matchId') matchId: string,
    @Param('combinationId') combinationId: string,
    @Body('sets') sets: Set[],
    @Body('combinationName') combinationName?: string,
    @Body('isCompleted') isCompleted?: boolean
  ): Promise<DoublesMatch> {
    return this.lineupsService.updateDoublesMatchScore(
      matchId, 
      combinationId, 
      sets,
      combinationName,
      isCompleted
    );
  }

  @ApiOperation({ summary: 'Migrate all lineups to enhanced data structures' })
  @ApiResponse({ status: 200, description: 'All lineups migrated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only coordinators can perform this action' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Post('migrate/all')
  async migrateAllLineups(): Promise<{ success: boolean, message: string }> {
    await this.migrationService.migrateAllLineups();
    return { 
      success: true,
      message: 'Migration completed for all lineups'
    };
  }

  @ApiOperation({ summary: 'Migrate a specific lineup to enhanced data structures' })
  @ApiParam({ name: 'lineupId', description: 'Lineup ID to migrate' })
  @ApiResponse({ status: 200, description: 'Lineup migrated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only coordinators can perform this action' })
  @ApiResponse({ status: 404, description: 'Lineup not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Post('migrate/:lineupId')
  async migrateLineupById(@Param('lineupId') lineupId: string): Promise<{ success: boolean, message: string }> {
    await this.migrationService.migrateLineupById(lineupId);
    return { 
      success: true,
      message: `Migration completed for lineup ${lineupId}`
    };
  }
}