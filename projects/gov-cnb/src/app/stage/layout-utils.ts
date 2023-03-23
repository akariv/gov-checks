import { Position } from "../types";

export class LayoutUtils {

  PADDING = 20;
  SLOTS = 66;

  selectedIndexes = new Set<number>();

  constructor(public width: number, public height: number) {}

  x(p: Position | undefined) {
    let ret = this.width / 2;
    if (p) {
      if (p.layout === 'init') {
        const width = this.width > 800 ? 800 : this.width;
        const padding = (this.width - width) > 0 ? (this.width - width) / 2 : 0;
        const skip = (width - 2 * this.PADDING) / this.SLOTS;
        ret = padding + this.PADDING + p.index * skip;
      } else if (p.layout === 'intro') {
        if (!p.width) {
          const skip = (this.width - 2 * this.PADDING) / this.SLOTS;
          const target = this.PADDING + p.index * skip;
          while (!p.width || Math.abs(p.width - target) > this.SLOTS/3*skip) {
            p.width = Math.random() * (this.width - 2*this.PADDING) + this.PADDING;
          }
        }
        ret = p.width;
      } else {
        const skip = (this.width - 3 * this.PADDING) / this.SLOTS;
        ret = (p.active ? 0 : this.PADDING + skip * (p.numActive || 0)) + this.PADDING + p.index * skip;// + (p.selectedNum || 0)* 3 * skip;
      }
    }
    return ret;
  }

  y(p: Position | undefined) {
    let ret = this.height;
    if (p && p.layout === 'intro') {
      if (!p.height) {
        p.height = Math.random() * (this.height - 2*this.PADDING) + this.PADDING;
      }
      ret = p.height;
    }
    return ret;
  }
}
