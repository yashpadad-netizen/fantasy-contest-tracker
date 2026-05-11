import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContestService } from '../core/services/contest.service';
import { Contest, Result } from '../core/models/models';

type ImportedResult = {
  playerId?: string;
  playerName?: string;
  rank?: number;
  winningAmount?: number;
};

@Component({
  selector: 'app-contest-results',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contest-results.component.html',
  styleUrl: './contest-results.component.scss'
})
export class ContestResultsComponent implements OnInit {
  contest: Contest | null = null;
  resultsForm: FormGroup;
  importMessage = '';
  ocrMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contestService: ContestService,
    private fb: FormBuilder
  ) {
    this.resultsForm = this.fb.group({
      results: this.fb.array([])
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.contestService.contests$.subscribe((contests) => {
      this.contest = contests.find((contest) => contest.id === id) || null;
      if (!this.contest) {
        return;
      }

      this.setupResultsForm();
    });
  }

  get results(): FormArray {
    return this.resultsForm.get('results') as FormArray;
  }

  setupResultsForm(): void {
    if (!this.contest) {
      return;
    }

    const resultArray = this.fb.array(
      this.contest.participants.map((participant) => {
        const existingResult = this.contest?.results?.find((result) => result.playerId === participant.id);

        return this.fb.group({
          playerId: [participant.id],
          playerName: [participant.name],
          rank: [existingResult?.rank ?? '', [Validators.required, Validators.min(1)]],
          winningAmount: [existingResult?.winningAmount ?? 0, [Validators.required, Validators.min(0)]]
        });
      })
    );

    this.resultsForm.setControl('results', resultArray);
  }

  importResultsFromFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const content = (loadEvent.target?.result || '').toString();
      const isJson = file.name.toLowerCase().endsWith('.json');

      const importedRows = isJson ? this.parseImportedResultsJson(content) : this.parseImportedResultsCsv(content);
      const matchCount = this.applyImportedResults(importedRows);

      this.importMessage = `Imported ${matchCount} participant result rows from ${file.name}.`;
      input.value = '';
    };

    reader.readAsText(file);
  }

  async importResultsFromScreenshot(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.ocrMessage = 'Reading screenshot and extracting text...';

    try {
      const tesseract = await import('tesseract.js');
      const recognized = await tesseract.recognize(file, 'eng');
      const extractedRows = this.parseImportedResultsCsv(recognized.data.text);
      const matched = this.applyImportedResults(extractedRows);

      this.ocrMessage = `OCR finished. Auto-filled ${matched} participant rows.`;
    } catch {
      this.ocrMessage = 'OCR failed. Please use JSON/CSV import or manual entry.';
    } finally {
      input.value = '';
    }
  }

  downloadResultsTemplate(): void {
    const template = [
      'playerName,rank,winningAmount',
      'Yash,1,3200',
      'Rahul,2,1800',
      'Amit,3,1200'
    ].join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(template)}`);
    element.setAttribute('download', 'contest-results-template.csv');
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  parseImportedResultsJson(content: string): ImportedResult[] {
    try {
      const payload = JSON.parse(content);
      const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [];

      return rows
        .map((row: any) => ({
          playerId: row.playerId?.toString(),
          playerName: row.playerName?.toString() || row.name?.toString(),
          rank: Number(row.rank),
          winningAmount: Number(row.winningAmount)
        }))
        .filter((row: ImportedResult) => Number.isFinite(row.rank) || Number.isFinite(row.winningAmount));
    } catch {
      return [];
    }
  }

  parseImportedResultsCsv(content: string): ImportedResult[] {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      return [];
    }

    const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes('|') ? '|' : ',';

    const parsedRows: ImportedResult[] = [];

    lines.forEach((line, index) => {
      const cols = line.split(delimiter).map((item) => item.trim());
      if (cols.length < 3) {
        return;
      }

      if (index === 0 && /name|player/i.test(cols[0]) && /rank/i.test(cols[1])) {
        return;
      }

      const nameFirstFormat = /[a-zA-Z]/.test(cols[0]);
      const row: ImportedResult = nameFirstFormat
        ? {
            playerName: cols[0],
            rank: Number(cols[1]),
            winningAmount: Number(cols[2])
          }
        : {
            playerId: cols[0],
            rank: Number(cols[1]),
            winningAmount: Number(cols[2]),
            playerName: cols[3]
          };

      if (
        (Number.isFinite(row.rank) || Number.isFinite(row.winningAmount)) &&
        (Boolean(row.playerId) || Boolean(row.playerName))
      ) {
        parsedRows.push(row);
      }
    });

    return parsedRows;
  }

  applyImportedResults(importedRows: ImportedResult[]): number {
    if (!importedRows.length) {
      return 0;
    }

    let matched = 0;

    this.results.controls.forEach((control) => {
      const playerId = (control.get('playerId')?.value || '').toString();
      const playerName = (control.get('playerName')?.value || '').toString();

      const incoming = importedRows.find((row) => {
        if (row.playerId && row.playerId === playerId) {
          return true;
        }

        if (row.playerName && this.normalizePlayerName(row.playerName) === this.normalizePlayerName(playerName)) {
          return true;
        }

        return false;
      });

      if (!incoming) {
        return;
      }

      const patch: { rank?: number; winningAmount?: number } = {};
      if (Number.isFinite(incoming.rank)) {
        patch.rank = Number(incoming.rank);
      }
      if (Number.isFinite(incoming.winningAmount)) {
        patch.winningAmount = Number(incoming.winningAmount);
      }

      control.patchValue(patch);
      matched++;
    });

    return matched;
  }

  normalizePlayerName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  onSubmit(): void {
    if (this.resultsForm.invalid || !this.contest) {
      this.resultsForm.markAllAsTouched();
      return;
    }

    const results: Result[] = this.results.value.map((row: any) => ({
      playerId: row.playerId,
      rank: Number(row.rank),
      winningAmount: Number(row.winningAmount)
    }));

    // Find the winner (rank 1)
    const winnerResult = results.find(result => result.rank === 1);
    const winnerName = winnerResult ? this.contest.participants.find(p => p.id === winnerResult.playerId)?.name : undefined;

    const updatedContest: Contest = {
      ...this.contest,
      results,
      winner: winnerName,
      isCompleted: true
    };

    this.contestService.updateContest(updatedContest);
    this.router.navigate(['/contests', this.contest.id]);
  }

  getProfitLoss(index: number): number {
    if (!this.contest) {
      return 0;
    }

    const participant = this.contest.participants[index];
    const result = this.results.at(index).value;
    const invested = this.contest.entryFee * participant.entryCount;
    const winnings = Number(result.winningAmount || 0);
    return winnings - invested;
  }

  getTotalInvested(): number {
    if (!this.contest) {
      return 0;
    }

    return this.contest.participants.reduce(
      (sum, participant) => sum + this.contest!.entryFee * participant.entryCount,
      0
    );
  }

  getTotalWinnings(): number {
    return this.results.value.reduce((sum: number, row: any) => sum + Number(row.winningAmount || 0), 0);
  }

  goBack(): void {
    this.router.navigate(['/contests', this.contest?.id]);
  }
}
