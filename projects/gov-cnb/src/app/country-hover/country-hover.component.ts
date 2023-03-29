import { Component, Input, OnChanges } from '@angular/core';
import { flags } from '../flags';
import { Country, Step } from '../types';

@Component({
  selector: 'app-country-hover',
  templateUrl: './country-hover.component.html',
  styleUrls: ['./country-hover.component.less'],
  host: {
    '[class.hover]': 'hover'
  }
})
export class CountryHoverComponent implements OnChanges{

  @Input() country: Country;
  @Input() steps: Step[];
  @Input() currentStepIndex: number;
  @Input() hover = false;

  thisSteps: Step[] = [];
  thisStepsActives: boolean[] = [];

  get flag() {
    return flags[this.country.name];
  }

  ngOnChanges() {
    this.thisSteps = [];
    this.thisStepsActives = [];
    this.steps.slice(1, this.currentStepIndex + 1).filter((s) => s.name !== 'outro').forEach((step) => {
      this.thisSteps.push(step);
      this.thisStepsActives.push(this.country.steps.map((s) => s.name).includes(step.name));
    });
  }
}
