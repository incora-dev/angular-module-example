import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnterPromoCodeComponent } from './enter-promo-code.component';

describe('EnterPromoCodeComponent', () => {
  let component: EnterPromoCodeComponent;
  let fixture: ComponentFixture<EnterPromoCodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnterPromoCodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnterPromoCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
