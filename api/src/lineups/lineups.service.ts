import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  Lineup, 
  LineupDocument,
  Match,
  SinglesMatch,
  DoublesMatch,
  Set,
  SinglesSet,
  DoublesTeamCombination
} from '../models/match.schema';
import { Event, EventDocument } from '../models/event.schema';
import { User, UserDocument } from '../models/user.schema';

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
      .populate({
        path: 'singlesMatches',
        populate: [
          { path: 'playerA' },
          { path: 'playerB' }
        ]
      })
      .populate({
        path: 'doublesMatches',
        populate: { path: 'players' }
      })
      .exec();
    
    if (!lineup) {
      throw new NotFoundException(`Lineup for event ${eventId} not found`);
    }
    
    return lineup;
  }

  async getEventMatches(eventId: string): Promise<Match[]> {
    const lineup = await this.getLineupByEvent(eventId);
    return [
      ...lineup.singlesMatches,
      ...lineup.doublesMatches
    ];
  }

  async getEventSinglesMatches(eventId: string): Promise<SinglesMatch[]> {
    const lineup = await this.getLineupByEvent(eventId);
    return lineup.singlesMatches;
  }

  async getEventDoublesMatches(eventId: string): Promise<DoublesMatch[]> {
    const lineup = await this.getLineupByEvent(eventId);
    return lineup.doublesMatches;
  }

  async createLineup(eventId: string): Promise<Lineup> {
    const existingLineup = await this.lineupModel.findOne({ event: eventId });
    if (existingLineup) {
      return existingLineup;
    }

    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check if the event has attendees
    if (!event.attendees || event.attendees.length === 0) {
      // Create an empty lineup instead of throwing an error
      const emptyLineup = new this.lineupModel({
        event: eventId,
        singlesMatches: [],
        doublesMatches: [],
        isPublished: true,
        generationType: 'auto',
        notes: 'No attendees were registered for this event. Add attendees and regenerate the lineup.'
      });
      return emptyLineup.save();
    }

    const users = await this.userModel.find({ 
      _id: { $in: event.attendees } 
    }).exec();

    if (users.length === 0) {
      // Create an empty lineup if no user records found for attendees
      const emptyLineup = new this.lineupModel({
        event: eventId,
        singlesMatches: [],
        doublesMatches: [],
        isPublished: true,
        generationType: 'auto',
        notes: 'No valid attendee records were found. Check user accounts and regenerate the lineup.'
      });
      return emptyLineup.save();
    }

    const { singlesMatches, doublesMatches } = this.createMatchesFromUsers(users, event);
    
    const lineup = new this.lineupModel({
      event: eventId,
      singlesMatches,
      doublesMatches,
      isPublished: true,
      generationType: 'auto'
    });

    return lineup.save();
  }

  async updateLineup(
    lineupId: string,
    matchUpdates: any[]
  ): Promise<Lineup> {
    const lineup = await this.lineupModel.findById(lineupId);
    if (!lineup) {
      throw new NotFoundException(`Lineup with ID ${lineupId} not found`);
    }
    
    for (const update of matchUpdates) {
      if (update.matchType === 'singles') {
        await this.updateSinglesMatchInLineup(lineup, update);
      } else if (update.matchType === 'doubles') {
        await this.updateDoublesMatchInLineup(lineup, update);
      }
    }
    
    return lineup.save();
  }

  private async updateSinglesMatchInLineup(
    lineup: LineupDocument, 
    update: { 
      matchId: string, 
      playerA?: string, 
      playerB?: string,
      scheduledTime?: Date
    }
  ): Promise<void> {
    const matchIndex = lineup.singlesMatches.findIndex(
      m => (m as any)._id.toString() === update.matchId
    );
    
    if (matchIndex === -1) {
      throw new NotFoundException(`Singles match ${update.matchId} not found in lineup`);
    }
    
    if (update.playerA) {
      lineup.singlesMatches[matchIndex].playerA = new Types.ObjectId(update.playerA) as any;
    }
    
    if (update.playerB) {
      lineup.singlesMatches[matchIndex].playerB = new Types.ObjectId(update.playerB) as any;
    }
    
    if (update.scheduledTime) {
      lineup.singlesMatches[matchIndex].scheduledTime = update.scheduledTime;
    }
  }

  private async updateDoublesMatchInLineup(
    lineup: LineupDocument, 
    update: { 
      matchId: string, 
      players?: string[],
      scheduledTime?: Date
    }
  ): Promise<void> {
    const matchIndex = lineup.doublesMatches.findIndex(
      m => (m as any)._id.toString() === update.matchId
    );
    
    if (matchIndex === -1) {
      throw new NotFoundException(`Doubles match ${update.matchId} not found in lineup`);
    }
    
    if (update.players && update.players.length === 4) {
      lineup.doublesMatches[matchIndex].players = update.players.map(
        p => new Types.ObjectId(p)
      ) as any[];
      
      lineup.doublesMatches[matchIndex].combinations = this.generateDoublesTeamCombinations(
        update.players.map(p => new Types.ObjectId(p))
      );
    }
    
    if (update.scheduledTime) {
      lineup.doublesMatches[matchIndex].scheduledTime = update.scheduledTime;
    }
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
    try {
      return await this.getSinglesMatch(matchId);
    } catch (error) {
      try {
        return await this.getDoublesMatch(matchId);
      } catch (error) {
        throw new NotFoundException(`Match with ID ${matchId} not found`);
      }
    }
  }

  async getSinglesMatch(matchId: string): Promise<SinglesMatch> {
    const lineup = await this.lineupModel.findOne({
      'singlesMatches._id': new Types.ObjectId(matchId)
    })
    .populate({
      path: 'singlesMatches',
      populate: [
        { path: 'playerA' },
        { path: 'playerB' },
        { path: 'event' }
      ]
    })
    .exec();
    
    if (!lineup) {
      throw new NotFoundException(`Singles match with ID ${matchId} not found in any lineup`);
    }
    
    const match = lineup.singlesMatches.find(
      m => (m as any)._id.toString() === matchId
    );
    
    if (!match) {
      throw new NotFoundException(`Singles match with ID ${matchId} not found in lineup`);
    }
    
    return match;
  }

  async getDoublesMatch(matchId: string): Promise<DoublesMatch> {
    const lineup = await this.lineupModel.findOne({
      'doublesMatches._id': new Types.ObjectId(matchId)
    })
    .populate({
      path: 'doublesMatches',
      populate: [
        { path: 'players' },
        { path: 'event' }
      ]
    })
    .exec();
    
    if (!lineup) {
      throw new NotFoundException(`Doubles match with ID ${matchId} not found in any lineup`);
    }
    
    const match = lineup.doublesMatches.find(
      m => (m as any)._id.toString() === matchId
    );
    
    if (!match) {
      throw new NotFoundException(`Doubles match with ID ${matchId} not found in lineup`);
    }
    
    return match;
  }

  async updateMatchScore(
    matchId: string, 
    teamAScore: number, 
    teamBScore: number, 
    notes?: string
  ): Promise<Match> {
    try {
      const singlesMatch = await this.getSinglesMatch(matchId);
      singlesMatch.playerASetsWon = teamAScore;
      singlesMatch.playerBSetsWon = teamBScore;
      singlesMatch.isCompleted = true;
      
      if (notes) {
        singlesMatch.notes = notes;
      }
      
      await this.lineupModel.updateOne(
        { 'singlesMatches._id': new Types.ObjectId(matchId) },
        { 
          $set: { 
            'singlesMatches.$.playerASetsWon': teamAScore,
            'singlesMatches.$.playerBSetsWon': teamBScore,
            'singlesMatches.$.isCompleted': true,
            ...(notes ? { 'singlesMatches.$.notes': notes } : {})
          } 
        }
      );
      
      return singlesMatch;
    } catch {
      try {
        const doublesMatch = await this.getDoublesMatch(matchId);
        doublesMatch.notes = `Legacy score update: ${teamAScore} - ${teamBScore}${notes ? '. ' + notes : ''}`;
        doublesMatch.isCompleted = true;
        
        await this.lineupModel.updateOne(
          { 'doublesMatches._id': new Types.ObjectId(matchId) },
          { 
            $set: { 
              'doublesMatches.$.isCompleted': true,
              'doublesMatches.$.notes': doublesMatch.notes
            } 
          }
        );
        
        return doublesMatch;
      } catch {
        throw new NotFoundException(`Match with ID ${matchId} not found`);
      }
    }
  }

  async updateSinglesMatchScore(
    matchId: string, 
    sets: SinglesSet[]
  ): Promise<SinglesMatch> {
    const match = await this.getSinglesMatch(matchId);
    
    match.sets = sets;
    
    let playerASetsWon = 0;
    let playerBSetsWon = 0;
    
    for (const set of sets) {
      if (set.isCompleted) {
        if (set.playerAGames > set.playerBGames) {
          playerASetsWon++;
        } else if (set.playerBGames > set.playerAGames) {
          playerBSetsWon++;
        }
      }
    }
    
    match.playerASetsWon = playerASetsWon;
    match.playerBSetsWon = playerBSetsWon;
    match.isCompleted = (playerASetsWon > match.maxSets / 2 || playerBSetsWon > match.maxSets / 2);
    
    await this.lineupModel.updateOne(
      { 'singlesMatches._id': new Types.ObjectId(matchId) },
      { 
        $set: { 
          'singlesMatches.$.sets': sets,
          'singlesMatches.$.playerASetsWon': playerASetsWon,
          'singlesMatches.$.playerBSetsWon': playerBSetsWon,
          'singlesMatches.$.isCompleted': match.isCompleted
        } 
      }
    );
    
    return match;
  }

  async updateDoublesMatchScore(
    matchId: string, 
    combinationId: string,
    sets: Set[],
    combinationName?: string,
    isCompleted?: boolean
  ): Promise<DoublesMatch> {
    const match = await this.getDoublesMatch(matchId);
    
    const combinationIndex = match.combinations.findIndex(
      c => (c as any)._id.toString() === combinationId
    );
    
    if (combinationIndex === -1) {
      throw new NotFoundException(`Combination ${combinationId} not found in doubles match ${matchId}`);
    }
    
    match.combinations[combinationIndex].sets = sets;
    
    // Update combination name if provided
    if (combinationName) {
      match.combinations[combinationIndex].combinationName = combinationName;
    }
    
    // Calculate sets won
    let teamASetsWon = 0;
    let teamBSetsWon = 0;
    
    for (const set of sets) {
      if (set.isCompleted) {
        if (set.teamAGames > set.teamBGames) {
          teamASetsWon++;
        } else if (set.teamBGames > set.teamAGames) {
          teamBSetsWon++;
        }
      }
    }
    
    match.combinations[combinationIndex].teamASetsWon = teamASetsWon;
    match.combinations[combinationIndex].teamBSetsWon = teamBSetsWon;
    
    // Update combination completion status if provided or if all sets are completed
    if (isCompleted !== undefined) {
      match.combinations[combinationIndex].isCompleted = isCompleted;
    } else if (sets.every(s => s.isCompleted)) {
      match.combinations[combinationIndex].isCompleted = true;
    }
    
    // Check if all combinations are completed to mark the match as completed
    const allCombinationsCompleted = match.combinations.every(c => c.isCompleted);
    if (allCombinationsCompleted) {
      match.isCompleted = true;
      
      let maxSetDifference = 0;
      let winningCombIdx = 0;
      
      for (let i = 0; i < match.combinations.length; i++) {
        const comb = match.combinations[i];
        const difference = Math.abs(comb.teamASetsWon - comb.teamBSetsWon);
        if (difference > maxSetDifference) {
          maxSetDifference = difference;
          winningCombIdx = i;
        }
      }
      
      match.winningCombination = (match.combinations[winningCombIdx] as any)._id.toString();
    }
    
    await this.lineupModel.updateOne(
      { 
        'doublesMatches._id': new Types.ObjectId(matchId),
        'doublesMatches.combinations._id': new Types.ObjectId(combinationId)
      },
      { 
        $set: { 
          'doublesMatches.$.combinations.$[comb].sets': sets,
          'doublesMatches.$.combinations.$[comb].teamASetsWon': teamASetsWon,
          'doublesMatches.$.combinations.$[comb].teamBSetsWon': teamBSetsWon,
          'doublesMatches.$.combinations.$[comb].isCompleted': match.combinations[combinationIndex].isCompleted,
          'doublesMatches.$.combinations.$[comb].combinationName': match.combinations[combinationIndex].combinationName,
          'doublesMatches.$.isCompleted': match.isCompleted,
          'doublesMatches.$.winningCombination': match.winningCombination
        } 
      },
      {
        arrayFilters: [{ 'comb._id': new Types.ObjectId(combinationId) }]
      }
    );
    
    return match;
  }

  private createMatchesFromUsers(users: User[], event: Event): {
    singlesMatches: SinglesMatch[],
    doublesMatches: DoublesMatch[]
  } {
    if (users.length < 2) {
      return { singlesMatches: [], doublesMatches: [] };
    }
    
    const allPlayers = [...users];
    this.shuffleArray(allPlayers);
    
    const singlesMatches: SinglesMatch[] = [];
    const doublesMatches: DoublesMatch[] = [];
    
    const singlesPlayerCount = Math.floor(allPlayers.length / 3);
    if (singlesPlayerCount >= 2) {
      const singlesPlayers = allPlayers.slice(0, 2 * Math.floor(singlesPlayerCount / 2));
      
      for (let i = 0; i < singlesPlayers.length; i += 2) {
        const singlesMatch: SinglesMatch = {
          event: (event as any)._id ? (event as any)._id : event,
          matchNumber: singlesMatches.length + 1,
          matchType: 'singles',
          playerA: singlesPlayers[i],
          playerB: singlesPlayers[i + 1],
          sets: [],
          playerASetsWon: 0,
          playerBSetsWon: 0,
          isCompleted: false,
          maxSets: 3,
          scheduledTime: new Date(event.date),
          notes: '',
          scoringFormat: 'regular'
        };
        singlesMatches.push(singlesMatch);
      }
    }
    
    const remainingPlayers = allPlayers.slice(
      singlesMatches.length * 2
    );
    
    const groupsOf4 = Math.floor(remainingPlayers.length / 4);
    for (let i = 0; i < groupsOf4; i++) {
      const players = remainingPlayers.slice(i * 4, (i + 1) * 4);
      
      const combinations = this.generateDoublesTeamCombinations(players);
      
      const doublesMatch: DoublesMatch = {
        event: (event as any)._id ? (event as any)._id : event,
        matchNumber: singlesMatches.length + doublesMatches.length + 1,
        matchType: 'doubles',
        players,
        combinations,
        isCompleted: false,
        maxSets: 3,
        scheduledTime: new Date(event.date),
        notes: '',
        scoringFormat: 'regular',
        winningCombination: ''
      };
      doublesMatches.push(doublesMatch);
    }
    
    const leftoverPlayers = remainingPlayers.slice(groupsOf4 * 4);
    if (leftoverPlayers.length === 2) {
      const singlesMatch: SinglesMatch = {
        event: (event as any)._id ? (event as any)._id : event,
        matchNumber: singlesMatches.length + doublesMatches.length + 1,
        matchType: 'singles',
        playerA: leftoverPlayers[0],
        playerB: leftoverPlayers[1],
        sets: [],
        playerASetsWon: 0,
        playerBSetsWon: 0,
        isCompleted: false,
        maxSets: 3,
        scheduledTime: new Date(event.date),
        notes: '',
        scoringFormat: 'regular'
      };
      singlesMatches.push(singlesMatch);
    }
    
    return { singlesMatches, doublesMatches };
  }
  
  private generateDoublesTeamCombinations(players: any[]): DoublesTeamCombination[] {
    if (players.length !== 4) {
      return [];
    }
    
    return [
      {
        teamA: [players[0], players[1]],
        teamB: [players[2], players[3]],
        sets: [],
        teamASetsWon: 0,
        teamBSetsWon: 0,
        combinationName: 'Combination 1',
        isCompleted: false
      },
      {
        teamA: [players[0], players[2]],
        teamB: [players[1], players[3]],
        sets: [],
        teamASetsWon: 0,
        teamBSetsWon: 0,
        combinationName: 'Combination 2',
        isCompleted: false
      },
      {
        teamA: [players[0], players[3]],
        teamB: [players[1], players[2]],
        sets: [],
        teamASetsWon: 0,
        teamBSetsWon: 0,
        combinationName: 'Combination 3',
        isCompleted: false
      }
    ];
  }

  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  async generateLineup(eventId: string): Promise<Lineup> {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    
    // Check if the event has attendees
    if (!event.attendees || event.attendees.length === 0) {
      // Create or update with an empty lineup
      const existingLineup = await this.lineupModel.findOne({ event: eventId }).exec();
      
      if (existingLineup) {
        existingLineup.singlesMatches = [];
        existingLineup.doublesMatches = [];
        existingLineup.isPublished = true;
        existingLineup.notes = 'No attendees were registered for this event. Add attendees and regenerate the lineup.';
        return await existingLineup.save();
      } else {
        const emptyLineup = new this.lineupModel({
          event: event._id,
          singlesMatches: [],
          doublesMatches: [],
          isPublished: true,
          generationType: 'auto',
          notes: 'No attendees were registered for this event. Add attendees and regenerate the lineup.'
        });
        return emptyLineup.save();
      }
    }
    
    const users = await this.userModel.find({ 
      _id: { $in: event.attendees } 
    }).exec();
    
    if (users.length === 0) {
      // Create or update with an empty lineup if no user records found
      const existingLineup = await this.lineupModel.findOne({ event: eventId }).exec();
      
      if (existingLineup) {
        existingLineup.singlesMatches = [];
        existingLineup.doublesMatches = [];
        existingLineup.isPublished = true;
        existingLineup.notes = 'No valid attendee records were found. Check user accounts and regenerate the lineup.';
        return await existingLineup.save();
      } else {
        const emptyLineup = new this.lineupModel({
          event: event._id,
          singlesMatches: [],
          doublesMatches: [],
          isPublished: true,
          generationType: 'auto',
          notes: 'No valid attendee records were found. Check user accounts and regenerate the lineup.'
        });
        return emptyLineup.save();
      }
    }
    
    const { singlesMatches, doublesMatches } = this.createMatchesFromUsers(users, event);
    
    const existingLineup = await this.lineupModel.findOne({ event: eventId }).exec();
    
    if (existingLineup) {
      existingLineup.singlesMatches = singlesMatches;
      existingLineup.doublesMatches = doublesMatches;
      existingLineup.isPublished = true;
      
      // Fix for TypeScript error - notes property is now defined in the schema
      existingLineup.notes = ''; // Clear any previous error notes
      return await existingLineup.save();
    } else {
      const lineup = new this.lineupModel({
        event: event._id,
        singlesMatches,
        doublesMatches,
        isPublished: true,
        generationType: 'auto',
        notes: '' // Initialize with empty notes
      });
      
      return await lineup.save();
    }
  }
}