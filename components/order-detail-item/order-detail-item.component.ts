import { Component } from '@angular/core';
import { LocalStorageService } from 'src/app/core/services/local-storage/local-storage.service';
import { AccountService } from 'src/app/core/services/account/account.service';
import * as moment from 'moment';
import { ICheckoutInfoStorage } from 'src/app/core/interfaces/checkout.model';

@Component({
  selector: 'app-order-detail-item',
  templateUrl: './order-detail-item.component.html',
  styleUrls: ['./order-detail-item.component.scss']
})
export class OrderDetailItemComponent {
  checkoutInformation: ICheckoutInfoStorage;
  currency;
  cancellationDate: string;

  constructor(
    private localStorage: LocalStorageService,
    private account: AccountService,
    ) {
      this.checkoutInformation = this.localStorage.getKeyObjectValue('checkoutInformation');
      this.currency = this.account.getCurrentCurrency();
      if (this.checkoutInformation.cancellation_date) {
        this.cancellationDate =
          moment(this.checkoutInformation.date).subtract(this.checkoutInformation.cancellation_date.day_range_min, 'days')
          .format('MMM D, YYYY');
      }
    }
}
