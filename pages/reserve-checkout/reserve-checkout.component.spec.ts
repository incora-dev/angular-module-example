import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReserveCheckoutComponent } from './reserve-checkout.component';

describe('ReserveCheckoutComponent', () => {
  let component: ReserveCheckoutComponent;
  let fixture: ComponentFixture<ReserveCheckoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReserveCheckoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReserveCheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
