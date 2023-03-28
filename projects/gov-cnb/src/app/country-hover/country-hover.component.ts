import { Component, Input, OnChanges } from '@angular/core';
import { flags } from '../flags';
import { Country, Step } from '../types';

@Component({
  selector: 'app-country-hover',
  templateUrl: './country-hover.component.html',
  styleUrls: ['./country-hover.component.less']
})
export class CountryHoverComponent implements OnChanges{

  @Input() country: Country;
  @Input() steps: Step[];
  @Input() currentStepIndex: number;

  thisSteps: Step[] = [];
  thisStepsActives: boolean[] = [];

  get flag() {
    return flags[this.country.name];
  }

  ngOnChanges() {
    this.thisSteps = [];
    this.thisStepsActives = [];
    this.steps.slice(1, this.currentStepIndex + 1).forEach((step) => {
      this.thisSteps.push(step);
      this.thisStepsActives.push(this.country.steps.map((s) => s.name).includes(step.name));
    });
  }
}
