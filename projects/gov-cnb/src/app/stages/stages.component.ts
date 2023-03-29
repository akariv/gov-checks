import { AfterViewInit, Component, ElementRef, Input, NgZone, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { delay, tap, timer } from 'rxjs';
import { LayoutService } from '../layout.service';
import { IStage } from '../stage/istage';
import { LayoutUtils } from '../stage/layout-utils';
import { Country, Highlight, Point, Position, StageData, Step } from '../types';
import { AnimationHandler, Animator, PointAnimationHandler, POINT_ANIMATION_DURATION, REVEAL_ANIMATION_DURATION, ScrollAnimationHandler, SCROLL_ANIMATION_DURATION } from './animations';

@Component({
  selector: 'app-stages',
  templateUrl: './stages.component.html',
  styleUrls: ['./stages.component.less'],
  host: {
    '[class.hover]': 'hovering()',
  }
})
export class StagesComponent implements AfterViewInit {

  position: Position = {active: false, index: 0};

  @Input() countries: Country[];
  @Input() steps: Step[];

  @ViewChild('intro') introStage: IStage;
  @ViewChildren('stage') simpleStages: QueryList<IStage>;
  @ViewChildren('points') pointElements: QueryList<ElementRef>;

  stages: StageData[] = [];
  introStageData: StageData;

  observer: IntersectionObserver;
  currentStage: IStage;
  currentStep: Step;
  currentStepIndex = 0;

  stageComponents: IStage[] = [];

  positions: {[key: string]: {[key: string]: Position}} = {};
  points: Point[] = [];
  
  height = 0;
  width = 0;

  animator: Animator;
  pointAnimations: PointAnimationHandler[] = [];
  scrollAnimation = new ScrollAnimationHandler();

  layoutUtils: LayoutUtils;

  ready = false;
  firstTime = true;
  lastMovePoints = -1;
  highlightCountries: Highlight[] = [];
  active = true;

  constructor(private el: ElementRef, private layout: LayoutService) {
    this.animator = new Animator();
    this.animator.animationHandlers.push(this.scrollAnimation);
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

  processData(): void {
    const prevPositions: any = {};
    this.countries.forEach((country, i) => {
      prevPositions[country.name] = {
        layout: 'init',
        index: i
      };
    });
    this.stages = this.steps.filter((s) => ['introduction'].indexOf(s.name) === -1).map((step) => {
      // console.log('step', step);
      this.position.index = 0;
      const stageData: StageData = {
        name: step.name,
        display: step.display,
        color: step.color,
        active: this.processCountries(this.countries.filter(country => country.steps.includes(step)), step, true, prevPositions),
        inactive: this.processCountries(this.countries.filter(country => !country.steps.includes(step)), step, false, prevPositions),
      };
      [...stageData.active, ...stageData.inactive].forEach((c) => {
        if (c.position) {
          c.position.numInactive = stageData.inactive.length;
        }
      });
      return stageData;
    });
    const introStep = this.steps.find((s) => s.name === 'introduction');
    if (introStep) {
      this.introStageData = {
        name: introStep.name,
        display: introStep.display,
        color: introStep.color,
        active: this.countries.map((c: Country, i) => {
          return {
            ...c,
            position: {
              layout: 'init',
              index: i
            },
            prevPosition: {
              layout: 'intro',
              index: i
            }
          };
        }) as Country[],
        inactive: [],
      };
    }
    const outroStep = this.stages[this.stages.length - 1];
    outroStep.active = outroStep.inactive
      .sort((a, b) => a.steps.length - b.steps.length)
      .map((c: Country, i) => {
        return {
          ...c,
          position: {
            layout: 'outro',
            index: i,
            active: true,
            group: c.steps.length
          },
        };
      })
    outroStep.active
      .forEach((c: Country, i) => {
        if (c.position) {
          this.positions[c.name][outroStep.name] = c.position;
        }
      });
    outroStep.inactive = [];

    console.log('stages', this.stages);
    this.points = [];
    this.countries.forEach((country) => {
      country.steps.forEach((step) => {
        const heights: any = {};
        const point = new Point();
        point.country = country;
        point.step = step;
        point.heights = heights;
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
        this.animator.animationHandlers.push(pah);
      });
    });
    // this.pointAnimations[10].debug = true;
    // console.log('ddd point', this.pointAnimations[10]);
    timer(1).subscribe(() => {
      this.pointElements.forEach((el, idx) => {
        this.points[idx].el = el.nativeElement;
      });
    });
    // console.log('points', this.points);
  }

  ngAfterViewInit(): void {
    this.width = this.el.nativeElement.offsetWidth;
    if (this.width > 800) {
      this.width = 800;
    }
    this.height = this.el.nativeElement.offsetHeight;
    this.layoutUtils = new LayoutUtils(this.width, this.height, this.countries.length);

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stage = this.stageComponents.find(c => c.el.nativeElement === entry.target);
          if (stage === this.stageComponents[0] || stage === this.stageComponents[1]) {
            // do nothing
          } else if (stage) {
            stage.reveal();
          }
        }
      });
    }, {threshold: 0.55, root: this.el.nativeElement});
    timer(0).pipe(
      tap(() => {
        this.processData();
      }),
      delay(1),
      tap(() => {
        this.stageComponents = [
          this.introStage,
          ...this.simpleStages.toArray(),
        ];    
        this.stageComponents.forEach(c => {
          this.observer.observe(c.el.nativeElement);
        });
        this.ready = true;
        this.movePoints(0);
        this.animator.requestAnimation();
      })
    ).subscribe();
  }

  setActive(value: boolean) {
    console.log('set active', value);
    this.active = value;
  }

  hovering(): boolean {
    for (const highlight of this.highlightCountries) {
      if (!!highlight?.hover) {
        return true;
      }
    }
    return false;
  }

  goto(step: Step) {
    let stepIndex = this.steps.findIndex(s => s === step);
    let obs = timer(0);
    if (stepIndex === 1 && this.firstTime) {
      this.firstTime = false;
      this.introStage.reveal();
      timer(REVEAL_ANIMATION_DURATION).subscribe(() => {
        this.stageComponents[1].reveal();
      });
      obs = timer(REVEAL_ANIMATION_DURATION * 0.5);
    }
    this.currentStep = step;
    this.currentStepIndex = stepIndex;
    this.currentStage = this.stageComponents[stepIndex];
    obs.subscribe(() => {
      if (this.currentStage === this.stageComponents[stepIndex]) {
        const scrollTop = this.height * (stepIndex + (stepIndex > 0 ? 0.5 : 0));
        if (this.scrollAnimation.dst !== scrollTop) {
          this.scrollAnimation.src = -this.scrollAnimation.scrollTop;
          this.scrollAnimation.dst = scrollTop;
          this.scrollAnimation.reset(0);
        }
        console.log('GOTO', step, scrollTop);
        this.movePoints(stepIndex);
        this.animator.requestAnimation();  
      }
    });  
  }

  highlight(countries: Country[]) {
    this.currentStage?.selectCountries(countries);
  }

  movePoints(stepIndex: number) {
    if (stepIndex === this.lastMovePoints) {
      return;
    }
    this.lastMovePoints = stepIndex;
    const step = this.steps[stepIndex];
    if (!step) {
      console.log('step not found', stepIndex, this.steps.length, this.steps);
    }
    let wait = SCROLL_ANIMATION_DURATION + 500;
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
      const step_ = this.steps[stepIndex_];
      if (!!position) {
        const space = this.layout.mobile ? 9.5 : 13;
        const dstX = this.layoutUtils.x(position);
        const dstY = (stepIndex_ + 1) * this.height - space*height.height;
        const active = position.active && step_.name === point.step.name;
        pointAnimation.dstActive = active;
        if ((pointAnimation.dstY < dstY) && !active) {
          pointAnimation.srcX = pointAnimation.dstX;
          pointAnimation.srcY = pointAnimation.dstY || 100000;
          pointAnimation.dstX = dstX;
          pointAnimation.dstY = dstY;
          pointAnimation.reset(wait);
          if (Math.random() > 0.5 && stepIndex > 1) {
            wait += 25;
          }    
        } else {
          pointAnimation.dstX = dstX;
          pointAnimation.dstY = dstY;
          point.updatePos(dstX, dstY);
          point.updateActive(active);
        }
      }
      // console.log('MOVE POINTS', stepIndex, stepIndex_, height.height, point.step.name, point.country.name, point.targetX, point.targetY);
    });
  }

  hoverPosition(event: Highlight[]) {
    const stepName = event[0].stepName || '';
    if (stepName === this.currentStep?.name) {
      if (!event || event.length === 0) {
        this.highlightCountries = [];
      } else {  
        const stageLeft = this.simpleStages.get(0)?.el.nativeElement.getBoundingClientRect().left || 0;
        this.highlightCountries = event;
        this.highlightCountries.forEach((h) => {
          if (h.country) {
            h.x = stageLeft + this.layoutUtils.x(h.country.position);
          }
        });
      }
      const countryNames = this.highlightCountries.map((h) => h.country?.name || '') || [];
      const hoverNames = this.highlightCountries.filter((h) => h.hover).map((h) => h.country?.name || '') || [];
      this.pointAnimations.forEach((anim) => {
        const active = anim.dstActive || hoverNames.indexOf(anim.point.country.name) >= 0;
        const highlight = anim.dstActive && countryNames.indexOf(anim.point.country.name) >= 0;
        anim.point.updateActive(active, highlight);
      });
    }
  }

}
