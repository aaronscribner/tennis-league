import { User } from './user.model';
import { Event } from './event.model';

export interface Set {
  teamAGames: number;
  teamBGames: number;
  isTiebreak: boolean;
  tiebreakScore?: string;
  isCompleted: boolean;
}

export interface Game {
  playerAScore: number;
  playerBScore: number;
  isCompleted: boolean;
}

export interface SinglesSet {
  playerAGames: number;
  playerBGames: number;
  isTiebreak: boolean;
  tiebreakScore?: string;
  isCompleted: boolean;
  games: Game[];
}

export interface Team {
  players: User[] | string[];
  score: number;
}

export type MatchType = 'singles' | 'doubles';

export interface Match {
  _id?: string;
  id?: string;
  event: Event | string;
  matchNumber: number;
  matchType: MatchType;
  isCompleted: boolean;
  notes?: string;
  scheduledTime: Date;
  scoringFormat?: string;
  
  // Add teamA and teamB properties to fix template errors
  teamA?: Team;
  teamB?: Team;
  
  // Additional properties used in templates
  startTime?: Date;
  court?: string;
  eventId?: string;
}

export interface SinglesMatch extends Match {
  matchType: 'singles';
  playerA: User | string;
  playerB: User | string;
  sets: SinglesSet[];
  playerASetsWon: number;
  playerBSetsWon: number;
  maxSets?: number;
}

export interface DoublesTeamCombination {
  teamA: (User | string)[];
  teamB: (User | string)[];
  sets: Set[];
  teamASetsWon: number;
  teamBSetsWon: number;
  combinationName?: string;
  isCompleted?: boolean;
}

export interface DoublesMatch extends Match {
  matchType: 'doubles';
  players: (User | string)[];
  combinations: DoublesTeamCombination[];
  winningCombination?: string;
  maxSets?: number;
}

export interface Lineup {
  _id?: string;
  event: Event | string;
  singlesMatches: SinglesMatch[];
  doublesMatches: DoublesMatch[];
  isPublished: boolean;
  generationType: string;
  createdAt?: Date;
  updatedAt?: Date;
  date?: Date;
}