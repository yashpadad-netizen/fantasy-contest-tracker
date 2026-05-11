import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ContestService } from '../core/services/contest.service';

import { CreateContestComponent } from './create-contest.component';

describe('CreateContestComponent', () => {
  let component: CreateContestComponent;
  let fixture: ComponentFixture<CreateContestComponent>;
  let contestServiceSpy: jasmine.SpyObj<ContestService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    contestServiceSpy = jasmine.createSpyObj<ContestService>('ContestService', ['addContest']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CreateContestComponent],
      providers: [
        { provide: ContestService, useValue: contestServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateContestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should block submit when participants are below minimum', () => {
    component.contestForm.patchValue({ name: 'C1', date: '2026-05-04T10:00' });
    component.addParticipant();
    component.participants.at(0).patchValue({ name: 'Yash' });

    component.onSubmit();

    expect(component.participantError).toContain('at least');
    expect(contestServiceSpy.addContest).not.toHaveBeenCalled();
  });

  it('should block duplicate participant names', () => {
    component.contestForm.patchValue({ name: 'C1', date: '2026-05-04T10:00' });
    component.addParticipant();
    component.addParticipant();
    component.participants.at(0).patchValue({ name: 'Yash' });
    component.participants.at(1).patchValue({ name: 'yash' });

    component.onSubmit();

    expect(component.participantError).toContain('Duplicate');
    expect(contestServiceSpy.addContest).not.toHaveBeenCalled();
  });
});
