import { AfterViewInit, Component, ElementRef, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { LayoutUtils } from '../stage/layout-utils';
import { StageComponent } from '../stage/stage.component';
import { Country, Position, StageData, Step } from '../types';


type Point = {
  country: Country;
  step: Step;
  heights: {[key: string]: {
      position: Position,
      height: number
    }
  };
  targetX?: number;
  targetY?: number;
  targetActive?: boolean;
};

@Component({
  selector: 'app-stages',
  templateUrl: './stages.component.html',
  styleUrls: ['./stages.component.less']
})
export class StagesComponent implements OnInit, AfterViewInit {

  position: Position = {active: false, index: 0};

  @Input() countries: Country[];
  @Input() steps: Step[];

  @ViewChildren('stage') stageComponents: QueryList<StageComponent>;

  stages: StageData[] = [];

  observer: IntersectionObserver;
  currentStage: StageComponent;
  
  scrollConfig: { src: any; dst: number; steps: number; remaining: number; };
  scrollRequested = false;
  positions: {[key: string]: {[key: string]: Position}} = {};
  points: Point[] = [];
  height = 0;
  scrollTop = 0;

  layoutUtils: LayoutUtils;

  constructor(private el: ElementRef) {
  }

  processCountries(countries: Country[], step: Step, active: boolean, prevPositions: {[key: string]: Position}) {
    countries = countries.map((c) => ({...c}));
    countries.forEach((country, i) => {
      const steps = [];
      for (let i = 0; i < this.steps.length; i++) {
        const s = this.steps[i];
        if (country.steps.includes(s)) {
          steps.push(s)
        }
        if (s === step) {
          break;
        }
      }
      country.steps = steps;
      country.count = steps.length;
    });
    countries.sort((a, b) => (a.count || 0) - (b.count || 0));
    countries.forEach((country, i) => {
      if (this.position.active !== active) {
        this.position.index = 0;
      } else {
        this.position.index++;
      }
      this.position.active = active;
      const position: Position = {active: this.position.active, index: this.position.index};
      country.position = position;
      country.prevPosition = prevPositions[country.name] || null;
      prevPositions[country.name] = position;
      this.positions[country.name] = this.positions[country.name] || {};
      this.positions[country.name][step.name] = position;
    });
    return countries;
  }

  ngOnInit(): void {
    const prevPositions: any = {};
    // this.countries.forEach((country, i) => {
    //   prevPositions[country.name] = {
    //     active: false,
    //     index: i
    //   };
    // });
    this.steps.forEach((step, i) => {
      console.log('step', step);
      step.idx = i;
      const stageData: StageData = {
        name: step.name,
        display: step.display,
        color: step.color,
        active: this.processCountries(this.countries.filter(country => country.steps.includes(step)), step, true, prevPositions),
        inactive: this.processCountries(this.countries.filter(country => !country.steps.includes(step)), step, false, prevPositions),
      };
      this.stages.push(stageData);
    });
    console.log('stages', this.stages);
    this.points = [];
    this.countries.forEach((country) => {
      country.steps.forEach((step) => {
        const heights: any = {};
        const point: Point = {
          country: country,
          step: step,
          heights
        };
        let height = -1;
        this.steps.forEach((s) => {
          if (height === -1) {
            if (step === s) {
              height++;
            }
          } else {
            if (country.steps.includes(s)) {
              height++;
            }
          }
          const position = this.positions[country.name][s.name];
          point.heights[s.name] = {position, height};
        });
        this.points.push(point);
      });
    });
    console.log('points', this.points);
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stage = this.stageComponents.find(c => c.el.nativeElement === entry.target);
          if (stage) {
            stage.reveal();
          }
        }
      });
    }, {threshold: 0.75, root: this.el.nativeElement});
    this.stageComponents.forEach(c => {
      this.observer.observe(c.el.nativeElement);
    });
    this.height = this.el.nativeElement.offsetHeight;
    console.log('height', this.height);
    this.layoutUtils = new LayoutUtils(this.el.nativeElement.offsetWidth);
    this.movePoints(0);
  }

  goto(step: Step) {
    const stepIndex = this.steps.findIndex(s => s === step);
    const scrollTop = this.height * (stepIndex + 0.5);
    this.scrollConfig = {
      src: -this.scrollTop,
      dst: scrollTop,
      steps: 60 * 3,
      remaining: 60 * 3,
    };
    this.scroll();
    console.log('GOTO', step, scrollTop);
    this.currentStage = this.stageComponents.toArray()[stepIndex];
    this.movePoints(stepIndex);
  }

  scroll() {
    if (this.scrollConfig) {
      const {src, dst, steps, remaining} = this.scrollConfig;
      const targetScrollTop = src + (dst - src) * (1 - remaining / steps);
      this.scrollTop = -targetScrollTop;
      // (this.el.nativeElement as HTMLElement).scrollTo({top: targetScrollTop, behavior: 'auto'});
      this.scrollConfig.remaining--;
      if (this.scrollConfig.remaining > 0) {
        this.scrollRequested = false;
        this.requestScroll();
      }
    }
  }

  requestScroll() {
    if (!this.scrollRequested) {
      this.scrollRequested = true;
      requestAnimationFrame(() => this.scroll());
    }
  }

  highlight(countries: Country[]) {
    this.currentStage?.selectCountries(countries);
  }

  movePoints(stepIndex: number) {
    const step = this.steps[stepIndex];
    this.points.forEach((point) => {
      let height = point.heights[step.name];
      let position: Position | null = null;
      let stepIndex_ = stepIndex;
      if (height.height === -1) {
        for (stepIndex_ = stepIndex + 1; stepIndex_ < this.steps.length; stepIndex_++) {
          height = point.heights[this.steps[stepIndex_].name];
          // console.log('height_', stepIndex, stepIndex_, height.height, height.position);
          if (height.height >= 0) {
            position = height.position;
            break;
          }
        }
      } else {
        position = height.position;
      }
      if (!!position) {
        point.targetX = this.layoutUtils.x(position);
        point.targetY = (stepIndex_ + 1) * this.height - 10*height.height;
        point.targetActive = position.active && step.name === point.step.name;
      }
      // console.log('MOVE POINTS', stepIndex, stepIndex_, height.height, point.step.name, point.country.name, point.targetX, point.targetY);
    });
  }

}
