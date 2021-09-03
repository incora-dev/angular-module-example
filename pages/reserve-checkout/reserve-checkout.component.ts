import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectorRef, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { PaymentSystem } from '../checkout/checkout.component';
import { phoneCodes } from '../../constants/phoneCode';
import { LocalStorageService } from 'src/app/core/services/local-storage/local-storage.service';
import { AccountService } from 'src/app/core/services/account/account.service';
import * as moment from 'moment';
import { PaymentFormComponent, IStripeResponse } from '../../components/payment-form/payment-form.component';
import { OrderItemComponent } from '../../components/order-item/order-item.component';
import { IBook, IBookHotel } from 'src/app/core/interfaces/book.model';
import { Store } from '@ngrx/store';
import { IAppState } from 'src/app/core/store/store.state';
import * as BookingActions from 'src/app/core/store/booking/booking.actions';
import { Validator } from 'src/app/core/helpers/Validator';
import { Subscription } from 'rxjs';
import { selectBookingLoading, selectErrors } from 'src/app/core/store/booking/booking.selectors';
import { cartActions } from 'src/app/core/store/cart';
import { selectHotels } from 'src/app/core/store/cart/cart.selectors';
import { selectUser } from 'src/app/core/store/account/account.selectors';
import { APP_NAME } from 'src/app/constants/app';
import { ICheckoutInfoStorage } from 'src/app/core/interfaces/checkout.model';
import { phoneNumber } from 'src/app/shared/constants/phone-number';
import {GoogleTagManagerService} from "angular-google-tag-manager";

@Component({
  selector: 'app-reserve-checkout',
  templateUrl: './reserve-checkout.component.html',
  styleUrls: ['../checkout/checkout.component.scss', './reserve-checkout.component.scss']
})
export class ReserveCheckoutComponent implements OnInit, OnDestroy {
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

  reserveInformation: ICheckoutInfoStorage;
  paymentSystemForm: FormGroup;
  contactForm: FormGroup;
  endPayDate: moment.Moment;
  leftDays: number;
  currency;
  bookObject = {
    all_travellers: [],
    question_answers: [],
  } as IBook;
  isValidNameForm = false;
  stripeToken = {} as IStripeResponse;
  loading: boolean;
  hotels: IBookHotel[] = [];
  bookError: string;

  constructor(
    private fb: FormBuilder,
    private localStorage: LocalStorageService,
    private accountService: AccountService,
    private store: Store<IAppState>,
    private cd: ChangeDetectorRef,
    private gtmService: GoogleTagManagerService
  ) {}

  ngOnInit() {
    this.paymentSystemForm = this.fb.group({
      system: [PaymentSystem.CREDIT_CARD]
    });
    this.contactForm = this.fb.group({
      email: new FormControl('', [Validators.required, Validators.email]),
      phonePrefix: new FormControl('CA', Validators.required),
      phoneNumber: new FormControl('', [Validators.required, Validators.pattern(Validator.phoneNumber)]),
      receiveEmail: [false],
      receiveText: [false],
    });
    this.reserveInformation = this.localStorage.getKeyObjectValue('checkoutInformation');
    this.currency = this.accountService.getCurrentCurrency();
    this.endPayDate = moment(this.reserveInformation.date).subtract(2, 'days');
    this.leftDays = moment(this.endPayDate).startOf('day').diff(moment().startOf('day'), 'days');

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

    if (this.reserveInformation.hotelPickup) {
      this.loadHotels();
    }

    this.subscriptions[3] = this.store.select(selectErrors)
    .subscribe(({ bookError }) => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      this.bookError = bookError;
      this.cd.detectChanges();
    });

    // When both "Book Now" and "Reserve Now" buttons were available. Note: uncomment this code to reverse changes.
    // this.pushCartEvent();   // push "cart" event into the GTM data layer
  }

  reserveNow() {
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
        product_code: this.reserveInformation.code,
        travel_date: moment(this.reserveInformation.date).format('YYYY-MM-DD'),
        tour_grade_code: this.reserveInformation.offer.tour_grade_code,
        country: this.phoneCodes.find((code) => this.contactForm.value.phonePrefix === code.value).code,
        receive_text_message: this.contactForm.value.receiveText,
        receive_email_message: true,
        stripe_token: stripeToken.id,
        reserve_now: true,
        price_expected_usd: Number(this.reserveInformation.priceInUSD.slice(1)),
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

  showValidationError() {
    this.email.markAsTouched();
    this.phoneNumber.markAsTouched();
    this.contactFormHTML.nativeElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  onPromoCodeApply = ({ code, discount }) => {
    const savedMoney = this.reserveInformation.offer.price * discount / 100;
    this.promoCode = {
      code,
      discount,
      savedMoney,
      newPrice: this.reserveInformation.offer.price - savedMoney
    };
  }

  get email() { return this.contactForm.get('email'); }
  get phoneNumber() { return this.contactForm.get('phoneNumber'); }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  loadHotels() {
    this.store.dispatch(cartActions.getHotelList.request({
      productCode: this.reserveInformation.code
    }));
  }

  // GTM custom event
  private pushCartEvent() {
    // push a custom event into the GTM data layer
    const gtmTag = {
      event: 'cart',
      price: Number(this.reserveInformation.priceInUSD.slice(1)),
      destination: this.reserveInformation.destination,
      product: this.reserveInformation.code,
      travel_date: moment(this.reserveInformation.date).format('YYYY-MM-DD')
    };
    this.gtmService.pushTag(gtmTag);
  }
}
