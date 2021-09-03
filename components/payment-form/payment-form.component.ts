import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { countries } from 'src/app/constants/countries';
import { months } from './month';
import { environment } from 'src/environments/environment';
import { Validator } from 'src/app/core/helpers/Validator';
import { Normalizer } from 'src/app/core/helpers/Normalizer';
import { Subscription } from 'rxjs';

declare var Stripe;

export interface IStripeResponse {
    id: string;
    object: string;
    card: {
      id: string;
      object: string;
      address_city: string;
      address_country: string;
      address_line1: string;
      address_line1_check: string;
      address_line2: string;
      address_state: string;
      address_zip: string;
      address_zip_check: string;
      brand: string;
      country: string;
      cvc_check: string;
      dynamic_last4: string;
      exp_month: number;
      exp_year: number;
      funding: string;
      last4: string;
      metadata: any;
      name: string;
      tokenization_method: string;
    };
    client_ip: string;
    created: number;
    livemode: boolean;
    type: string;
    used: boolean;
}

@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss']
})
export class PaymentFormComponent implements OnInit {
  @ViewChild('submitBtn', { static: true }) submitBtn: ElementRef;
  @ViewChild('paymentFormHTML', { static: true }) paymentFormHTML: ElementRef;
  @Output() paymentSubmit = new EventEmitter();
  @Output() formChanged = new EventEmitter();

  private readonly subscriptions: Subscription[] = [];

  readonly countries = countries;
  readonly months = months;
  readonly currentYear = new Date().getFullYear();

  availableYears: number[] = [];
  paymentForm: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    Stripe.setPublishableKey(environment.STRIPE_PUBLIC_KEY);

    this.paymentForm = this.fb.group({
      ownerName: ['', [Validators.required, Validators.minLength(3), Validators.pattern(Validator.creditCardOwner)]],
      number: ['', [Validators.required, Validator.creditCardControlValidator]],
      expMonth: ['', Validators.required],
      expYear: ['', Validators.required],
      country: ['CA', Validators.required],
      cvc: ['', [Validators.required, Validators.pattern(Validator.creditCardCVC)]],
      zipcode: ['', [Validators.required]],
    });
    this.availableYears = this.calculateAvailableYears();
    this.subscriptions[0] = this.country.valueChanges
      .subscribe((country) => {
        const { zip } = this.countries.find((e) => e.value === country);
        this.formChanged.emit({ country });
        if (zip) {
          this.paymentForm.addControl('zipcode', new FormControl('', Validators.required));
        } else {
          this.paymentForm.removeControl('zipcode');
        }
      });
  }

  calculateAvailableYears(): number[] {
    const results = [];
    for (let y = this.currentYear; y <= this.currentYear + 19; y++) {
      results.push(y);
    }
    return results;
  }

  onValueChanged = (value: string) => {
    return this.number.patchValue(Normalizer.creditCard(value));
  }

  submitForm = () => {
    this.submitBtn.nativeElement.click();
  }

  onSubmitHandler = () => {
    if (!this.paymentForm.valid) {
      return this.showValidationErrors();
    }
    Stripe.card.createToken({
      name: this.ownerName.value,
      number: this.number.value,
      address_country: this.country.value,
      cvc: this.cvc.value,
      exp_month: this.expMonth.value,
      exp_year: this.expYear.value,
      address_zip: this.zipcode.value
    }, (status: number, stripeResponseHandler: IStripeResponse) => {
      this.paymentSubmit.emit(stripeResponseHandler);
    });
  }

  private showValidationErrors() {
    this.paymentForm.markAllAsTouched();
    this.paymentFormHTML.nativeElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  get ownerName() { return this.paymentForm.get('ownerName'); }
  get number() { return this.paymentForm.get('number'); }
  get expMonth() { return this.paymentForm.get('expMonth'); }
  get expYear() { return this.paymentForm.get('expYear'); }
  get country() { return this.paymentForm.get('country'); }
  get cvc() { return this.paymentForm.get('cvc'); }
  get zipcode() { return this.paymentForm.get('zipcode'); }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

}
