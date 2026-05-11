import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Contest, PlayerStats } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ContestService {
  private readonly storageKey = 'contests';
  private contestsSubject = new BehaviorSubject<Contest[]>(this.loadContests());
  private backupReminderSubject = new BehaviorSubject<boolean>(false);
  contests$ = this.contestsSubject.asObservable();
  backupReminder$ = this.backupReminderSubject.asObservable();

  private loadContests(): Contest[] {
    const data = localStorage.getItem(this.storageKey);
    if (!data) {
      return [];
    }

    try {
      const contests = JSON.parse(data) as Contest[];
      return contests.map((contest) => this.normalizeContest(contest));
    } catch {
      return [];
    }
  }

  private normalizeContest(contest: Contest): Contest {
    return {
      ...contest,
      date: new Date(contest.date),
      participants: contest.participants ?? [],
      results: contest.results ?? [],
      isCompleted: contest.isCompleted ?? false
    };
  }

  private saveContests(contests: Contest[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(contests));
  }

  private markBackupReminderPending(contests: Contest[]): void {
    this.backupReminderSubject.next(contests.length > 0);
  }

  refreshContests(): void {
    const loaded = this.loadContests();
    this.contestsSubject.next(loaded);
    this.markBackupReminderPending(loaded);
  }

  clearContests(): void {
    this.contestsSubject.next([]);
    this.markBackupReminderPending([]);
  }

  getContests(): Contest[] {
    return this.contestsSubject.value;
  }

  addContest(contest: Contest): void {
    const contests = [...this.getContests(), this.normalizeContest(contest)];
    this.saveContests(contests);
    this.contestsSubject.next(contests);
    this.markBackupReminderPending(contests);
  }

  addManyContests(contestsToAdd: Contest[]): void {
    const existing = this.getContests();
    const newContests = contestsToAdd.map((contest) => this.normalizeContest(contest));
    const merged = [...existing, ...newContests];
    this.saveContests(merged);
    this.contestsSubject.next(merged);
    this.markBackupReminderPending(merged);
  }

  replaceContests(contests: Contest[]): void {
    const normalized = contests.map((contest) => this.normalizeContest(contest));
    this.saveContests(normalized);
    this.contestsSubject.next(normalized);
    this.markBackupReminderPending(normalized);
  }

  updateContest(updatedContest: Contest): void {
    const contests = this.getContests().map((contest) =>
      contest.id === updatedContest.id ? this.normalizeContest(updatedContest) : contest
    );
    this.saveContests(contests);
    this.contestsSubject.next(contests);
    this.markBackupReminderPending(contests);
  }

  deleteContest(id: string): void {
    const contests = this.getContests().filter((contest) => contest.id !== id);
    this.saveContests(contests);
    this.contestsSubject.next(contests);
    this.markBackupReminderPending(contests);
  }

  dismissBackupReminder(): void {
    this.backupReminderSubject.next(false);
  }

  downloadBackupFile(): void {
    const contests = this.getContests();
    if (!contests.length) {
      return;
    }

    const dataStr = JSON.stringify(contests, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(dataStr)}`);
    element.setAttribute('download', `contests-backup-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    this.dismissBackupReminder();
  }

  exportContestsPdf(contests: Contest[]): void {
    if (!contests.length) {
      return;
    }

    const rows = contests
      .map((contest, index) => {
        const entries = contest.participants.reduce((sum, player) => sum + player.entryCount, 0);
        const invested = contest.participants.reduce(
          (sum, player) => sum + contest.entryFee * player.entryCount,
          0
        );
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${this.escapeHtml(contest.name)}</td>
            <td>${new Date(contest.date).toLocaleDateString()}</td>
            <td>${contest.winner ? this.escapeHtml(contest.winner) : '-'}</td>
            <td>${contest.participants.length}</td>
            <td>${entries}</td>
            <td>Rs ${invested.toLocaleString()}</td>
            <td>${contest.isCompleted ? 'Completed' : 'Pending'}</td>
          </tr>
        `;
      })
      .join('');

    this.openPrintWindow(`
      <h1>Fantasy Contest Tracker - Contest Report</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Contest</th>
            <th>Date</th>
            <th>Winner</th>
            <th>Participants</th>
            <th>Entries</th>
            <th>Invested</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `, 'contest-report');
  }

  exportSingleContestPdf(contest: Contest): void {
    const participantRows = contest.participants
      .map((participant, index) => {
        const result = contest.results?.find((row) => row.playerId === participant.id);
        const winnings = result?.winningAmount ?? 0;
        const invested = participant.entryCount * contest.entryFee;
        const pl = winnings - invested;
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${this.escapeHtml(participant.name)}</td>
            <td>${participant.entryCount}</td>
            <td>${result?.rank ?? '-'}</td>
            <td>Rs ${winnings.toLocaleString()}</td>
            <td>${pl > 0 ? '+' : ''}Rs ${pl.toLocaleString()}</td>
          </tr>
        `;
      })
      .join('');

    this.openPrintWindow(`
      <h1>${this.escapeHtml(contest.name)} - Contest Detail</h1>
      <p>Date: ${new Date(contest.date).toLocaleString()}</p>
      <p>Status: ${contest.isCompleted ? 'Completed' : 'Pending'}</p>
      <p>Entry Fee: Rs ${contest.entryFee}</p>
      <p>Winner: ${contest.winner ? this.escapeHtml(contest.winner) : 'Not set'}</p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Entries</th>
            <th>Rank</th>
            <th>Winnings</th>
            <th>P/L</th>
          </tr>
        </thead>
        <tbody>${participantRows}</tbody>
      </table>
    `, `contest-${contest.id}`);
  }

  exportDashboardPdf(data: {
    generatedAt: Date;
    totalContests: number;
    completedContests: number;
    totalEntries: number;
    totalInvested: number;
    totalWinnings: number;
    groupProfitLoss: number;
    bestPerformingUser: string;
    mostActivePlayer: string;
    mostInactivePlayer: string;
    playerStats: PlayerStats[];
  }): void {
    const rows = data.playerStats
      .map((player, index) => {
        const roi = player.totalInvested ? (player.profitLoss / player.totalInvested) * 100 : 0;
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${this.escapeHtml(player.name)}</td>
            <td>${player.contestsParticipated}</td>
            <td>${player.winnerCount}</td>
            <td>Rs ${player.totalInvested.toLocaleString()}</td>
            <td>Rs ${player.totalWinnings.toLocaleString()}</td>
            <td>${player.profitLoss > 0 ? '+' : ''}Rs ${player.profitLoss.toLocaleString()}</td>
            <td>${roi.toFixed(1)}%</td>
          </tr>
        `;
      })
      .join('');

    this.openPrintWindow(`
      <h1>Fantasy Contest Tracker - Dashboard Report</h1>
      <p>Generated on: ${data.generatedAt.toLocaleString()}</p>
      <h2>Summary</h2>
      <p>Total Contests: ${data.totalContests}</p>
      <p>Completed Contests: ${data.completedContests}</p>
      <p>Total Entries: ${data.totalEntries}</p>
      <p>Total Invested: Rs ${data.totalInvested.toLocaleString()}</p>
      <p>Total Winnings: Rs ${data.totalWinnings.toLocaleString()}</p>
      <p>Group P/L: ${data.groupProfitLoss > 0 ? '+' : ''}Rs ${data.groupProfitLoss.toLocaleString()}</p>
      <h2>Highlights</h2>
      <p>Best Performing User: ${this.escapeHtml(data.bestPerformingUser)}</p>
      <p>Most Active Player: ${this.escapeHtml(data.mostActivePlayer)}</p>
      <p>Most Inactive Player: ${this.escapeHtml(data.mostInactivePlayer)}</p>
      <h2>Player Rankings</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Contests</th>
            <th>Wins</th>
            <th>Invested</th>
            <th>Winnings</th>
            <th>P/L</th>
            <th>ROI</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `, 'dashboard-report');
  }

  private openPrintWindow(content: string, title: string): void {
    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
      <head>
        <title>${this.escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #1a1a1a; }
          h1 { margin: 0 0 10px; }
          p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #d0d7de; padding: 8px; text-align: left; font-size: 13px; }
          th { background: #f5f8fa; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
