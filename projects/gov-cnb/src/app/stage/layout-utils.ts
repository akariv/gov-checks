import { Position } from "../types";

export class LayoutUtils {

  PADDING = 20;
  SLOTS = 66;

  constructor(public width: number) {}

  x(p: Position | undefined) {
    let ret = this.width / 2;
    if (p) {
      if (p.layout === 'init') {
        const skip = (this.width - 2 * this.PADDING) / this.SLOTS;
        ret = this.PADDING + p.index * skip;
      } else {
        const skip = (this.width - 4 * this.PADDING) / 2 / this.SLOTS;
        ret = (p.active ? 0 : this.width / 2) + this.PADDING + p.index * skip;
      }
    }
    return ret;
  }
}
