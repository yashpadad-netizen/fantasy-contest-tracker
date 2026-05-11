import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContestService } from '../core/services/contest.service';
import { AuthService } from '../core/services/auth.service';
import { Contest } from '../core/models/models';

@Component({
  selector: 'app-contest-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './contest-list.component.html',
  styleUrl: './contest-list.component.scss'
})
export class ContestListComponent implements OnInit {
  contests: Contest[] = [];
  viewMode: 'cards' | 'table' = 'cards';
  filterFromDate = '';
  filterToDate = '';
  filterPlayer = '';
  filterPlatform = 'all';
  private readonly destroyRef = inject(DestroyRef);

  constructor(private contestService: ContestService, public authService: AuthService) {}

  ngOnInit(): void {
    this.contestService.contests$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((contests) => {
        this.contests = [...contests].sort((a, b) => b.date.getTime() - a.date.getTime());
      });
  }

  get completedContests(): number {
    return this.filteredContests.filter((contest) => contest.isCompleted).length;
  }

  get pendingContests(): number {
    return this.filteredContests.length - this.completedContests;
  }

  get totalInvested(): number {
    return this.filteredContests.reduce((sum, contest) => sum + this.getTotalInvested(contest), 0);
  }

  get filteredContests(): Contest[] {
    const from = this.filterFromDate ? this.startOfDay(this.filterFromDate) : null;
    const to = this.filterToDate ? this.endOfDay(this.filterToDate) : null;
    const player = this.normalize(this.filterPlayer);

    return this.contests.filter((contest) =>
      this.matchesDateRange(contest, from, to) &&
      this.matchesPlayer(contest, player) &&
      this.matchesPlatform(contest)
    );
  }

  get uniquePlayers(): string[] {
    const names = new Set<string>();
    this.contests.forEach((contest) => {
      contest.participants.forEach((player) => names.add(player.name));
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }

  clearFilters(): void {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterPlayer = '';
    this.filterPlatform = 'all';
  }

  setViewMode(mode: 'cards' | 'table'): void {
    this.viewMode = mode;
  }

  getPlatform(contest: Contest): 'my11circle' | 'other' {
    if (contest.my11circleId || contest.my11circleUrl) {
      return 'my11circle';
    }
    return 'other';
  }

  getPlatformLabel(contest: Contest): string {
    return this.getPlatform(contest) === 'my11circle' ? 'My11Circle' : 'Other';
  }

  getTotalEntries(contest: Contest): number {
    return contest.participants.reduce((sum, participant) => sum + participant.entryCount, 0);
  }

  getTotalInvested(contest: Contest): number {
    return contest.participants.reduce(
      (sum, participant) => sum + contest.entryFee * participant.entryCount,
      0
    );
  }

  deleteContest(id: string): void {
    if (!this.authService.isAdmin()) {
      return;
    }
    if (confirm('Delete this contest permanently?')) {
      this.contestService.deleteContest(id);
    }
  }

  exportAllContests(): void {
    const data = JSON.stringify(this.filteredContests, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`);
    element.setAttribute('download', `contests-backup-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  exportAllContestsPdf(): void {
    this.contestService.exportContestsPdf(this.filteredContests);
  }

  importContests(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const raw = loadEvent.target?.result as string;
        const contests = JSON.parse(raw);

        if (!Array.isArray(contests)) {
          throw new Error('Invalid import payload.');
        }

        const imported = contests.map((contest: Contest, index: number) => ({
          ...contest,
          id: contest.id || `${Date.now()}-${index}`,
          date: new Date(contest.date),
          participants: contest.participants ?? [],
          results: contest.results ?? [],
          isCompleted: contest.isCompleted ?? false
        }));

        this.contestService.addManyContests(imported);
        alert(`Imported ${imported.length} contests.`);
      } catch {
        alert('Could not import contests. Check file format and try again.');
      } finally {
        input.value = '';
      }
    };

    reader.readAsText(file);
  }

  private normalize(value: string): string {
    return value.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private startOfDay(value: string): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private endOfDay(value: string): Date {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private matchesDateRange(contest: Contest, from: Date | null, to: Date | null): boolean {
    if (from && contest.date < from) {
      return false;
    }
    if (to && contest.date > to) {
      return false;
    }
    return true;
  }

  private matchesPlayer(contest: Contest, normalizedPlayer: string): boolean {
    if (!normalizedPlayer) {
      return true;
    }
    return contest.participants.some(
      (participant) => this.normalize(participant.name) === normalizedPlayer
    );
  }

  private matchesPlatform(contest: Contest): boolean {
    if (this.filterPlatform === 'all') {
      return true;
    }
    return this.getPlatform(contest) === this.filterPlatform;
  }
}
