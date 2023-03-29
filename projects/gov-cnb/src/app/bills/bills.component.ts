import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, QueryList, ViewChildren } from '@angular/core';
import { Bill } from '../types';

@Component({
  selector: 'app-bills',
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.less'],
  host: {
    '[class]': '"state-" + currentState'
  }
})
export class BillsComponent implements OnChanges, AfterViewInit {

  @Input() content: any;
  @Input() bills: Bill[];
  @Input() currentSlide: number;

  @Output() proceed = new EventEmitter();

  @ViewChildren('billBox') billBoxes: QueryList<ElementRef<HTMLDivElement>>;

  selectedBill: Bill;

  constructor(private el: ElementRef) {

  }

  ngOnChanges(changes: any) {
    if (!this.selectedBill && this.bills?.length) {
      this.selectedBill = this.bills[0];
    }
  }

  ngAfterViewInit(): void {
    let angle = 5
    this.billBoxes.forEach((billBox, i) => {
      angle += 7;
      angle %= 20;
      billBox.nativeElement.style.transform = `rotate(${angle - 10}deg)`;
      (billBox.nativeElement.parentElement as HTMLElement).style.animationDelay = `${angle * 100}ms`;
    });
  }

  get currentState(): string {
    const lawsSlideIndex = this.content.lawsSlideIndex;
    const lawsSlideIndex2 = this.content.lawsSlideIndex2;
    if (this.currentSlide < lawsSlideIndex) {
      return 'pre';
    } else if (this.currentSlide === lawsSlideIndex) {
      return 'select';
    } else if (this.currentSlide === lawsSlideIndex + 1) {
      return 'selected';
    } else if (this.currentSlide < lawsSlideIndex2) {
      return 'blurred';
    } else if (this.currentSlide === lawsSlideIndex2) {
      return 'visible';
    }
    return 'pre';
  }

  selected(bill: Bill) {
    console.log('SELECTED', this.currentState, bill);
    if (this.currentState === 'select') {
      this.selectedBill = bill;
      this.proceed.emit();
    }
  }
}
