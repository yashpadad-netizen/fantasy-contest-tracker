import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContestService } from '../core/services/contest.service';
import { CalculationsService } from '../core/services/calculations.service';
import { AuthService } from '../core/services/auth.service';
import { Contest, PlayerStats } from '../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  selectedWinsPlayer: string | null = null;
  selectedWinContests: Contest[] = [];
  selectedPlayerName: string | null = null;
  selectedPlayerContests: Contest[] = [];
  contests: Contest[] = [];
  playerStats: PlayerStats[] = [];
  groupStats: {
    totalContests: number;
    completedContests: number;
    totalInvested: number;
    totalWinnings: number;
    groupProfitLoss: number;
    mostProfitable: PlayerStats | null;
    bestWinner: PlayerStats | null;
  } | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private contestService: ContestService,
    private calculationsService: CalculationsService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.contestService.contests$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((contests) => {
        this.contests = contests;
        this.playerStats = this.calculationsService
          .calculatePlayerStats(contests)
          .sort((a, b) => b.profitLoss - a.profitLoss);
        this.groupStats = this.calculationsService.calculateGroupStats(contests);
        if (this.selectedWinsPlayer) {
          this.selectedWinContests = this.getWinningContestsForPlayer(this.selectedWinsPlayer);
        }
        if (this.selectedPlayerName) {
          this.selectedPlayerContests = this.getContestsForPlayer(this.selectedPlayerName);
        }
      });
  }

  getTotalContestEntries(): number {
    return this.contests.reduce(
      (sum, contest) => sum + contest.participants.reduce((entrySum, player) => entrySum + player.entryCount, 0),
      0
    );
  }

  getROI(invested: number, profitLoss: number): number {
    if (!invested) {
      return 0;
    }

    return (profitLoss / invested) * 100;
  }

  get topRoiPlayer(): PlayerStats | null {
    if (!this.playerStats.length) {
      return null;
    }
    return [...this.playerStats].sort(
      (a, b) => this.getROI(b.totalInvested, b.profitLoss) - this.getROI(a.totalInvested, a.profitLoss)
    )[0];
  }

  get bestPerformingUser(): PlayerStats | null {
    if (!this.playerStats.length) {
      return null;
    }
    return [...this.playerStats].sort((a, b) => b.totalWinnings - a.totalWinnings)[0];
  }

  get mostActivePlayer(): PlayerStats | null {
    if (!this.playerStats.length) {
      return null;
    }
    return [...this.playerStats].sort((a, b) => b.contestsParticipated - a.contestsParticipated)[0];
  }

  get mostInactivePlayer(): PlayerStats | null {
    if (!this.playerStats.length) {
      return null;
    }
    return [...this.playerStats].sort((a, b) => a.contestsParticipated - b.contestsParticipated)[0];
  }

  showWinsForPlayer(playerName: string): void {
    this.selectedWinsPlayer = playerName;
    this.selectedWinContests = this.getWinningContestsForPlayer(playerName);
  }

  clearWinsSelection(): void {
    this.selectedWinsPlayer = null;
    this.selectedWinContests = [];
  }

  showContestsForPlayer(playerName: string): void {
    this.selectedPlayerName = playerName;
    this.selectedPlayerContests = this.getContestsForPlayer(playerName);
  }

  clearPlayerSelection(): void {
    this.selectedPlayerName = null;
    this.selectedPlayerContests = [];
  }

  exportDashboardPdf(): void {
    if (!this.groupStats) {
      return;
    }

    this.contestService.exportDashboardPdf({
      generatedAt: new Date(),
      totalContests: this.groupStats.totalContests,
      completedContests: this.groupStats.completedContests,
      totalEntries: this.getTotalContestEntries(),
      totalInvested: this.groupStats.totalInvested,
      totalWinnings: this.groupStats.totalWinnings,
      groupProfitLoss: this.groupStats.groupProfitLoss,
      bestPerformingUser: this.bestPerformingUser?.name ?? '-',
      mostActivePlayer: this.mostActivePlayer?.name ?? '-',
      mostInactivePlayer: this.mostInactivePlayer?.name ?? '-',
      playerStats: this.playerStats
    });
  }

  private getWinningContestsForPlayer(playerName: string): Contest[] {
    const normalizedPlayer = this.normalize(playerName);
    return this.contests
      .filter((contest) => {
        const winnerResult = contest.results?.find((result) => result.rank === 1);
        if (winnerResult) {
          const winnerParticipant = contest.participants.find((p) => p.id === winnerResult.playerId);
          return this.normalize(winnerParticipant?.name ?? '') === normalizedPlayer;
        }
        return this.normalize(contest.winner ?? '') === normalizedPlayer;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  getWinningAmountForContest(contest: Contest): number {
    if (!this.selectedWinsPlayer) {
      return 0;
    }

    const normalizedPlayer = this.normalize(this.selectedWinsPlayer);
    const winnerResult = contest.results?.find((result) => result.rank === 1);
    if (winnerResult) {
      const winnerParticipant = contest.participants.find((p) => p.id === winnerResult.playerId);
      if (this.normalize(winnerParticipant?.name ?? '') === normalizedPlayer) {
        return winnerResult.winningAmount;
      }
    }

    return 0;
  }

  getSelectedWinsTotalAmount(): number {
    return this.selectedWinContests.reduce((sum, contest) => sum + this.getWinningAmountForContest(contest), 0);
  }

  getPlayerEntryCount(contest: Contest): number {
    if (!this.selectedPlayerName) {
      return 0;
    }
    const participant = contest.participants.find(
      (player) => this.normalize(player.name) === this.normalize(this.selectedPlayerName ?? '')
    );
    return participant?.entryCount ?? 0;
  }

  getPlayerInvestedAmount(contest: Contest): number {
    return this.getPlayerEntryCount(contest) * contest.entryFee;
  }

  getPlayerWinningsAmount(contest: Contest): number {
    if (!this.selectedPlayerName) {
      return 0;
    }
    const participant = contest.participants.find(
      (player) => this.normalize(player.name) === this.normalize(this.selectedPlayerName ?? '')
    );
    if (!participant) {
      return 0;
    }
    const result = contest.results?.find((item) => item.playerId === participant.id);
    return result?.winningAmount ?? 0;
  }

  getPlayerRank(contest: Contest): number | null {
    if (!this.selectedPlayerName) {
      return null;
    }
    const participant = contest.participants.find(
      (player) => this.normalize(player.name) === this.normalize(this.selectedPlayerName ?? '')
    );
    if (!participant) {
      return null;
    }
    const result = contest.results?.find((item) => item.playerId === participant.id);
    return result?.rank ?? null;
  }

  getPlayerTotalInvestedAcrossSelected(): number {
    return this.selectedPlayerContests.reduce((sum, contest) => sum + this.getPlayerInvestedAmount(contest), 0);
  }

  getPlayerTotalWinningsAcrossSelected(): number {
    return this.selectedPlayerContests.reduce((sum, contest) => sum + this.getPlayerWinningsAmount(contest), 0);
  }

  private getContestsForPlayer(playerName: string): Contest[] {
    const normalizedPlayer = this.normalize(playerName);
    return this.contests
      .filter((contest) =>
        contest.participants.some((player) => this.normalize(player.name) === normalizedPlayer)
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private normalize(value: string): string {
    return value.toLowerCase().trim().replace(/\s+/g, ' ');
  }
}
