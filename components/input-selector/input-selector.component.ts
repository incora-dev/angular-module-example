import { Component, OnInit, Input, forwardRef, Output, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-input-selector',
  templateUrl: './input-selector.component.html',
  styleUrls: ['./input-selector.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InputSelectorComponent),
    multi: true,
  }]
})
export class InputSelectorComponent implements OnInit, ControlValueAccessor {
  @Input() options: string[] = [];
  @Input() selectedOption: string;
  @Input() selectDisabled = false;
  @Output() changeOption = new EventEmitter();

  set data(value: { value: number, type: string }) {
    this.privateValue = value;
    if (value.type && value.value) {
      this.propagateChange(`${value.value} ${value.type}`);
    } else {
      this.propagateChange('');
    }
  }
  get data() {
    return this.privateValue;
  }

  private privateValue: any = {};
  constructor() { }

  ngOnInit() {
  }

  propagateChange = (_: any) => {};
  writeValue(value: { value: number, type: string } | string): void {
    if (typeof value === 'string') {
      const [numberValue, type] = value.split(' ');
      this.data = {
        value: Number(numberValue),
        type
      };
    } else {
      this.data = value;
    }
  }
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }
  registerOnTouched(fn: any): void {}

  selectOption = (type: string) => {
    this.writeValue({ value: this.data.value, type });
    this.changeOption.emit(type);
  }

  onInputHandler = (value: string) => {
    this.writeValue({ value: Number(value), type: this.data.type || this.selectedOption });
  }
}
