import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from '../models/event.schema';
import { Rsvp, RsvpDocument } from '../models/rsvp.schema';
import { User, UserDocument } from '../models/user.schema';

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

  async create(createEventDto: Partial<Event>): Promise<Event> {
    const newEvent = new this.eventModel(createEventDto);
    return newEvent.save();
  }

  async update(id: string, updateEventDto: Partial<Event>): Promise<Event> {
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
    notes?: string 
  }): Promise<Rsvp> {
    const existingRsvp = await this.rsvpModel.findOne({
      user: rsvpData.user,
      event: rsvpData.event,
    });
    
    if (existingRsvp) {
      return this.rsvpModel.findByIdAndUpdate(
        existingRsvp._id, 
        rsvpData, 
        { new: true }
      ).exec();
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
    updateData: { isAttending?: boolean, preferSingles?: boolean, notes?: string }
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
    const rsvp = await this.rsvpModel.findOne({
      event: eventId,
      user: userId,
    }).exec();
    return rsvp;
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