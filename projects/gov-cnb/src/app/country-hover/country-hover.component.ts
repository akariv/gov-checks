import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { timer } from 'rxjs';
import { flags } from '../flags';
import { Country, Step } from '../types';

@Component({
  selector: 'app-country-hover',
  templateUrl: './country-hover.component.html',
  styleUrls: ['./country-hover.component.less'],
  host: {
    '[class.hover]': 'hover',
    '[class.animated]': 'animated'
  }
})
export class CountryHoverComponent implements OnChanges{

  @Input() country: Country;
  @Input() steps: Step[];
  @Input() currentStepIndex: number;
  @Input() hover = false;
  @Input() animated = true;

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
    this.moveRight = 0;
    this.visible = false;
    if (this.hover || !this.animated) {
      timer(1).subscribe(() => {
        const left = this.backdrop.nativeElement.getBoundingClientRect().left;
        if (left < 16) {
          this.moveRight = 16-left;
        }
        this.visible = true;
      });  
    }
  }
}
