// A shared interface for Match to be used across the application
export interface Team {
  players: any[];
  score?: number;
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
}