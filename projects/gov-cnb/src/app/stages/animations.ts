import { NgZone } from "@angular/core";
import { debounce, debounceTime, Subject, timer } from "rxjs";
import { Point } from "../types";

export const POINT_ANIMATION_DURATION = 1000;
export const SCROLL_ANIMATION_DURATION = 3000;
export const REVEAL_ANIMATION_DURATION = 2000;

export class AnimationHandler {
  delay = 0;
  duration = 100;
  startTime: DOMHighResTimeStamp | null = null;
  stopped = false;

  constructor(duration: number, delay?: number) {
    this.duration = duration;
    this.delay = delay || 0; 
  }

  interpolate(t: number): void {}

  animate(now: DOMHighResTimeStamp): number {
    if (this.stopped) {
      return 0;
    }
    if (!this.startTime) {
      this.startTime = now;
    }
    let diff = now - this.startTime;
    if (diff < this.delay) {
      return 1;
    }
    diff -= this.delay;
    if (diff <= this.duration) {
      const t = diff / this.duration;
      this.interpolate(t);
      return 1 - t;
    } else {
      this.interpolate(1);
      this.stopped = true;
    }
    return 0;
  }

  reset(delay?: number) {
    this.delay = delay || 0;
    this.startTime = null;
    this.stopped = false;
  }
}
  
export class PointAnimationHandler extends AnimationHandler {
  srcX = 0;
  srcY = 100000;
  dstX = 0;
  dstY = 100000;
  dstActive = false;
  rand: number;

  constructor(public point: Point) {
    super(POINT_ANIMATION_DURATION, 0);
  }

  override interpolate(t: number) {
    let targetX = this.dstX;
    let targetY = this.dstY;
    if (t < 1) {
      t = t*t;
      const _t = 1 - t;
      targetX = this.srcX * _t * _t * (1 + 2 * t) + this.dstX * t * t * (3 - 2 * t);
      const yCoeff = 1.5 * t * _t;
      targetY = this.srcY * (_t * _t * _t + yCoeff) + this.dstY * (t * t * t + yCoeff);        
    }
    this.point.updatePos(targetX, targetY);
    if (t > 0.5) {
      this.point.updateActive(this.dstActive);
    }
  }
}

export class ScrollAnimationHandler extends AnimationHandler {
  src = 0;
  dst = 0;
  scrollTop = 0;

  constructor() {
    super(SCROLL_ANIMATION_DURATION, 0);
  }

  override interpolate(t: number) {
    t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    this.scrollTop = -(this.src * (1 - t) + this.dst * t);
  }
}

export class Animator {

  public animationHandlers: AnimationHandler[] = [];
  animateRequested = false;
  animateRescue = new Subject<DOMHighResTimeStamp>();
  ongoing_ = false;

  // constructor(private ngZone: NgZone) {
  //   console.log('Animator created');
  //   this.animateRescue.pipe(
  //     debounceTime(500),
  //   ).subscribe((now) => {
  //     console.log('rescue animation', now);
  //     this.requestAnimation(true);
  //   });
  // }

  animate(now: DOMHighResTimeStamp) {
    this.animateRequested = false;
    let ongoing = 0;
    try {
      this.animationHandlers.forEach(h => {
        ongoing += h.animate(now);
      });  
    } catch (e) {
      console.error(e);
    }
    this.ongoing_ = ongoing > 0;
    if (ongoing > 0) {
      // console.log('animation ongoing', ongoing);
      this.requestAnimation();
      this.animateRescue.next(now);
    }
  }

  requestAnimation(skip?: boolean) {
    if (!this.animateRequested) {
      this.animateRequested = true;
      requestAnimationFrame((now: DOMHighResTimeStamp) => this.animate(now));
      if (!skip) {
        this.animateRescue.next(performance.now());
      }
    }
  }

  get ongoing() {
    return this.ongoing_;
  }
}