import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lineup, LineupDocument } from '../models/match.schema';
import { Match, MatchDocument, Team } from '../models/match.schema';
import { Event, EventDocument, EventType } from '../models/event.schema';
import { Rsvp, RsvpDocument } from '../models/rsvp.schema';
import { User, UserDocument } from '../models/user.schema';

@Injectable()
export class LineupsService {
  constructor(
    @InjectModel(Lineup.name) private lineupModel: Model<LineupDocument>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Rsvp.name) private rsvpModel: Model<RsvpDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findByEvent(eventId: string): Promise<Lineup> {
    return this.lineupModel.findOne({ event: eventId })
      .populate('matches.teamA.players')
      .populate('matches.teamB.players')
      .exec();
  }

  async createLineup(eventId: string): Promise<Lineup> {
    // Check if lineup already exists
    const existingLineup = await this.lineupModel.findOne({ event: eventId });
    if (existingLineup) {
      return existingLineup;
    }

    // Get event details to determine singles or doubles
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Get all attending users from RSVPs
    const rsvps = await this.rsvpModel.find({ 
      event: eventId,
      isAttending: true 
    }).populate('user').exec();

    if (rsvps.length === 0) {
      throw new Error('No attendees found for this event');
    }

    // Generate matches based on event type
    let matches: Match[] = [];
    
    if (event.eventType === EventType.SINGLES) {
      matches = await this.generateSinglesLineup(event, rsvps);
    } else {
      // For both DOUBLES and MIXED event types
      matches = await this.generateDoublesLineup(event, rsvps);
    }

    // Create the lineup
    const lineup = new this.lineupModel({
      event: eventId,
      matches,
      isPublished: true,
      generationType: 'auto'
    });

    return lineup.save();
  }

  async updateLineup(lineupId: string, matchUpdates: any[]): Promise<Lineup> {
    const lineup = await this.lineupModel.findById(lineupId);
    if (!lineup) {
      throw new Error('Lineup not found');
    }

    // Update each match in the lineup
    for (const update of matchUpdates) {
      const matchIndex = lineup.matches.findIndex(
        m => m._id.toString() === update.matchId
      );
      
      if (matchIndex >= 0) {
        if (update.teamAScore !== undefined) {
          lineup.matches[matchIndex].teamA.score = update.teamAScore;
        }
        
        if (update.teamBScore !== undefined) {
          lineup.matches[matchIndex].teamB.score = update.teamBScore;
        }
        
        if (update.isCompleted !== undefined) {
          lineup.matches[matchIndex].isCompleted = update.isCompleted;
        }
        
        if (update.notes !== undefined) {
          lineup.matches[matchIndex].notes = update.notes;
        }
      }
    }

    return this.lineupModel.findByIdAndUpdate(lineupId, 
      { matches: lineup.matches }, 
      { new: true }
    ).exec();
  }

  async republishLineup(lineupId: string): Promise<Lineup> {
    // Delete the old lineup
    const oldLineup = await this.lineupModel.findById(lineupId);
    if (!oldLineup) {
      throw new Error('Lineup not found');
    }
    
    const eventId = oldLineup.event;
    await this.lineupModel.findByIdAndDelete(lineupId);
    
    // Create a new lineup
    return this.createLineup(eventId.toString());
  }

  async getMatchById(matchId: string): Promise<Match> {
    const lineupWithMatch = await this.lineupModel.findOne({
      'matches._id': matchId
    });
    
    if (!lineupWithMatch) {
      throw new Error('Match not found');
    }
    
    const match = lineupWithMatch.matches.find(
      m => m._id.toString() === matchId
    );
    
    return match;
  }

  async updateMatchScore(
    matchId: string, 
    teamAScore: number, 
    teamBScore: number
  ): Promise<Match> {
    const lineup = await this.lineupModel.findOne({
      'matches._id': matchId
    });
    
    if (!lineup) {
      throw new Error('Match not found');
    }
    
    const matchIndex = lineup.matches.findIndex(
      m => m._id.toString() === matchId
    );
    
    if (matchIndex < 0) {
      throw new Error('Match not found');
    }
    
    lineup.matches[matchIndex].teamA.score = teamAScore;
    lineup.matches[matchIndex].teamB.score = teamBScore;
    lineup.matches[matchIndex].isCompleted = true;
    
    await this.lineupModel.findByIdAndUpdate(lineup._id, 
      { matches: lineup.matches }, 
      { new: true }
    ).exec();
    
    return lineup.matches[matchIndex];
  }

  private async generateSinglesLineup(event: Event, rsvps: Rsvp[]): Promise<Match[]> {
    // Prioritize users who prefer singles
    let players = rsvps
      .filter(rsvp => rsvp.preferSingles)
      .map(rsvp => rsvp.user);
    
    // If we don't have enough singles players, add others
    if (players.length < 2) {
      const otherPlayers = rsvps
        .filter(rsvp => !rsvp.preferSingles)
        .map(rsvp => rsvp.user);
      
      players = [...players, ...otherPlayers];
    }
    
    // Shuffle the players for random pairings
    players = this.shuffleArray(players);
    
    const matches: Match[] = [];
    
    // Create singles matches (1v1)
    for (let i = 0; i < players.length - 1; i += 2) {
      if (i + 1 < players.length) {
        const teamA: Team = { players: [players[i]], score: 0 };
        const teamB: Team = { players: [players[i + 1]], score: 0 };
        
        const match = new this.matchModel({
          event: event._id,
          matchNumber: matches.length + 1,
          teamA,
          teamB,
          isCompleted: false,
          scheduledTime: new Date(event.date)
        });
        
        matches.push(match);
      }
    }
    
    return matches;
  }

  private async generateDoublesLineup(event: Event, rsvps: Rsvp[]): Promise<Match[]> {
    // Prioritize users who prefer doubles
    let players = rsvps
      .filter(rsvp => !rsvp.preferSingles)
      .map(rsvp => rsvp.user);
    
    // If we need more players, add singles players
    const singlesPlayers = rsvps
      .filter(rsvp => rsvp.preferSingles)
      .map(rsvp => rsvp.user);
    
    players = [...players, ...singlesPlayers];
    
    // Shuffle the players for random pairings
    players = this.shuffleArray(players);
    
    const matches: Match[] = [];
    
    // Create doubles matches (2v2)
    for (let i = 0; i < players.length - 3; i += 4) {
      if (i + 3 < players.length) {
        const teamA: Team = { 
          players: [players[i], players[i + 1]], 
          score: 0 
        };
        
        const teamB: Team = { 
          players: [players[i + 2], players[i + 3]], 
          score: 0 
        };
        
        const match = new this.matchModel({
          event: event._id,
          matchNumber: matches.length + 1,
          teamA,
          teamB,
          isCompleted: false,
          scheduledTime: new Date(event.date)
        });
        
        matches.push(match);
      }
    }
    
    return matches;
  }

  private shuffleArray(array: any[]): any[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}