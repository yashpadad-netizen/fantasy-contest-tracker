import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ContestListComponent } from './contest-list.component';

describe('ContestListComponent', () => {
  let component: ContestListComponent;
  let fixture: ComponentFixture<ContestListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContestListComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContestListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
