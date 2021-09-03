import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { LocalStorageService } from 'src/app/core/services/local-storage/local-storage.service';
import { Title } from '@angular/platform-browser';
import { IBookHotel } from 'src/app/core/interfaces/book.model';
import { APP_NAME } from 'src/app/constants/app';
import { ICheckoutInfoStorage, ICheckoutAgeBandItem } from 'src/app/core/interfaces/checkout.model';
import { IBookQuestion } from 'src/app/core/interfaces/tourInfo';
import { ITraveller } from 'src/app/core/interfaces/booking.model';
import { NUMBERS } from './numbers';

export const personalQuestion = [0, 1, 2, 3, 4, 5, 23];

@Component({
  selector: 'app-order-item',
  templateUrl: './order-item.component.html',
  styleUrls: ['./order-item.component.scss']
})
export class OrderItemComponent implements OnInit {
  @Input() hotels: IBookHotel[] = [];
  @ViewChild('form', { static: true }) travellersFormHTML: ElementRef;
  @ViewChild('submitBtn', { static: true }) submitBtn: ElementRef;
  @Output() formSubmitted = new EventEmitter();

  readonly APP_NAME = APP_NAME;
  travellerDetailForm: FormGroup;
  information = {} as ICheckoutInfoStorage;
  generalQuestions: IBookQuestion[] = [];
  personalQuestions: IBookQuestion[] = [];
  travellersTitleGroup: string[] = [];
  langs: any[] = [];
  questionOptions: any = {
    weights_passengerWeights: 'lb',
    heights_passengerHeights: 'ft/in'
  };
  showPickupPointInput = false;

  constructor(
    private fb: FormBuilder,
    private localStorage: LocalStorageService,
    private title: Title,
  ) {
    this.title.setTitle(`Checkout | ${APP_NAME}`);
    this.information = this.localStorage.getKeyObjectValue('checkoutInformation');
    this.generalQuestions = this.information.bookingQuestions
      .filter((q) => !personalQuestion.includes(q.question_id));
    this.personalQuestions = this.information.bookingQuestions
      .filter((q) => personalQuestion.includes(q.question_id));
    this.travellerDetailForm = this.fb.group({
      travellers: this.fb.array(this.generateTravellersForm(this.information.tourAgeBand)),
      questions: this.generateQuestionForm(),
      specialRequirements: [''],
    });
  }

  ngOnInit() {
    if (this.information.hotelPickup) {
      this.addLocationPickUpField();
    }
    if (this.information.offer.lang_services) {
      this.langs = Object.keys(this.information.offer.lang_services)
        .map((key) => ({
          label: this.information.offer.lang_services[key],
          value: key
        })
      );
    }
    if (this.langs.length) {
      this.addLanguageField();
    }
  }

  addLocationPickUpField() {
    this.travellerDetailForm.addControl('locationPickup', this.fb.control(null));
    this.travellerDetailForm.addControl('hotel', this.fb.control(null));
    this.hotelField.valueChanges.subscribe((value) => {
      if (value?.id === 'none') {
        this.showPickupPointInput = true;
        this.travellerDetailForm.addControl('pickupDetailsInput', this.fb.control(null));
        return;
      }
      this.showPickupPointInput = false;
    });

    this.locationPickUp.valueChanges.subscribe((hotelStatus) => {
      if (hotelStatus === 'no-hotel') {
        this.hotelField.setValidators([]);
        this.hotelField.markAsUntouched();
        this.travellerDetailForm.patchValue({ hotel: null });
      } else {
        this.hotelField.markAsTouched();
        this.hotelField.setValidators([Validators.required]);
        this.travellerDetailForm.patchValue({ hotel: this.hotelField.value });
      }
    });
  }

  addLanguageField() {
    this.travellerDetailForm.addControl('language', this.fb.control(null, Validators.required));
  }

  onSubmitHandler() {
    const { value } = this.travellerDetailForm;
    const travellers = value.travellers.map((el, ind) => ({
      ...el,
      questions: this.personalQuestions.map((item) => ({
        booking_question_id: item.id,
        answer: value.travellers[ind].questions[item.string_question_id]
      }))
    }));
    const formattedQuestion = this.generalQuestions.map((q) => ({
      booking_question_id: q.id,
      answer: this.questions.controls[q.string_question_id].value
    }));
    if (!this.information.allTravellerNamesRequired) {
      this.information.tourAgeBand
        .forEach((el, i) => {
          Array(el.count).fill(0)
            .forEach((_, ind) => {
              if (i === 0 && ind === 0) { return; }
              travellers.push({
                first_name: 'Passenger',
                surname: NUMBERS[travellers.length],
                band_id: el.bandId,
                lead_traveller: false,
                title: 'Mr',
                questions: travellers[0].questions.map((q) => ({ ...q, answer: ''}))
              } as ITraveller);
            });
          });
    }
    this.formSubmitted.emit({
      data: {
        ...this.travellerDetailForm.value,
        travellers,
        questions: formattedQuestion
      },
      isValid: this.travellerDetailForm.valid
    });
  }

  showValidationError() {
      if (this.generalQuestions) {
        Object.keys(this.questions.controls).forEach((e) => this.questions.controls[e].markAsTouched());
      }
      this.travellers.controls.forEach((element: FormGroup, index: number) => {
        element.controls.first_name.markAsTouched();
        element.controls.surname.markAsTouched();
        if (this.personalQuestions) {
          this.personalQuestions.forEach((el) => {
            this.getQuestionField(index, el.string_question_id).markAsTouched();
          });
        }
      });
      if (this.langs.length) {
        this.langField.markAsTouched();
      }
      this.travellersFormHTML.nativeElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  submitForm() {
    if (this.travellerDetailForm.valid) {
      this.submitBtn.nativeElement.click();
    } else {
      this.showValidationError();
    }
  }

  onChangeOptionHandler = (option: string, type: string) => {
    this.questionOptions[type] = option;
  }

  private generateQuestionForm() {
    const questionFields = {};

    this.generalQuestions
      .forEach(({ string_question_id }) => {
        questionFields[string_question_id] = this.fb.control('', [Validators.required]);
      });
    return this.fb.group(questionFields);
  }

  private generateTravellersForm(data: ICheckoutAgeBandItem[]) {
    const fields: FormGroup[] = [];

    const generateQuestionFields = () => {
      const questionFields = {};
      this.personalQuestions.forEach(((q) => {
        questionFields[q.string_question_id] = this.fb.control('', [Validators.required]);
      }));
      return questionFields;
    };

    if (!this.information.allTravellerNamesRequired) {
      this.travellersTitleGroup.push(`cart.adult`);
      fields.push(this.fb.group({
        first_name: ['', Validators.required],
        surname: ['', Validators.required],
        band_id: 1,
        lead_traveller: true,
        title: 'Mr.',
        questions: this.fb.group(generateQuestionFields())
      }));
      return fields;
    }
    data
      .filter((tour) => tour.count >= 0)
      .forEach((el, ind) => {
        Array(el.count).fill(0).forEach((_, index) => {
          this.travellersTitleGroup.push(`cart.${el.description.toLowerCase()}`);
          fields.push(
            this.fb
            .group({
              first_name: ['', Validators.required],
              surname: ['', Validators.required],
              band_id: el.bandId,
              lead_traveller: ind === 0 && index === 0,
              title: 'Mr.',
              questions: this.fb.group(generateQuestionFields())
            })
          );
        });
      });
    return fields;
  }

  getQuestionField(travellerIndex: number, name: string) {
    return (this.travellers.controls[travellerIndex] as FormGroup).get('questions').get(name);
  }

  getGeneralQuestionField(name: string) {
    if (this.questions) {
      return (this.questions as FormArray).get(name);
    }
  }

  get travellers(): FormArray { return (this.travellerDetailForm.get('travellers') as FormArray); }
  get questions(): FormArray { return (this.travellerDetailForm.get('questions') as FormArray); }
  get locationPickUp() { return (this.travellerDetailForm.get('locationPickup')); }
  get hotelField() { return this.travellerDetailForm.get('hotel'); }
  get langField() { return this.travellerDetailForm.get('language'); }
}
