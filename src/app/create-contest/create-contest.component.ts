import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ContestService } from '../core/services/contest.service';
import { Contest, Player } from '../core/models/models';

@Component({
  selector: 'app-create-contest',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-contest.component.html',
  styleUrl: './create-contest.component.scss'
})
export class CreateContestComponent {
  readonly fixedEntryFee = 20;
  readonly minParticipants = 2;

  contestForm: FormGroup;
  linkCaptureMessage = '';
  participantError = '';

  constructor(
    private fb: FormBuilder,
    private contestService: ContestService,
    private router: Router
  ) {
    this.contestForm = this.fb.group({
      name: ['', Validators.required],
      date: ['', Validators.required],
      my11circleId: [''],
      my11circleUrl: [''],
      participants: this.fb.array([])
    });
  }

  get participants(): FormArray {
    return this.contestForm.get('participants') as FormArray;
  }

  get prizePool(): number {
    return this.participants.length * this.fixedEntryFee;
  }

  get isCreateDisabled(): boolean {
    return this.contestForm.invalid || this.participants.length < this.minParticipants;
  }

  addParticipant(): void {
    const participantForm = this.fb.group({
      name: ['', Validators.required]
    });
    this.participants.push(participantForm);
    this.participantError = '';
  }

  removeParticipant(index: number): void {
    this.participants.removeAt(index);
    this.participantError = '';
  }

  captureContestLink(): void {
    const urlValue = (this.contestForm.get('my11circleUrl')?.value || '').toString().trim();
    if (!urlValue) {
      this.linkCaptureMessage = '';
      return;
    }

    const extractedId = this.extractContestId(urlValue);
    if (extractedId) {
      this.contestForm.patchValue({ my11circleId: extractedId });
      this.linkCaptureMessage = `Contest ID auto-captured: ${extractedId}`;
    } else {
      this.linkCaptureMessage = 'Could not find a contest ID in this URL. You can still enter it manually.';
    }
  }

  extractContestId(input: string): string | null {
    try {
      const parsed = new URL(input);
      const candidates = ['contestId', 'contest_id', 'id', 'cid'];

      for (const key of candidates) {
        const value = parsed.searchParams.get(key);
        if (value) {
          return value;
        }
      }

      const pathParts = parsed.pathname.split('/').filter(Boolean);
      for (let i = pathParts.length - 1; i >= 0; i--) {
        if (/^[a-zA-Z0-9_-]{5,}$/.test(pathParts[i])) {
          return pathParts[i];
        }
      }
    } catch {
      // Fallback to regex for non-standard links.
    }

    const rawMatch = input.match(/(?:contest(?:Id|_id)?[=/:\-]|\b)([a-zA-Z0-9_-]{5,})/i);
    return rawMatch?.[1] || null;
  }

  onSubmit(): void {
    if (this.contestForm.invalid) {
      this.contestForm.markAllAsTouched();
      return;
    }

    if (this.participants.length < this.minParticipants) {
      this.participantError = `Please add at least ${this.minParticipants} participants.`;
      return;
    }

    const formValue = this.contestForm.value;
    const participantNames = formValue.participants.map((p: any) => p.name?.toString().trim()).filter(Boolean);
    const uniqueNames = new Set(participantNames.map((name: string) => name.toLowerCase()));
    if (participantNames.length !== uniqueNames.size) {
      this.participantError = 'Duplicate participant names are not allowed.';
      return;
    }
    this.participantError = '';
    const contestId = Date.now().toString();

    const participants: Player[] = formValue.participants.map((p: any, index: number) => ({
      id: `player_${index + 1}`,
      name: p.name,
      teamName: '',
      entryCount: 1
    }));

    const contest: Contest = {
      id: contestId,
      name: formValue.name,
      date: new Date(formValue.date),
      participants: participants,
      entryFee: this.fixedEntryFee,
      my11circleId: formValue.my11circleId || undefined,
      my11circleUrl: formValue.my11circleUrl || undefined,
      prizePool: this.prizePool,
      isCompleted: false,
      results: []
    };

    this.contestService.addContest(contest);
    this.router.navigate(['/contests', contestId]);
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}
