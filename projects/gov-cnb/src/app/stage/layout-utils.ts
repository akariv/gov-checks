import { Position } from "../types";

import { environment } from "../../environments/environment";

export class LayoutUtils {

  PADDING = 20;

  selectedIndexes = new Set<number>();

  constructor(public width: number, public height: number, public slots: number) {}

  x(p: Position | undefined) {
    let ret = this.width / 2;
    let ltr = !environment.rtl;
    if (p) {
      if (p.layout === 'init') {
        const width = this.width > 800 ? 800 : this.width;
        const padding = (this.width - width) > 0 ? (this.width - width) / 2 : 0;
        const skip = (width - 2 * this.PADDING) / this.slots;
        ret = padding + this.PADDING + p.index * skip;
      } else if (p.layout === 'intro') {
        if (!p.width) {
          const skip = (this.width - 2 * this.PADDING) / this.slots;
          const target = this.PADDING + p.index * skip;
          while (!p.width || Math.abs(p.width - target) > this.slots/3*skip) {
            p.width = Math.random() * (this.width - 2*this.PADDING) + this.PADDING;
          }
        }
        ret = p.width;
      } else if (p.layout === 'outro') {
        const slots = this.slots + 8;
        const skip = (this.width - 2 * this.PADDING) / slots;
        ret = this.PADDING + (p.index + (p.group || 0)) * skip;
      } else {
        const skip = (this.width - 3 * this.PADDING) / this.slots;
        ret = (!p.active ? 0 : this.PADDING + (p.numInactive || 0) * skip) + this.PADDING + p.index * skip;
      }
    }
    if (ltr) {
      return this.width - ret;
    }
    return ret;
  }

  y(p: Position | undefined) {
    let ret = this.height;
    if (p && p.layout === 'intro') {
      if (!p.height) {
        p.height = Math.random() * (this.height - 2*this.PADDING) / 2  + this.PADDING + this.height / 2;
      }
      ret = p.height;
    }
    return ret;
  }
}
