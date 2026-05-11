import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContestService } from '../core/services/contest.service';
import { CalculationsService } from '../core/services/calculations.service';
import { AuthService } from '../core/services/auth.service';
import { Contest, Result } from '../core/models/models';

@Component({
  selector: 'app-contest-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contest-detail.component.html',
  styleUrl: './contest-detail.component.scss'
})
export class ContestDetailComponent implements OnInit {
  readonly fixedEntryFee = 20;

  contest: Contest | null = null;
  winnerForm: FormGroup;
  contestSummary: {
    totalParticipants: number;
    totalEntries: number;
    prizePool: number;
    isCompleted: boolean;
  } | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contestService: ContestService,
    private calculationsService: CalculationsService,
    public authService: AuthService,
    private fb: FormBuilder
  ) {
    this.winnerForm = this.fb.group({
      winner: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.contestService.contests$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((contests) => {
        this.contest = contests.find((contest) => contest.id === id) || null;
        if (!this.contest) {
          return;
        }

        this.contestSummary = this.calculationsService.getContestSummary(this.contest);
        const winnerFromResults = this.getWinnerFromResults();
        this.winnerForm.patchValue({ winner: this.contest.winner || winnerFromResults || '' });
      });
  }

  getWinnerFromResults(): string | undefined {
    if (!this.contest?.results?.length) {
      return undefined;
    }
    const winnerResult = this.contest.results.find(result => result.rank === 1);
    if (!winnerResult) {
      return undefined;
    }
    return this.contest.participants.find(p => p.id === winnerResult.playerId)?.name;
  }

  get resultCount(): number {
    return this.contest?.results?.length ?? 0;
  }

  getResultForPlayer(playerId: string): Result | undefined {
    return this.contest?.results?.find((result) => result.playerId === playerId);
  }

  getPlayerProfitLoss(playerId: string): number {
    if (!this.contest) {
      return 0;
    }

    const participant = this.contest.participants.find((player) => player.id === playerId);
    const result = this.contest.results?.find((entry) => entry.playerId === playerId);

    if (!participant || !result) {
      return 0;
    }

    return result.winningAmount - this.contest.entryFee * participant.entryCount;
  }

  onWinnerSubmit(): void {
    if (!this.contest || !this.authService.isAdmin()) {
      return;
    }

    const selectedWinner = this.winnerForm.value.winner?.toString().trim();
    const updatedContest = {
      ...this.contest,
      winner: selectedWinner || undefined,
      entryFee: this.fixedEntryFee,
      prizePool: this.contest.participants.length * this.fixedEntryFee
    };
    this.contestService.updateContest(updatedContest);
  }

  openMy11Circle(): void {
    if (this.contest?.my11circleUrl) {
      window.open(this.contest.my11circleUrl, '_blank');
    }
  }

  openResultsEntry(): void {
    if (this.contest) {
      this.router.navigate(['/contests', this.contest.id, 'results']);
    }
  }

  exportContest(): void {
    if (!this.contest) {
      return;
    }

    const data = JSON.stringify(this.contest, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`);
    element.setAttribute('download', `${this.contest.name}-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  exportContestPdf(): void {
    if (!this.contest) {
      return;
    }
    this.contestService.exportSingleContestPdf(this.contest);
  }

  deleteContest(): void {
    if (!this.contest || !this.authService.isAdmin()) {
      return;
    }
    if (confirm('Are you sure you want to delete this contest?')) {
      this.contestService.deleteContest(this.contest.id);
      this.router.navigate(['/contests']);
    }
  }

  goBack(): void {
    this.router.navigate(['/contests']);
  }
}
