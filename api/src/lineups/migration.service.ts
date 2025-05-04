import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  Lineup, 
  LineupDocument, 
  SinglesMatch,
  DoublesMatch,
  Set,
  SinglesSet,
  Game,
  DoublesTeamCombination 
} from '../models/match.schema';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @InjectModel(Lineup.name) private lineupModel: Model<LineupDocument>
  ) {}

  /**
   * Migrate all lineups to use the enhanced data structures
   */
  async migrateAllLineups(): Promise<void> {
    const lineups = await this.lineupModel.find().exec();
    this.logger.log(`Starting migration of ${lineups.length} lineups`);
    
    for (const lineup of lineups) {
      await this.migrateLineup(lineup);
    }
    
    this.logger.log(`Migration completed for ${lineups.length} lineups`);
  }

  /**
   * Migrate a specific lineup to use the enhanced data structures
   */
  async migrateLineupById(lineupId: string): Promise<void> {
    const lineup = await this.lineupModel.findById(lineupId).exec();
    if (!lineup) {
      this.logger.warn(`Lineup with ID ${lineupId} not found`);
      return;
    }
    
    await this.migrateLineup(lineup);
    this.logger.log(`Migration completed for lineup ${lineupId}`);
  }

  /**
   * Migrate a specific lineup instance
   */
  private async migrateLineup(lineup: LineupDocument): Promise<void> {
    // Migrate singles matches
    if (lineup.singlesMatches && lineup.singlesMatches.length > 0) {
      for (let i = 0; i < lineup.singlesMatches.length; i++) {
        const match = lineup.singlesMatches[i];
        lineup.singlesMatches[i] = this.migrateSinglesMatch(match);
      }
    }
    
    // Migrate doubles matches
    if (lineup.doublesMatches && lineup.doublesMatches.length > 0) {
      for (let i = 0; i < lineup.doublesMatches.length; i++) {
        const match = lineup.doublesMatches[i];
        lineup.doublesMatches[i] = this.migrateDoublesMatch(match);
      }
    }
    
    // Add date field if not present
    if (!lineup.date && lineup.event) {
      try {
        if (typeof lineup.event === 'object' && lineup.event.date) {
          lineup.date = new Date(lineup.event.date);
        }
      } catch (error) {
        this.logger.warn(`Could not set date for lineup ${lineup._id}: ${error.message}`);
      }
    }
    
    await lineup.save();
  }

  /**
   * Convert legacy singles match data to use the enhanced SinglesSet structure
   */
  private migrateSinglesMatch(match: SinglesMatch): SinglesMatch {
    // Skip if already migrated (has games in sets)
    if (match.sets && match.sets.length > 0 && 
       (match.sets[0] as any).games && (match.sets[0] as any).games.length > 0) {
      return match;
    }

    // Set maxSets if not present
    if (!match.maxSets) {
      match.maxSets = 3; // Default to best of 3
    }

    // Convert legacy sets to new SinglesSet structure with games
    if (match.sets && match.sets.length > 0) {
      const enhancedSets: SinglesSet[] = [];
      
      for (const set of match.sets as any[]) {
        const enhancedSet: SinglesSet = {
          playerAGames: set.playerAGames || set.teamAGames || 0,
          playerBGames: set.playerBGames || set.teamBGames || 0,
          isTiebreak: set.isTiebreak || false,
          tiebreakScore: set.tiebreakScore || '',
          isCompleted: set.isCompleted || false,
          games: []
        };

        // Create representative games based on set score
        // For example, if the set score is 6-4, create 10 games with appropriate scores
        if (enhancedSet.isCompleted) {
          const totalGames = enhancedSet.playerAGames + enhancedSet.playerBGames;
          for (let i = 0; i < totalGames; i++) {
            const game: Game = {
              playerAScore: i < enhancedSet.playerAGames ? 4 : 0, // 4 represents "Game"
              playerBScore: i >= enhancedSet.playerAGames ? 4 : 0,
              isCompleted: true
            };
            enhancedSet.games.push(game);
          }
        }

        enhancedSets.push(enhancedSet);
      }
      
      match.sets = enhancedSets as any;
    }

    return match;
  }

  /**
   * Convert legacy doubles match data to use the enhanced DoublesTeamCombination structure
   */
  private migrateDoublesMatch(match: DoublesMatch): DoublesMatch {
    // Skip if already migrated (has combinationName in combinations)
    if (match.combinations && match.combinations.length > 0 && 
       (match.combinations[0] as any).combinationName) {
      return match;
    }

    // Set maxSets if not present
    if (!match.maxSets) {
      match.maxSets = 3; // Default to best of 3
    }

    // Enhance combinations with names and isCompleted flags
    if (match.combinations && match.combinations.length > 0) {
      for (let i = 0; i < match.combinations.length; i++) {
        const combination = match.combinations[i];
        
        // Add combination name if not present
        if (!(combination as any).combinationName) {
          (combination as any).combinationName = `Combination ${i + 1}`;
        }
        
        // Add isCompleted flag if not present, inferred from set completion
        if ((combination as any).isCompleted === undefined) {
          const setsCompleted = combination.sets && 
                               combination.sets.length > 0 && 
                               combination.sets.every(set => set.isCompleted);
          
          (combination as any).isCompleted = setsCompleted;
        }
      }
    }

    return match;
  }
}