import { Component, OnInit, OnDestroy } from '@angular/core';
import { Size } from 'src/app/shared/components/product-item/product-item.component';
import { LocalStorageService } from 'src/app/core/services/local-storage/local-storage.service';
import { getTraveller } from 'src/app/core/helpers/getTraveller';
import { AccountService } from 'src/app/core/services/account/account.service';
import * as moment from 'moment';
import { Store } from '@ngrx/store';
import { IAppState } from 'src/app/core/store/store.state';
import { showAddPasswordModal, hideAddPasswordModal } from 'src/app/core/store/general/general.actions';
import { selectModals, selectCustomerAlsoBought } from 'src/app/core/store/general/general.selectors';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { Subscription } from 'rxjs';
import * as GeneralActions from 'src/app/core/store/general/general.actions';
import { ITour } from 'src/app/core/interfaces/tour.model';
import { ICheckoutBookedStorage } from 'src/app/core/interfaces/checkout.model';
import { Router } from '@angular/router';
import {GoogleTagManagerService} from "angular-google-tag-manager";

@Component({
  selector: 'app-reservation-confirmation',
  templateUrl: './reservation-confirmation.component.html',
  styleUrls: ['./reservation-confirmation.component.scss'],
})
export class ReservationConfirmationComponent implements OnInit, OnDestroy {
  readonly Size = Size;

  booking: ICheckoutBookedStorage;
  isAddPasswordModalOpened = false;
  endPayDate: moment.Moment;
  leftDays = 0;
  subscriptions: Subscription[] = [];
  alsoBoughtTours: ITour[] = [];

  constructor(
    private localeStorage: LocalStorageService,
    private store: Store<IAppState>,
    private auth: AuthService,
    private gtmService: GoogleTagManagerService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.localeStorage.deleteKey('checkoutInformation');
    this.booking = this.localeStorage.getKeyObjectValue('booked');
    this.store.dispatch(GeneralActions.getToursCustomersAlsoBought
      .request({ destinationId: this.booking.booking_items[0].destination_id }));
    if (this.booking.new_user) {
      this.store.dispatch(showAddPasswordModal());
    }

    this.subscriptions[0] = this.store.select(selectModals)
      .subscribe((data) => this.isAddPasswordModalOpened = data.addPasswordModal);

    this.subscriptions[1] = this.store.select(selectCustomerAlsoBought)
        .subscribe((tours) => this.alsoBoughtTours = tours);

    this.endPayDate = moment(this.booking.booking_items[0].travel_date).subtract(2, 'days');
    this.leftDays = moment(this.endPayDate).startOf('day').diff(moment().startOf('day'), 'days');

    this.pushBookingEvent();    // push "booking" event into the GTM data layer
  }

  hideModal() {
    this.store.dispatch(hideAddPasswordModal());
  }

  rejectSettingPassword() {
    const userToken = this.localeStorage.getKeyValue('user_token');
    this.auth.setToken(userToken, 3600);
  }

  toBookingDetails() {
    if (this.auth.isAuth) {
      this.router.navigate(['bookings', this.bookingItem.booking]);
    } else {
      this.router.navigate(['login']);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(el => el && el.unsubscribe());
    if (this.auth.isAuth) {
      this.localeStorage.deleteKey('booked');
    }
  }

  get allTravellers() { return getTraveller(this.booking.booking_items[0].travellers); }
  get bookingItem() { return this.booking.booking_items[0]; }
  get title() { return this.booking.booking_items[0].product_title; }
  get time() { return this.booking.booking_items[0].starting_time; }
  get price() { return this.booking.booking_items[0].price; }
  get bookingDate() { return moment(this.booking.booking_items[0].travel_date).format('YYYY-MM-DD'); }

  // GTM custom event
  private pushBookingEvent() {
    // push a custom event into the GTM data layer
    const gtmTag = {
      event: 'booking',
      price: this.booking.booking_items[0].price,
      destination: this.booking.booking_items[0].destination_id,
      product: this.booking.booking_items[0].product_code,
      travel_date: this.booking.booking_items[0].travel_date
    };
    this.gtmService.pushTag(gtmTag);
  }
}
