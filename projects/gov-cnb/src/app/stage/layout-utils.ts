import { Position } from "../types";

export class LayoutUtils {

    PADDING = 20;
    SLOTS = 66;
  
    constructor(public width: number) {}

    x(p: Position | undefined) {
        const skip = (this.width - 4 * this.PADDING) / 2 / this.SLOTS;
        if (!p) {
          return this.width / 2;
        }
        const ret = (p.active ? 0 : this.width / 2) + this.PADDING + p.index * skip;
        return ret;
    }
}
