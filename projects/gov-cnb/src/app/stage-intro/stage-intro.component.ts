import { Component, ElementRef } from '@angular/core';
import { IStage } from '../stage/istage';
import { Country } from '../types';

@Component({
  selector: 'app-stage-intro',
  templateUrl: './stage-intro.component.html',
  styleUrls: ['./stage-intro.component.less']
})
export class StageIntroComponent implements IStage {

  constructor(public el: ElementRef) { }

  reveal(): void {
    console.log('StageIntroComponent.reveal()');
  }

  selectCountries(countries: Country[]): void {
    console.log('StageIntroComponent.selectCountries()');
  }

}
