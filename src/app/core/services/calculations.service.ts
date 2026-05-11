import { Injectable } from '@angular/core';
import { Contest, PlayerStats } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CalculationsService {
  calculatePlayerStats(contests: Contest[]): PlayerStats[] {
    const playerMap = new Map<
      string,
      {
        name: string;
        totalInvested: number;
        totalWinnings: number;
        contestsParticipated: number;
        results: number[];
        winnerCount: number;
      }
    >();

    contests.forEach((contest) => {
      const winnerResult = contest.results?.find((result) => result.rank === 1);
      const winnerId = winnerResult?.playerId;

      contest.participants.forEach((player) => {
        const playerKey = this.normalize(player.name);

        if (!playerMap.has(playerKey)) {
          playerMap.set(playerKey, {
            name: player.name,
            totalInvested: 0,
            totalWinnings: 0,
            contestsParticipated: 0,
            results: [],
            winnerCount: 0
          });
        }

        const stats = playerMap.get(playerKey);
        if (!stats) {
          return;
        }

        stats.name = player.name;
        stats.totalInvested += contest.entryFee * player.entryCount;
        stats.contestsParticipated++;

        if (contest.results?.length) {
          const playerResult = contest.results.find((result) => result.playerId === player.id);
          if (playerResult) {
            stats.totalWinnings += playerResult.winningAmount;
            stats.results.push(playerResult.winningAmount);
          }
        }

        if (winnerId && winnerId === player.id) {
          stats.winnerCount++;
        } else if (!contest.results?.length && contest.winner && this.normalize(contest.winner) === playerKey) {
          // Fallback to manual winner if no results
          stats.winnerCount++;
        }
      });
    });

    return Array.from(playerMap.entries()).map(([playerId, stats]) => ({
      playerId,
      name: stats.name,
      totalInvested: stats.totalInvested,
      totalWinnings: stats.totalWinnings,
      profitLoss: stats.totalWinnings - stats.totalInvested,
      contestsParticipated: stats.contestsParticipated,
      avgReturn:
        stats.contestsParticipated > 0
          ? (stats.totalWinnings - stats.totalInvested) / stats.contestsParticipated
          : 0,
      bestResult: Math.max(...stats.results, 0),
      winnerCount: stats.winnerCount
    }));
  }

  calculateGroupStats(contests: Contest[]): {
    totalContests: number;
    completedContests: number;
    totalInvested: number;
    totalWinnings: number;
    groupProfitLoss: number;
    mostProfitable: PlayerStats | null;
    bestWinner: PlayerStats | null;
  } {
    const allStats = this.calculatePlayerStats(contests);

    return {
      totalContests: contests.length,
      completedContests: contests.filter((contest) => contest.isCompleted).length,
      totalInvested: allStats.reduce((sum, player) => sum + player.totalInvested, 0),
      totalWinnings: allStats.reduce((sum, player) => sum + player.totalWinnings, 0),
      groupProfitLoss: allStats.reduce((sum, player) => sum + player.profitLoss, 0),
      mostProfitable:
        allStats.length > 0
          ? allStats.reduce((max, player) => (player.profitLoss > max.profitLoss ? player : max))
          : null,
      bestWinner:
        allStats.length > 0
          ? allStats.reduce((max, player) => (player.winnerCount > max.winnerCount ? player : max))
          : null
    };
  }

  getContestSummary(contest: Contest): {
    totalParticipants: number;
    totalEntries: number;
    totalInvested: number;
    prizePool: number;
    isCompleted: boolean;
  } {
    return {
      totalParticipants: contest.participants.length,
      totalEntries: contest.participants.reduce((sum, player) => sum + player.entryCount, 0),
      totalInvested: contest.participants.reduce(
        (sum, player) => sum + contest.entryFee * player.entryCount,
        0
      ),
      prizePool: contest.prizePool || 0,
      isCompleted: contest.isCompleted || false
    };
  }

  private normalize(value: string): string {
    return value.toLowerCase().trim().replace(/\s+/g, ' ');
  }
}
