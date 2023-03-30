import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, QueryList, ViewChildren } from '@angular/core';
import { Bill } from '../types';

@Component({
  selector: 'app-bills',
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.less'],
})
export class BillsComponent implements OnChanges, AfterViewInit {

  @Input() bills: Bill[];
  @Input() currentSlide: number;
  @Input() targetSlide: number;

  @Output() proceed = new EventEmitter();

  @ViewChildren('billBox') billBoxes: QueryList<ElementRef<HTMLDivElement>>;

  animate = false;
  zIndexes: number[] = [];

  constructor(private el: ElementRef) {
  }

  ngOnChanges() {
    this.zIndexes = this.bills?.map((b, i) => i) || [];
    if (this.currentSlide === this.targetSlide) {
      this.animate = true;
    }
  }

  ngAfterViewInit(): void {
    let angle = 5
    this.billBoxes.forEach((billBox, i) => {
      angle += 7;
      angle %= 20;
      billBox.nativeElement.style.transform = `rotate(${angle - 10}deg)`;
      (billBox.nativeElement.parentElement as HTMLElement).style.animationDelay = `${i * 300}ms`;
    });
  }

  shuffle() {
    this.zIndexes = this.zIndexes.map((x) => ((x + 1) % this.zIndexes.length));
  }
}
