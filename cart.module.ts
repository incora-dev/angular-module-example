import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartComponent } from './pages/cart/cart.component';
import { CartRoutingModule } from './cart-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { CartItemComponent } from './components/cart-item/cart-item.component';
import { EnterPromoCodeComponent } from './components/enter-promo-code/enter-promo-code.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { OrderItemComponent } from './components/order-item/order-item.component';
import { PaymentFormComponent } from './components/payment-form/payment-form.component';
import { OrderDetailItemComponent } from './components/order-detail-item/order-detail-item.component';
import { ReserveCheckoutComponent } from './pages/reserve-checkout/reserve-checkout.component';
import { ReservationConfirmationComponent } from './pages/reservation-confirmation/reservation-confirmation.component';
import { ModalsModule } from '../modals/modals.module';

@NgModule({
  declarations: [
    CartComponent,
    CartItemComponent,
    EnterPromoCodeComponent,
    CheckoutComponent,
    OrderItemComponent,
    PaymentFormComponent,
    OrderDetailItemComponent,
    ReservationConfirmationComponent,
    ReserveCheckoutComponent,
  ],
  imports: [
    CommonModule,
    CartRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    ModalsModule,
  ]
})
export class CartModule { }
