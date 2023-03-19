import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { delay, filter, interval, map, switchMap, take, tap, throttleTime, timer } from 'rxjs';
import { DataService } from './data.service';
import { StagesComponent } from './stages/stages.component';
import { Step, Country, Slide } from './types';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements AfterViewInit {

  // step1: Step = {name: 'step1', display: 'Step One', color: 'red'};
  // step2: Step = {name: 'step2', display: 'Step Two', color: 'blue'};
  // step3: Step = {name: 'step3', display: 'Step Three', color: 'green'};
  // step4: Step = {name: 'step4', display: 'Step Four', color: 'yellow'};
  // step5: Step = {name: 'step5', display: 'Step Five', color: 'purple'};

  // steps: Step[] = [
  //   this.step1, this.step2, this.step3, this.step4, this.step5
  // ];
  // countries: Country[] = [
  //   {name: 'USA', display: 'United States', steps: [this.step1, this.step2, ]},
  //   {name: 'CAN', display: 'Canada', steps: [this.step1, this.step2, ]},
  //   {name: 'MEX', display: 'Mexico', steps: [this.step1, this.step2, this.step3, ]},
  //   {name: 'BRA', display: 'Brazil', steps: [this.step1, this.step2, this.step3, ]},
  //   {name: 'ARG', display: 'Argentina', steps: [this.step2, this.step3, this.step4, ]},
  //   {name: 'CHL', display: 'Chile', steps: [this.step1, this.step3, this.step4, this.step5]},    
  //   {name: 'ISR', display: 'Israel', steps: []},
  //   {name: 'EGY', display: 'Egypt', steps: [this.step1, ]},
  //   {name: 'SAU', display: 'Saudi Arabia', steps: [this.step1, this.step3, ]},
  //   {name: 'QAT', display: 'Qatar', steps: [this.step1, this.step2, this.step3, ]},
  //   {name: 'ARE', display: 'United Arab Emirates', steps: [this.step1, this.step2, this.step4, ]},
  //   {name: 'OMN', display: 'Oman', steps: [this.step1, this.step2, this.step3, this.step4, this.step5]},
  // ];
  countries: Country[];
  steps: Step[];
  slides: Slide[];
  
  observer: IntersectionObserver;

  @ViewChild('stages') stages: StagesComponent;

  constructor(private data: DataService, private el: ElementRef) {}

  ngAfterViewInit() {
    this.data.data.pipe(
      tap(data => {
        this.countries = data.countries;
        this.steps = data.steps;
        this.slides = data.slides;
      }),
      delay(1),
      // switchMap(() => 
      //   interval(10000).pipe(
      //     filter(x => !!x),
      //     take(this.steps.length),
      //     map(x => this.steps[x-1]),
      //     tap(step => {
      //       this.stages.goto(step);
      //     }),
      //     delay(1000),
      //     tap(() => {
      //       console.log('highlight', this.countries[0].display);
      //       this.stages.highlight(this.countries[0]);
      //     })    
      //   )
      // )
    ).subscribe(() => {
      this.setupObserver();
    });
  }  

  setupObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const slideIdx = entry.target.getAttribute('data-slide-idx') || '0';
          const slide: Slide = this.slides[parseInt(slideIdx, 10)];
          const step: Step | undefined = slide.step;
          if (step) {
            this.stages.goto(step);
          }
          this.stages.highlight(slide.highlight_country);
        }
      });
    }, {threshold: 0.75});
    this.el.nativeElement.querySelectorAll('.slide').forEach((el: HTMLElement) => {
      this.observer.observe(el);
    });
  }
}
