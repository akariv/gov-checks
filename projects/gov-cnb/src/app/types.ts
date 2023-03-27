import { SafeHtml } from "@angular/platform-browser";

export type Slide = {
  id: string;
  text: string;
  textHtml?: SafeHtml;
  step: Step
  highlight_country: Country[];
};

export type Step = {
  name: string;
  display: string;
  color: string;
};

export type Position = {
  layout?: 'init' | 'intro';
  active: boolean;
  index: number;
  height?: number;
  width?: number;
  numActive?: number;
  selectedNum?: number;
};

export type Country = {
  name: string;
  display: string;
  steps: Step[];
  selected?: boolean;
  count?: number;
  position?: Position;
  prevPosition?: Position;
};

export type StageData = {
  name: string;
  display: string;
  color: string;
  active: Country[];
  inactive: Country[];
};

export type Bill = {
  title: string;
  subtitle: string;
};

export class Point {
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
  el?: HTMLElement;

  updatePos(x: number, y: number, debug?: boolean) {
    if (debug) {
      console.log('ddd updatePos', x, y, !!this.el, this.targetY !== y);
    }
    if (this.el && this.targetY !== y) {
      this.el.style.left = x + 'px';
      this.el.style.top = y + 'px';
      this.targetX = x;
      this.targetY = y;      
    }
  }

  updateActive(active: boolean) {
    if (this.el && this.targetActive !== active) {
      this.el.className = active ? 'point active' : 'point';
      this.el.style.backgroundColor = active ? this.step.color : '#cccccc';
      this.targetActive = active;
    }
  }

  get id() {
    return this.country.name + '-' + this.heights['outro'].height;
  }
};
