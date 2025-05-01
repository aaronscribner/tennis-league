import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lineup, LineupDocument } from '../models/match.schema';
import { Event, EventDocument } from '../models/event.schema';
import { User, UserDocument } from '../models/user.schema';
import { Match, Team } from '../models/match.model';

@Injectable()
export class LineupsService {
  constructor(
    @InjectModel(Lineup.name) private lineupModel: Model<LineupDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getLineupByEvent(eventId: string): Promise<Lineup> {
    const lineup = await this.lineupModel.findOne({ event: eventId })
      .populate('event')
      .exec();
    
    if (!lineup) {
      throw new NotFoundException(`Lineup for event ${eventId} not found`);
    }
    
    return lineup;
  }

  async createLineup(eventId: string): Promise<Lineup> {
    // Check if lineup already exists
    const existingLineup = await this.lineupModel.findOne({ event: eventId });
    if (existingLineup) {
      return existingLineup;
    }

    // Get event details
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Get all attending users from event
    const users = await this.userModel.find({ 
      _id: { $in: event.attendees } 
    }).exec();

    if (users.length === 0) {
      throw new Error('No attendees found for this event');
    }

    // Generate matches
    const matches = this.createMatchesFromUsers(users, event);
    
    // Create the lineup
    const lineup = new this.lineupModel({
      event: eventId,
      matches,
      isPublished: true,
      generationType: 'auto'
    });

    return lineup.save();
  }

  async updateMatchInLineup(
    lineupId: string,
    update: { matchId: string, teamAPlayers?: string[], teamBPlayers?: string[] }
  ): Promise<Lineup> {
    const lineup = await this.lineupModel.findById(lineupId);
    if (!lineup) {
      throw new NotFoundException(`Lineup with ID ${lineupId} not found`);
    }
    
    // Use type assertion to access _id
    const matchIndex = lineup.matches.findIndex(
      m => (m as any)._id && (m as any)._id.toString() === update.matchId
    );
    
    if (matchIndex === -1) {
      throw new NotFoundException(`Match with ID ${update.matchId} not found in lineup ${lineupId}`);
    }
    
    if (update.teamAPlayers) {
      lineup.matches[matchIndex].teamA.players = update.teamAPlayers as any[];
    }
    
    if (update.teamBPlayers) {
      lineup.matches[matchIndex].teamB.players = update.teamBPlayers as any[];
    }
    
    return lineup.save();
  }

  async republishLineup(lineupId: string): Promise<Lineup> {
    const lineup = await this.lineupModel.findByIdAndUpdate(lineupId,
      { isPublished: true },
      { new: true }
    ).populate('event').exec();
    
    if (!lineup) {
      throw new NotFoundException(`Lineup with ID ${lineupId} not found`);
    }
    
    return lineup;
  }

  async getMatch(matchId: string): Promise<Match> {
    const lineup = await this.lineupModel.findOne({
      matches: { $elemMatch: { _id: matchId } }
    }).exec();
    
    if (!lineup) {
      throw new NotFoundException(`Match with ID ${matchId} not found in any lineup`);
    }
    
    // Use type assertion to access _id
    const match = lineup.matches.find(
      m => (m as any)._id && (m as any)._id.toString() === matchId
    );
    
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found in lineup`);
    }
    
    return match;
  }

  async updateMatchScore(
    matchId: string, 
    teamAScore: number, 
    teamBScore: number, 
    notes?: string
  ): Promise<Match> {
    const lineup = await this.lineupModel.findOne({
      matches: { $elemMatch: { _id: matchId } }
    }).exec();
    
    if (!lineup) {
      throw new NotFoundException(`Match with ID ${matchId} not found in any lineup`);
    }
    
    // Use type assertion to access _id
    const matchIndex = lineup.matches.findIndex(
      m => (m as any)._id && (m as any)._id.toString() === matchId
    );
    
    if (matchIndex === -1) {
      throw new NotFoundException(`Match with ID ${matchId} not found in lineup`);
    }
    
    // Update the match with scores and mark as completed
    lineup.matches[matchIndex].teamA.score = teamAScore;
    lineup.matches[matchIndex].teamB.score = teamBScore;
    lineup.matches[matchIndex].isCompleted = true;
    
    if (notes) {
      lineup.matches[matchIndex].notes = notes;
    }
    
    await lineup.save();
    
    return lineup.matches[matchIndex];
  }

  // Helper method to create matches from a list of users
  private createMatchesFromUsers(users: User[], event: Event): Match[] {
    if (users.length < 2) {
      return [];
    }
    
    // Create a deep copy of the players array so we can modify it
    const playersCopy = [...users];
    
    // Simple shuffling of players
    this.shuffleArray(playersCopy);
    
    const matches: Match[] = [];
    let matchNumber = 1;
    
    // Create matches by pairing players
    while (playersCopy.length >= 4) {
      const teamAPlayers = [playersCopy.pop(), playersCopy.pop()];
      const teamBPlayers = [playersCopy.pop(), playersCopy.pop()];
      
      matches.push({
        matchNumber,
        teamA: { players: teamAPlayers },
        teamB: { players: teamBPlayers },
        isCompleted: false,
        scheduledTime: new Date(event.date)
      });
      
      matchNumber++;
    }
    
    // If we have leftover players, create a match with them (for odd numbers)
    if (playersCopy.length > 0) {
      const match: Match = {
        matchNumber,
        teamA: { players: [] },
        teamB: { players: [] },
        isCompleted: false,
        scheduledTime: new Date(event.date)
      };
      
      if (playersCopy.length === 1 || playersCopy.length === 3) {
        match.teamA.players = [playersCopy[0]];
        if (playersCopy.length === 3) {
          match.teamB.players = [playersCopy[1], playersCopy[2]];
        }
      } else if (playersCopy.length === 2) {
        match.teamA.players = [playersCopy[0]];
        match.teamB.players = [playersCopy[1]];
      }
      
      matches.push(match);
    }
    
    return matches;
  }

  // Helper method to shuffle an array
  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  async generateLineup(eventId: string): Promise<Lineup> {
    // Get event details
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    
    // Get all users for the event
    const users = await this.userModel.find({ 
      _id: { $in: event.attendees } 
    }).exec();
    
    if (users.length === 0) {
      throw new Error('No attendees found for this event');
    }
    
    // Create lineup object with matches
    const lineup = new this.lineupModel({
      event: event._id,
      matches: this.createMatchesFromUsers(users, event),
      isPublished: true,
      generationType: 'auto',
    });
    
    // Save and return the new lineup
    return await lineup.save();
  }
}