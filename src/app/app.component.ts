import { Component, DestroyRef, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContestService } from './core/services/contest.service';
import { AuthService } from './core/services/auth.service';
import { Contest } from './core/models/models';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgFor, DatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly appName = 'Fantasy Contest Tracker';
  showBackupReminder = false;
  startingSoonContests: Contest[] = [];
  pendingResultContests: Contest[] = [];

  private readonly destroyRef = inject(DestroyRef);

  constructor(private contestService: ContestService, public authService: AuthService) {
    this.contestService.backupReminder$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isVisible) => {
        this.showBackupReminder = isVisible;
      });

    this.contestService.contests$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((contests) => {
        const now = new Date();
        const next24Hours = now.getTime() + 24 * 60 * 60 * 1000;
        this.startingSoonContests = contests
          .filter((contest) => contest.date.getTime() > now.getTime() && contest.date.getTime() <= next24Hours)
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        this.pendingResultContests = contests
          .filter((contest) => contest.date.getTime() <= now.getTime() && !contest.isCompleted)
          .sort((a, b) => b.date.getTime() - a.date.getTime());
      });

  }

  downloadBackup(): void {
    this.contestService.downloadBackupFile();
  }

  dismissBackupReminder(): void {
    this.contestService.dismissBackupReminder();
  }

  logout(): void {
    this.authService.logout();
    this.contestService.clearContests();
  }
}
