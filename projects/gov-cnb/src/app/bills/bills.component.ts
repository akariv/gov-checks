import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, QueryList, ViewChildren } from '@angular/core';
import { delay, tap, timer } from 'rxjs';
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
  top = -1;

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
    this.zIndexes = this.zIndexes.map((x) => ((x + this.zIndexes.length - 1) % this.zIndexes.length));
    const maxZIndex = Math.max(...this.zIndexes);
    const maxIndex = this.zIndexes.indexOf(maxZIndex);
    this.top = maxIndex;
    this.animate = false;
    timer(1).pipe(
      tap(() => {
        this.top = -1;
      }),
      delay(1),
      tap(() => {
        const angle = Math.random() * 20 - 10;
        this.billBoxes.toArray()[maxIndex].nativeElement.style.transform = `rotate(${angle}deg)`;
        this.animate = true;
      })
    ).subscribe();
  }
}
