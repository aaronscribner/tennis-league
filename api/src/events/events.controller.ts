import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from '../models/event.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../models/user.schema';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll() {
    return this.eventsService.findAll();
  }

  @Get('upcoming')
  async findUpcoming() {
    return this.eventsService.findUpcoming();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const event = await this.eventsService.findById(id);
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }
    return event;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createEventDto: Partial<Event>) {
    return this.eventsService.create(createEventDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateEventDto: Partial<Event>) {
    const event = await this.eventsService.findById(id);
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }
    return this.eventsService.update(id, updateEventDto);
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async cancelEvent(@Param('id') id: string) {
    const event = await this.eventsService.findById(id);
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }
    return this.eventsService.cancel(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    const event = await this.eventsService.findById(id);
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }
    return this.eventsService.remove(id);
  }

  @Get(':id/rsvps')
  @UseGuards(JwtAuthGuard)
  async getRsvps(@Param('id') id: string) {
    const event = await this.eventsService.findById(id);
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }
    return this.eventsService.getRsvpsByEvent(id);
  }

  @Get(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  async getUserRsvp(@Req() request, @Param('id') id: string) {
    const event = await this.eventsService.findById(id);
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }
    
    return this.eventsService.getUserRsvp(id, request.user.userId);
  }

  @Post(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  async createRsvp(
    @Req() request,
    @Param('id') id: string,
    @Body() rsvpData: { isAttending: boolean; preferSingles: boolean; notes?: string }
  ) {
    const event = await this.eventsService.findById(id);
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }
    
    return this.eventsService.createRsvp({
      user: request.user.userId,
      event: id,
      ...rsvpData,
    });
  }

  @Put('rsvps/:rsvpId')
  @UseGuards(JwtAuthGuard)
  async updateRsvp(
    @Req() request,
    @Param('rsvpId') rsvpId: string,
    @Body() updateData: { isAttending?: boolean; preferSingles?: boolean; notes?: string }
  ) {
    const rsvp = await this.eventsService.updateRsvp(rsvpId, updateData);
    if (!rsvp) {
      throw new HttpException('RSVP not found', HttpStatus.NOT_FOUND);
    }
    
    return rsvp;
  }

  @Delete('rsvps/:rsvpId')
  @UseGuards(JwtAuthGuard)
  async deleteRsvp(@Param('rsvpId') rsvpId: string) {
    try {
      return await this.eventsService.deleteRsvp(rsvpId);
    } catch (error) {
      throw new HttpException('RSVP not found', HttpStatus.NOT_FOUND);
    }
  }
}