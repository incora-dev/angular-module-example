import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { phoneCodes } from '../../constants/phoneCode';
import { LocalStorageService } from 'src/app/core/services/local-storage/local-storage.service';
import { AccountService } from 'src/app/core/services/account/account.service';
import * as moment from 'moment';
import { Store } from '@ngrx/store';
import { IAppState } from 'src/app/core/store/store.state';
import * as BookingActions from 'src/app/core/store/booking/booking.actions';
import { IBook, IBookHotel } from 'src/app/core/interfaces/book.model';
import { PaymentFormComponent, IStripeResponse } from '../../components/payment-form/payment-form.component';
import { OrderItemComponent } from '../../components/order-item/order-item.component';
import { cartActions } from 'src/app/core/store/cart';
import { Validator } from 'src/app/core/helpers/Validator';
import { selectHotels } from 'src/app/core/store/cart/cart.selectors';
import { selectBookingLoading, selectErrors } from 'src/app/core/store/booking/booking.selectors';
import { Subscription } from 'rxjs';
import { APP_NAME } from 'src/app/constants/app';
import { ICheckoutInfoStorage } from 'src/app/core/interfaces/checkout.model';
import { selectUser } from 'src/app/core/store/account/account.selectors';
import { phoneNumber } from 'src/app/shared/constants/phone-number';
import {GoogleTagManagerService} from "angular-google-tag-manager";


export enum PaymentSystem {
  CREDIT_CARD = 'credit',
  PAY_PAL = 'payPal',
  GOOGLE_PAY = 'gPay'
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  @ViewChild('paymentForm', { static: true }) paymentForm: PaymentFormComponent;
  @ViewChild('orderItem', { static: true }) orderItemHTML: OrderItemComponent;
  @ViewChild('contactFormHTML', { static: true }) contactFormHTML: ElementRef;
  public readonly PaymentSystem = PaymentSystem;
  public readonly phoneCodes = phoneCodes;
  readonly APP_NAME = APP_NAME;
  readonly subscriptions: Subscription[] = [];
  readonly phone = phoneNumber;

  promoCode = {
    code: '',
    discount: 0,
    savedMoney: 0,
    newPrice: 0
  };

  paymentSystemForm: FormGroup;
  contactForm: FormGroup;
  information = {} as ICheckoutInfoStorage;
  currency;
  bookObject = {
    all_travellers: [],
    question_answers: [],
  } as IBook;
  hotels: IBookHotel[] = [];
  isValidNameForm = false;
  loading = false;
  bookError: string;

  constructor(
    private fb: FormBuilder,
    private localStorage: LocalStorageService,
    private account: AccountService,
    private store: Store<IAppState>,
    private cd: ChangeDetectorRef,
    private gtmService: GoogleTagManagerService
  ) {
    this.information = JSON.parse(this.localStorage.getKeyValue('checkoutInformation'));
    this.currency = this.account.getCurrentCurrency();

    if (this.information.hotelPickup) {
      this.loadHotels();
    }
  }

  ngOnInit() {
    if (this.information.hotelPickup) {
      this.loadHotels();
    }
    this.paymentSystemForm = this.fb.group({
      system: [PaymentSystem.CREDIT_CARD]
    });
    this.contactForm = this.fb.group({
      email: new FormControl('', [Validators.required, Validators.email]),
      phonePrefix: new FormControl('CA', Validators.required),
      phoneNumber: new FormControl('', [Validators.required, Validators.pattern(Validator.phoneNumber)]),
      receiveText: [false],
      receiveEmail: [false]
    });

    this.subscriptions[0] = this.store.select(selectBookingLoading)
      .subscribe((loading) => {
        this.loading = loading;
        this.cd.detectChanges();
    });
    this.subscriptions[1] = this.store.select(selectHotels)
      .subscribe((hotels) => this.hotels = hotels);

    this.subscriptions[2] = this.store.select(selectUser)
      .subscribe((user) => {
        if (user.email && this.email.value !== user.email) {
          this.email.setValue(user.email);
          this.email.disable();
        }
      });

    this.subscriptions[3] = this.store.select(selectErrors)
      .subscribe(({ bookError }) => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        this.bookError = bookError;
        this.cd.detectChanges();
      });

    this.pushCartEvent();   // push "cart" event into the GTM data layer
  }

  bookTour() {
    this.orderItemHTML.submitForm();
  }

  paymentFormUpdated = ({ country }) => {
    this.contactForm.patchValue({ phonePrefix: country });
  }

  onOrderItemSubmit = (e) => {
    this.isValidNameForm = e.isValid;
    this.bookObject.all_travellers = e.data.travellers;
    this.bookObject.special_requirements = e.data.specialRequirements.trim() || undefined;
    this.bookObject.pickup_point = e.data.pickupDetailsInput;
    this.bookObject.question_answers = e.data.questions;
    this.bookObject.language_option = e.data.language || 'en';
    this.paymentForm.submitForm();
  }

  paymentSubmit = (stripeToken: IStripeResponse) => {
    if (stripeToken.id && this.isValidNameForm && this.contactForm.valid) {
      this.bookObject = {
        ...this.bookObject,
        email: this.email.value,
        phone_country_code: this.phoneCodes.find((code) => this.contactForm.value.phonePrefix === code.value).name,
        cell_phone: this.phoneNumber.value,
        currency_code: 'USD',
        product_code: this.information.code,
        travel_date: moment(this.information.date).format('YYYY-MM-DD'),
        tour_grade_code: this.information.offer.tour_grade_code,
        country: this.phoneCodes.find((code) => this.contactForm.value.phonePrefix === code.value).code,
        receive_text_message: this.contactForm.value.receiveText,
        receive_email_message: this.contactForm.value.receiveEmail,
        stripe_token: stripeToken.id,
        reserve_now: false,
        price_expected_usd: Number(this.information.priceInUSD.slice(1)),
        promocode: this.promoCode.code || undefined,
      } as IBook;
      const gclid = this.localStorage.getKeyValue('gclid');
      const fbclid = this.localStorage.getKeyValue('fbclid');
      const msclkid = this.localStorage.getKeyValue('msclkid');
      if (gclid) { this.bookObject.gclid = gclid; }
      if (fbclid) { this.bookObject.fbclid = fbclid; }
      if (msclkid) { this.bookObject.msclkid = msclkid; }

      return this.store.dispatch(BookingActions.bookTour.request({ bookObject: this.bookObject }));
    }
    this.showValidationError();
  }

  loadHotels() {
    this.store.dispatch(cartActions.getHotelList.request({
      productCode: this.information.code
    }));
  }

  showValidationError() {
    this.email.markAsTouched();
    this.phoneNumber.markAsTouched();
    this.contactFormHTML.nativeElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  onPromoCodeApply = ({ code, discount }) => {
    this.promoCode = code;
    const savedMoney = this.information.offer.price * discount / 100;
    this.promoCode = {
      code,
      discount,
      savedMoney,
      newPrice: this.information.offer.price - savedMoney
    };
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(el => el && el.unsubscribe());
  }

  get email() { return this.contactForm.get('email'); }
  get phoneNumber() { return this.contactForm.get('phoneNumber'); }
  get paymentSystem(): PaymentSystem { return this.paymentSystemForm.value.system; }

  // GTM custom event
  private pushCartEvent() {
    // push a custom event into the GTM data layer
    const gtmTag = {
      event: 'cart',
      price: Number(this.information.priceInUSD.slice(1)),
      destination: this.information.destination,
      product: this.information.code,
      travel_date: moment(this.information.date).format('YYYY-MM-DD')
    };
    this.gtmService.pushTag(gtmTag);
  }
}
