import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route, RouterModule } from '@angular/router';
import { CartComponent } from './pages/cart/cart.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { ReserveCheckoutComponent } from './pages/reserve-checkout/reserve-checkout.component';
import { ReservationConfirmationComponent } from './pages/reservation-confirmation/reservation-confirmation.component';
import { BookingGuard } from 'src/app/core/guards/booking/booking.guard';
import { ConfirmationGuard } from 'src/app/core/guards/confirmation/confirmation.guard';

const routes: Route[] = [{
    path: '',
    component: CartComponent
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
  },
  {
    path: 'reserve/checkout',
    component: ReserveCheckoutComponent,
  },
  {
    path: 'confirmation',
    component: ReservationConfirmationComponent,
    canActivate: [ConfirmationGuard]
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class CartRoutingModule { }
