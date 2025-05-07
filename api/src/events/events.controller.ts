import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../models/user.schema';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { UpdateEventSeriesDto } from './dto/update-event-series.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: 200, description: 'Return all events' })
  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiResponse({ status: 200, description: 'Return all upcoming events' })
  @Get('upcoming')
  findUpcoming() {
    return this.eventsService.findUpcoming();
  }

  @ApiOperation({ summary: 'Get a specific event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Return the event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }

  @ApiOperation({ summary: 'Create a new event' })
  @ApiBody({ description: 'Event data' })
  @ApiResponse({ status: 201, description: 'Event successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiBearerAuth('access-token')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Post()
  create(@Body() createEventDto: any) {
    return this.eventsService.create(createEventDto);
  }

  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiBody({ description: 'Updated event data' })
  @ApiResponse({ status: 200, description: 'Event successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: any) {
    return this.eventsService.update(id, updateEventDto);
  }

  @ApiOperation({ summary: 'Cancel an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event successfully cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.eventsService.cancel(id);
  }

  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  // Event series endpoints
  @ApiOperation({ summary: 'Get all events in a series' })
  @ApiParam({ name: 'seriesId', description: 'Event Series ID' })
  @ApiResponse({ status: 200, description: 'Return all events in the series' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  @Get('series/:seriesId')
  findEventsBySeries(@Param('seriesId') seriesId: string) {
    return this.eventsService.findEventsBySeries(seriesId);
  }

  @ApiOperation({ summary: 'Cancel all events in a series' })
  @ApiParam({ name: 'seriesId', description: 'Event Series ID' })
  @ApiResponse({ status: 200, description: 'Series successfully cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Patch('series/:seriesId/cancel')
  cancelEventSeries(@Param('seriesId') seriesId: string) {
    return this.eventsService.cancelEventSeries(seriesId);
  }

  @ApiOperation({ summary: 'Update all events in a series' })
  @ApiParam({ name: 'seriesId', description: 'Event Series ID' })
  @ApiBody({ description: 'Updated series data', type: UpdateEventSeriesDto })
  @ApiResponse({ status: 200, description: 'Series successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Patch('series/:seriesId/update')
  updateEventSeries(
    @Param('seriesId') seriesId: string,
    @Body() updateEventDto: UpdateEventSeriesDto
  ) {
    return this.eventsService.updateEventSeries(seriesId, updateEventDto);
  }

  // RSVP endpoints
  @ApiOperation({ summary: 'Get all RSVPs for an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Return all RSVPs for the event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @Get(':id/rsvps')
  getRsvps(@Param('id') id: string) {
    return this.eventsService.getRsvpsByEvent(id);
  }

  @ApiOperation({ summary: 'Get current user\'s RSVP for an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Return the user\'s RSVP for the event' })
  @ApiResponse({ status: 404, description: 'RSVP not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get(':id/rsvp')
  async getUserRsvp(@Param('id') eventId: string, @Request() req) {
    const userId = req.user.userId;
    const rsvp = await this.eventsService.getUserRsvp(eventId, userId);
    
    if (!rsvp) {
      throw new HttpException('RSVP not found', HttpStatus.NOT_FOUND);
    }
    
    return rsvp;
  }

  @ApiOperation({ summary: 'Create or update RSVP for an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiBody({ description: 'RSVP data' })
  @ApiResponse({ status: 201, description: 'RSVP successfully created or updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post(':id/rsvp')
  createRsvp(
    @Param('id') eventId: string,
    @Request() req,
    @Body() rsvpData: { 
      isAttending: boolean; 
      preferSingles: boolean; 
      playingSinglesOnly?: boolean;
      playingDoublesOnly?: boolean;
    }
  ) {
    const userId = req.user.userId;
    return this.eventsService.createRsvp({
      user: userId,
      event: eventId,
      ...rsvpData,
    });
  }

  @ApiOperation({ summary: 'Update RSVP' })
  @ApiParam({ name: 'rsvpId', description: 'RSVP ID' })
  @ApiBody({ description: 'Updated RSVP data' })
  @ApiResponse({ status: 200, description: 'RSVP successfully updated' })
  @ApiResponse({ status: 404, description: 'RSVP not found' })
  @UseGuards(JwtAuthGuard)
  @Patch('rsvps/:rsvpId')
  updateRsvp(
    @Request() request,
    @Param('rsvpId') rsvpId: string,
    @Body() updateData: { 
      isAttending?: boolean; 
      preferSingles?: boolean;
      playingSinglesOnly?: boolean;
      playingDoublesOnly?: boolean;
    }
  ) {
    const rsvp = this.eventsService.updateRsvp(rsvpId, updateData);
    if (!rsvp) {
      throw new HttpException('RSVP not found', HttpStatus.NOT_FOUND);
    }
    return rsvp;
  }

  @ApiOperation({ summary: 'Delete RSVP' })
  @ApiParam({ name: 'rsvpId', description: 'RSVP ID' })
  @ApiResponse({ status: 200, description: 'RSVP successfully deleted' })
  @ApiResponse({ status: 404, description: 'RSVP not found' })
  @UseGuards(JwtAuthGuard)
  @Delete('rsvps/:rsvpId')
  deleteRsvp(@Param('rsvpId') rsvpId: string) {
    try {
      return this.eventsService.deleteRsvp(rsvpId);
    } catch (error) {
      throw new HttpException('RSVP not found', HttpStatus.NOT_FOUND);
    }
  }
}