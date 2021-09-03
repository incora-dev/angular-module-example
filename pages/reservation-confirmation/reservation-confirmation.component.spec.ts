import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationConfirmationComponent } from './reservation-confirmation.component';

describe('ReservationConfirmationComponent', () => {
  let component: ReservationConfirmationComponent;
  let fixture: ComponentFixture<ReservationConfirmationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReservationConfirmationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReservationConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
