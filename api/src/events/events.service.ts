import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Event, EventDocument, RecurrenceType } from '../models/event.schema';
import { Rsvp, RsvpDocument } from '../models/rsvp.schema';
import { User, UserDocument } from '../models/user.schema';
import { UpdateEventSeriesDto } from './dto/update-event-series.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Rsvp.name) private rsvpModel: Model<RsvpDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(): Promise<Event[]> {
    return this.eventModel.find().exec();
  }

  async findUpcoming(): Promise<Event[]> {
    const today = new Date();
    return this.eventModel.find({ 
      date: { $gte: today }, 
      isCancelled: false 
    }).sort({ date: 1 }).exec();
  }

  async findById(id: string): Promise<Event> {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async create(createEventDto: Partial<Event>): Promise<Event | Event[]> {
    // Set singles/doubles allowed based on max player counts
    if (createEventDto.maxSinglesPlayers !== undefined) {
      createEventDto.isSinglesAllowed = createEventDto.maxSinglesPlayers >= 2;
    }
    if (createEventDto.maxDoublesPlayers !== undefined) {
      createEventDto.isDoublesAllowed = createEventDto.maxDoublesPlayers >= 4;
    }
    
    // Handle recurring events
    if (createEventDto.recurrenceType && createEventDto.recurrenceType !== RecurrenceType.NONE) {
      // Validate recurrence end date is within 1 year
      if (!createEventDto.recurrenceEndDate) {
        throw new Error('Recurrence end date is required for recurring events');
      }
      
      const today = new Date();
      const oneYearFromToday = new Date();
      oneYearFromToday.setFullYear(today.getFullYear() + 1);
      
      const endDate = new Date(createEventDto.recurrenceEndDate);
      if (endDate > oneYearFromToday) {
        throw new Error('Recurrence end date cannot be more than 1 year from today');
      }
      
      // Generate series ID
      const seriesId = uuidv4();
      const events: Event[] = [];
      
      // Create recurring events based on pattern
      if (!createEventDto.date) {
        throw new Error('Event date is required');
      }
      const startDate = new Date(createEventDto.date);
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const eventData = { 
          ...createEventDto, 
          date: new Date(currentDate),
          seriesId 
        };
        
        const newEvent = new this.eventModel(eventData);
        const savedEvent = await newEvent.save();
        events.push(savedEvent);
        
        // Calculate next occurrence
        currentDate = this.getNextOccurrence(currentDate, createEventDto.recurrenceType);
      }
      
      return events;
    } else {
      // Non-recurring event
      const newEvent = new this.eventModel(createEventDto);
      return newEvent.save();
    }
  }

  private getNextOccurrence(currentDate: Date, recurrenceType: RecurrenceType): Date {
    const nextDate = new Date(currentDate);
    
    switch (recurrenceType) {
      case RecurrenceType.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case RecurrenceType.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case RecurrenceType.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        // Should never happen
        throw new Error('Invalid recurrence type');
    }
    
    return nextDate;
  }

  async findEventsBySeries(seriesId: string): Promise<Event[]> {
    return this.eventModel.find({ seriesId, isCancelled: false }).sort({ date: 1 }).exec();
  }

  async updateEventSeries(seriesId: string, updateData: UpdateEventSeriesDto): Promise<Event[]> {
    const events = await this.eventModel.find({ 
      seriesId, 
      date: { $gte: new Date() }, // Only update current and future events
      isCancelled: false 
    }).exec();
    
    if (!events || events.length === 0) {
      throw new NotFoundException(`Event series with ID ${seriesId} not found or no upcoming events`);
    }
    
    const updatePromises = events.map(event => {
      const eventUpdate: any = { 
        title: updateData.title,
        maxSinglesPlayers: updateData.maxSinglesPlayers,
        maxDoublesPlayers: updateData.maxDoublesPlayers
      };
      
      // Handle time updates if provided
      if (updateData.startTime || updateData.endTime) {
        const eventDate = new Date(event.date);
        
        // Update start time if provided
        if (updateData.startTime) {
          const [hours, minutes] = updateData.startTime.split(':').map(Number);
          // Preserve the original date but update hours and minutes
          eventDate.setHours(hours, minutes);
          eventUpdate.date = eventDate;
        }
      }
      
      // Set singles/doubles allowed based on max player counts
      if (eventUpdate.maxSinglesPlayers !== undefined) {
        eventUpdate.isSinglesAllowed = eventUpdate.maxSinglesPlayers >= 2;
      }
      if (eventUpdate.maxDoublesPlayers !== undefined) {
        eventUpdate.isDoublesAllowed = eventUpdate.maxDoublesPlayers >= 4;
      }
      
      // Remove any undefined fields
      Object.keys(eventUpdate).forEach(key => 
        eventUpdate[key] === undefined && delete eventUpdate[key]
      );
      
      return this.eventModel.findByIdAndUpdate(event._id, eventUpdate, { new: true }).exec();
    });
    
    return Promise.all(updatePromises) as Promise<Event[]>;
  }

  async cancelEventSeries(seriesId: string): Promise<Event[]> {
    const events = await this.eventModel.find({ seriesId }).exec();
    
    if (!events || events.length === 0) {
      throw new NotFoundException(`Event series with ID ${seriesId} not found`);
    }
    
    // Cancel all events in the series
    const cancellationPromises = events.map(event => 
      this.eventModel.findByIdAndUpdate(event._id, { isCancelled: true }, { new: true }).exec()
      .then(updatedEvent => {
        if (!updatedEvent) {
          throw new NotFoundException(`Event with ID ${event._id} not found during series cancellation`);
        }
        return updatedEvent;
      })
    );
    
    return Promise.all(cancellationPromises) as Promise<Event[]>;
  }

  async update(id: string, updateEventDto: Partial<Event>): Promise<Event> {
    // Set singles/doubles allowed based on max player counts
    if (updateEventDto.maxSinglesPlayers !== undefined) {
      updateEventDto.isSinglesAllowed = updateEventDto.maxSinglesPlayers >= 2;
    }
    if (updateEventDto.maxDoublesPlayers !== undefined) {
      updateEventDto.isDoublesAllowed = updateEventDto.maxDoublesPlayers >= 4;
    }
    
    const event = await this.eventModel.findByIdAndUpdate(id, updateEventDto, { new: true }).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async cancel(id: string): Promise<Event> {
    const event = await this.eventModel.findByIdAndUpdate(id, { isCancelled: true }, { new: true }).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async remove(id: string): Promise<Event> {
    const event = await this.eventModel.findByIdAndDelete(id).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async addAttendee(eventId: string, userId: string): Promise<Event> {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    
    if (!event.attendees) {
      event.attendees = [];
    }
    
    if (!event.attendees.some(attendee => attendee.toString() === userId)) {
      event.attendees.push(userId as any); // Type cast to satisfy TypeScript
      await event.save();
    }
    
    return event;
  }

  async removeAttendee(eventId: string, userId: string): Promise<Event> {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    
    if (event.attendees) {
      event.attendees = event.attendees.filter(
        attendee => attendee.toString() !== userId
      );
      await event.save();
    }
    
    return event;
  }

  async getRsvpsByEvent(eventId: string): Promise<Rsvp[]> {
    return this.rsvpModel.find({ event: eventId })
      .populate('user')
      .exec();
  }

  async createRsvp(rsvpData: { 
    user: string, 
    event: string, 
    isAttending: boolean, 
    preferSingles: boolean,
    playingSinglesOnly?: boolean,
    playingDoublesOnly?: boolean
  }): Promise<Rsvp> {
    const existingRsvp = await this.rsvpModel.findOne({
      user: rsvpData.user,
      event: rsvpData.event,
    });
    
    if (existingRsvp) {
      const updatedRsvp = await this.rsvpModel.findByIdAndUpdate(
        existingRsvp._id, 
        rsvpData, 
        { new: true }
      ).exec();
      
      if (!updatedRsvp) {
        throw new NotFoundException(`RSVP with ID ${existingRsvp._id} not found after update`);
      }
      
      return updatedRsvp;
    }
    
    const newRsvp = new this.rsvpModel(rsvpData);
    const savedRsvp = await newRsvp.save();
    
    if (rsvpData.isAttending) {
      await this.addAttendee(rsvpData.event, rsvpData.user);
    }
    
    return savedRsvp;
  }

  async updateRsvp(
    id: string, 
    updateData: { 
      isAttending?: boolean, 
      preferSingles?: boolean,
      playingSinglesOnly?: boolean,
      playingDoublesOnly?: boolean
    }
  ): Promise<Rsvp> {
    const rsvp = await this.rsvpModel.findById(id);
    if (!rsvp) {
      throw new NotFoundException(`RSVP with ID ${id} not found`);
    }
    
    const wasAttending = rsvp.isAttending;
    
    // Update the RSVP
    const updatedRsvp = await this.rsvpModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).exec();
    
    if (!updatedRsvp) {
      throw new NotFoundException(`RSVP with ID ${id} not found after update`);
    }
    
    // Handle attendee list update if attendance status changed
    if (wasAttending !== updatedRsvp.isAttending) {
      if (updatedRsvp.isAttending) {
        await this.addAttendee(updatedRsvp.event.toString(), updatedRsvp.user.toString());
      } else {
        await this.removeAttendee(updatedRsvp.event.toString(), updatedRsvp.user.toString());
      }
    }
    
    return updatedRsvp;
  }

  async getUserRsvp(eventId: string, userId: string): Promise<Rsvp | null> {
    // Check if userId is an Auth0 ID (starts with "auth0|")
    if (userId.startsWith('auth0|')) {
      // Find the user by Auth0 ID first
      const user = await this.userModel.findOne({ auth0Id: userId }).exec();
      
      if (!user) {
        throw new NotFoundException(`User with Auth0 ID ${userId} not found`);
      }
      
      // Use the user's MongoDB _id for the RSVP lookup
      return this.rsvpModel.findOne({
        event: eventId,
        user: user._id,
      }).exec();
    } else {
      // If it's not an Auth0 ID, assume it's already a valid MongoDB ObjectId
      return this.rsvpModel.findOne({
        event: eventId,
        user: userId,
      }).exec();
    }
  }

  async deleteRsvp(id: string): Promise<Rsvp> {
    const rsvp = await this.rsvpModel.findById(id);
    if (!rsvp) {
      throw new NotFoundException(`RSVP with ID ${id} not found`);
    }
    
    if (rsvp.isAttending) {
      await this.removeAttendee(rsvp.event.toString(), rsvp.user.toString());
    }
    
    const deletedRsvp = await this.rsvpModel.findByIdAndDelete(id).exec();
    if (!deletedRsvp) {
      throw new NotFoundException(`RSVP with ID ${id} not found during deletion`);
    }
    
    return deletedRsvp;
  }
}