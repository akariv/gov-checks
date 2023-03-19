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

class AnimationHandler {
  wait = 0;
  current = 100;

  interpolate(t: number): void {}
  animate(): number {
    if (this.wait > 0) {
      this.wait--;
      return 1;
    }
    if (this.current <= 100) {
      this.interpolate(this.current / 100);
      this.current += 1;
      return 1;
    }
    return 0;
  }
  reset(wait: number) {
    this.wait = wait;
    this.current = 0;
  }
}

class PointAnimationHandler extends AnimationHandler {
  srcX = 0;
  srcY = 0;
  dstX = 0;
  dstY = 0;
  rand: number;
  constructor(public point: Point) {
    super();
  }

  override interpolate(t: number) {
    t = 4 * (t - 0.5)**3 + 0.5;
    const _t = 1 - t;
    this.point.targetX = this.srcX * _t * _t * (1 + 2 * t) + this.dstX * t * t * (3 - 2 * t);
    const yCoeff = 1.5 * t * _t;
    this.point.targetY = this.srcY * (_t * _t * _t + yCoeff) + this.dstY * (t * t * t + yCoeff);
  }
}

class ScrollAnimationHandler extends AnimationHandler {
  src = 0;
  dst = 0;
  scrollTop = 0;
  constructor() {
    super();
  }

  override interpolate(t: number) {
    this.scrollTop = -(this.src * (1 - t) + this.dst * t);
  }
}

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
  

  positions: {[key: string]: {[key: string]: Position}} = {};
  points: Point[] = [];
  height = 0;

  animationHandlers: AnimationHandler[] = [];
  animateRequested = false;
  pointAnimations: PointAnimationHandler[] = [];
  scrollAnimation = new ScrollAnimationHandler();

  layoutUtils: LayoutUtils;

  constructor(private el: ElementRef) {
    this.animationHandlers.push(this.scrollAnimation);
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
        const pah = new PointAnimationHandler(point);
        this.pointAnimations.push(pah);
        this.animationHandlers.push(pah);
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
    this.scrollAnimation.src = -this.scrollAnimation.scrollTop;
    this.scrollAnimation.dst = scrollTop;
    this.scrollAnimation.reset(0);
    console.log('GOTO', step, scrollTop);
    this.currentStage = this.stageComponents.toArray()[stepIndex];
    this.movePoints(stepIndex);
    this.requestAnimation();
  }

  animate() {
    let ongoing = 0;
    this.animationHandlers.forEach(h => {
      ongoing += h.animate();
    });
    this.animateRequested = false;
    if (ongoing > 0) {
      this.requestAnimation();
    }
  }

  requestAnimation() {
    if (!this.animateRequested) {
      this.animateRequested = true;
      requestAnimationFrame(() => this.animate());
    }
  }

  highlight(countries: Country[]) {
    this.currentStage?.selectCountries(countries);
  }

  movePoints(stepIndex: number) {
    const step = this.steps[stepIndex];
    let wait = 100;
    this.pointAnimations.forEach((pa) => {
      pa.rand = Math.random() + pa.point.heights[step.name].height;
    });
    this.pointAnimations.sort((a, b) => a.rand - b.rand);
    this.pointAnimations.forEach((pointAnimation) => {
      const point = pointAnimation.point;
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
        pointAnimation.srcX = pointAnimation.dstX;
        pointAnimation.srcY = pointAnimation.dstY;
        pointAnimation.dstX = this.layoutUtils.x(position);
        pointAnimation.dstY = (stepIndex_ + 1) * this.height - 10*height.height;
        pointAnimation.reset(wait);
        if (Math.random() > 0.5) {
          wait += 1;
        }
        point.targetActive = position.active && step.name === point.step.name;
      }
      // console.log('MOVE POINTS', stepIndex, stepIndex_, height.height, point.step.name, point.country.name, point.targetX, point.targetY);
    });
  }

}
