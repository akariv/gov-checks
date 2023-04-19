import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { tap, timer } from 'rxjs';
import { flags } from '../flags';
import { Country, Step } from '../types';
import { LrlrDirective } from '../lrlr.directive';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-country-hover',
  templateUrl: './country-hover.component.html',
  styleUrls: ['./country-hover.component.less'],
  host: {
    '[class.hover]': 'hover',
    '[class.animated]': 'animated'
  },
  hostDirectives: [LrlrDirective],
})
export class CountryHoverComponent implements OnChanges{

  @Input() country: Country;
  @Input() steps: Step[];
  @Input() currentStepIndex: number;
  @Input() hover = false;
  @Input() animated = true;

  @Output() hovering = new EventEmitter<Country | null>();

  @ViewChild('backdrop') backdrop: ElementRef<HTMLDivElement>;

  thisSteps: Step[] = [];
  thisStepsActives: boolean[] = [];
  moveRight = 0;
  visible = false;

  get flag() {
    return flags[this.country.name];
  }

  get blink() {
    return this.country.name === 'israel' && this.steps[this.currentStepIndex].name === 'outro';
  }

  ngOnChanges() {
    this.thisSteps = [];
    this.thisStepsActives = [];
    this.steps.slice(1, this.currentStepIndex + 1).filter((s) => s.name !== 'outro').forEach((step) => {
      this.thisSteps.push(step);
      this.thisStepsActives.push(this.country.steps.map((s) => s.name).includes(step.name));
    });
    this.visible = false;
    this.updaeBackdropLocation().subscribe(() => {
      this.visible = true;
    });
  }

  setHover(value: boolean) {
    this.hover = value;
    this.hovering.emit(value ? this.country : null);
    this.updaeBackdropLocation().subscribe();
  }

  updaeBackdropLocation() {
    this.moveRight = 0;
    return timer(1).pipe(tap(() => {
      if (environment.rtl) {
        const left = this.backdrop.nativeElement.getBoundingClientRect().left;
        if (left < 16) {
          this.moveRight = 16-left;
        }
      } else {
        const right = this.backdrop.nativeElement.getBoundingClientRect().right;
        if (right > window.innerWidth - 16) {
          this.moveRight = window.innerWidth - 16 - right;
        }
      }
    }));
  }
}
