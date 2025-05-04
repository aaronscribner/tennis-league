import { User } from './user.model';

// A shared interface for Match to be used across the application
export interface Team {
  players: any[];
  score?: number;
}

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

export interface DoublesTeamCombination {
  _id?: any;
  teamA: User[] | string[];
  teamB: User[] | string[];
  sets: Set[];
  teamASetsWon: number;
  teamBSetsWon: number;
  combinationName?: string;
  isCompleted: boolean;
}

export interface Match {
  _id?: any;
  matchNumber: number;
  teamA: Team;
  teamB: Team;
  event?: any;
  isCompleted: boolean;
  notes?: string;
  scheduledTime?: Date;
  matchType: string;
  scoringFormat: string;
}

export interface SinglesMatch {
  _id?: any;
  matchNumber: number;
  matchType: string;
  event?: any;
  playerA: User | string;
  playerB: User | string;
  sets: SinglesSet[];
  playerASetsWon: number;
  playerBSetsWon: number;
  isCompleted: boolean;
  notes?: string;
  scheduledTime?: Date;
  maxSets: number;
  scoringFormat: string;
}

export interface DoublesMatch {
  _id?: any;
  matchNumber: number;
  matchType: string;
  event?: any;
  players: (User | string)[];
  combinations: DoublesTeamCombination[];
  winningCombination?: string;
  isCompleted: boolean;
  notes?: string;
  scheduledTime?: Date;
  maxSets: number;
  scoringFormat: string;
}