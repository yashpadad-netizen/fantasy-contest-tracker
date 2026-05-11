import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Contest } from '../core/models/models';
import { ContestService } from '../core/services/contest.service';

import { ContestResultsComponent } from './contest-results.component';

describe('ContestResultsComponent', () => {
  let component: ContestResultsComponent;
  let fixture: ComponentFixture<ContestResultsComponent>;
  let contestsSubject: BehaviorSubject<Contest[]>;
  let contestServiceMock: {
    contests$: BehaviorSubject<Contest[]>;
    updateContest: jasmine.Spy;
  };
  let routerSpy: jasmine.SpyObj<Router>;

  const sampleContest: Contest = {
    id: 'contest-1',
    name: 'Sample',
    date: new Date('2026-05-04'),
    participants: [
      { id: 'p1', name: 'Yash', teamName: '', entryCount: 1 },
      { id: 'p2', name: 'Rahul', teamName: '', entryCount: 1 }
    ],
    entryFee: 20,
    results: [],
    isCompleted: false
  };

  beforeEach(async () => {
    contestsSubject = new BehaviorSubject<Contest[]>([sampleContest]);
    contestServiceMock = {
      contests$: contestsSubject,
      updateContest: jasmine.createSpy('updateContest')
    };
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ContestResultsComponent],
      providers: [
        { provide: ContestService, useValue: contestServiceMock },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'contest-1' } } }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContestResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should flag duplicate ranks as invalid', () => {
    component.results.at(0).patchValue({ rank: 1, winningAmount: 100 });
    component.results.at(1).patchValue({ rank: 1, winningAmount: 50 });
    component.resultsForm.updateValueAndValidity();

    expect(component.resultsForm.errors?.['duplicateRanks']).toBeTrue();
  });

  it('should require exactly one winner rank', () => {
    component.results.at(0).patchValue({ rank: 2, winningAmount: 100 });
    component.results.at(1).patchValue({ rank: 3, winningAmount: 50 });
    component.resultsForm.updateValueAndValidity();

    expect(component.resultsForm.errors?.['invalidWinnerCount']).toBeTrue();
  });
});
