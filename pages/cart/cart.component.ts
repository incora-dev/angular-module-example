import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { APP_NAME } from 'src/app/constants/app';
import { phoneNumber } from 'src/app/shared/constants/phone-number';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  readonly phoneNumber = phoneNumber;

  constructor(private title: Title) {
    this.title.setTitle(`Shopping Cart | ${APP_NAME}`);
  }
  items = [{}, {}, {}, {}];
  ngOnInit() {
  }

}
