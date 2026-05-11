export interface Player {
  id: string;
  name: string;
  teamName: string;
  entryCount: number;
  rank?: number;
  winningAmount?: number;
  profitLoss?: number;
}

export interface Result {
  playerId: string;
  rank: number;
  winningAmount: number;
}

export interface Contest {
  id: string;
  name: string;
  matchName?: string;
  tournament?: string;
  contestType?: string;
  notes?: string;
  date: Date;
  participants: Player[];
  winner?: string;
  my11circleUrl?: string;
  my11circleId?: string;
  prizePool?: number;
  entryFee: number;
  results?: Result[];
  isCompleted?: boolean;
}

export interface User {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface PlayerStats {
  playerId: string;
  name: string;
  totalInvested: number;
  totalWinnings: number;
  profitLoss: number;
  contestsParticipated: number;
  avgReturn: number;
  bestResult: number;
  winnerCount: number;
}
