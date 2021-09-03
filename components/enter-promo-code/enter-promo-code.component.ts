import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BookingService } from 'src/app/core/services/booking/booking.service';

@Component({
  selector: 'app-enter-promo-code',
  templateUrl: './enter-promo-code.component.html',
  styleUrls: ['./enter-promo-code.component.scss']
})
export class EnterPromoCodeComponent implements OnInit {
  @Input() productCode = '';
  @Output() apply = new EventEmitter();

  form: FormGroup;
  opened = false;
  error = false;

  constructor(private fb: FormBuilder, public bookingService: BookingService) { }

  ngOnInit() {
    this.form = this.fb.group({
      code: ['', Validators.required]
    });
  }

  onSubmit = () => {
    this.bookingService.checkCoupon(this.productCode, this.code.value)
      .subscribe(({ discount, promocode }) => {
        if (discount >= 0) {
          this.opened = false;
          this.form.reset();
          this.apply.emit({
            discount,
            code: promocode
          });
        } else {
          this.code.setErrors({ invalid: true });
        }
      },
      () => {
        this.code.setErrors({ invalid: true });
      });
  }

  public get code() {
    return this.form.get('code');
  }

}
