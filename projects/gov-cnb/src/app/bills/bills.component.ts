import { Component, ElementRef, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Bill } from '../types';

@Component({
  selector: 'app-bills',
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.less'],
  host: {
    '[class]': '"state-" + currentState'
  }
})
export class BillsComponent implements OnChanges {

  @Input() content: any;
  @Input() bills: Bill[];
  @Input() currentSlide: number;

  @Output() proceed = new EventEmitter();

  selectedBill: Bill;

  constructor(private el: ElementRef) {

  }

  ngOnChanges(changes: any) {
    if (!this.selectedBill && this.bills?.length) {
      this.selectedBill = this.bills[0];
    }
  }

  get currentState(): string {
    const lawsSlideIndex = this.content.lawsSlideIndex;
    if (this.currentSlide < lawsSlideIndex) {
      return 'pre';
    } else if (this.currentSlide === lawsSlideIndex) {
      return 'visible';
    } else if (this.currentSlide === lawsSlideIndex + 1) {
      return 'selected';
    } 
    return 'blurred';
  }

  selected(bill: Bill) {
    console.log('SELECTED', this.currentState, bill);
    if (this.currentState === 'visible') {
      this.selectedBill = bill;
      this.proceed.emit();
    }
  }
}
