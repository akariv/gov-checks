import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { delay, filter, ReplaySubject, switchMap, tap } from 'rxjs';
import { Country, Position, StageData } from '../types';
import { select } from 'd3-selection';
import { path } from 'd3-path';
import { LayoutUtils } from './layout-utils';

@Component({
  selector: 'app-stage',
  templateUrl: './stage.component.html',
  styleUrls: ['./stage.component.less'],
})
export class StageComponent implements AfterViewInit, OnChanges{

  @Input() data: StageData;

  height = 0;
  width = 0;

  ready = new ReplaySubject<void>(1);
  params = new ReplaySubject<StageData>(1);
  svg: any;

  revealed = false;
  layoutUtils: LayoutUtils;

  constructor(public el: ElementRef) {
    this.ready.pipe(
      switchMap(() => this.params),
      filter((data) => !!data),
      tap((data) => {
        this.redraw(data);
      }),
      delay(1),
    ).subscribe((data) => {
      this.redraw(data);
    });
  }

  pathGenerator(d: Country) {
    const p = path();
    if (d.prevPosition) {
      p.moveTo(this.x(d.prevPosition), 0);
      p.bezierCurveTo(this.x(d.prevPosition), this.height/2, this.x(d.position), this.height / 2, this.x(d.position), this.height);
    }
    return p.toString();
  }

  ngAfterViewInit() {
    this.height = this.el.nativeElement.offsetHeight;
    this.width = this.el.nativeElement.offsetWidth;
    this.layoutUtils = new LayoutUtils(this.width);
    this.ready.next();
  }

  x(p: Position | undefined) {
    return this.layoutUtils.x(p);
  }

  redraw(data: StageData) {
    // console.log('REDRAW', data);
    if (!this.svg) {
      this.svg = select(this.el.nativeElement).append('svg')
        .attr('width', this.width)
        .attr('height', this.height);
      const defs = this.svg.append('defs');
      const fadeGrad = defs.append('linearGradient')
        .attr('id', 'fadeGrad')
        .attr('gradientTransform', 'rotate(90)')
        .attr('gradientUnits', 'userSpaceOnUse');
      // fadeGrad.append('stop')
      //   .attr('offset', '0%')
      //   .attr('stop-color', '#FF7F0E');
      fadeGrad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#CCCCCC');
      fadeGrad.append('stop')
        .attr('offset', '80%')
        .attr('stop-color', '#CCCCCC');
      fadeGrad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#FF7F0E');

      this.svg = this.svg
        .append('g');
    }
    const group = this.svg;
    const active = group.selectAll('.path.active')
      .data(data.active, (d: any) => (d as Country).name);
    const inactive = group.selectAll('.path.inactive')
      .data(data.inactive, (d: any) => (d as Country).name);
    active.enter()
      .append('path')
      .attr('class', 'path active')
    active.exit().remove();
    active
      .style('stroke', (d: any) => d.selected ? `url(#fadeGrad)` : '#cccccc')
      .style('stroke-width', 1)
      .style('fill', 'none')
      .attr('d', (d: any) => this.pathGenerator(d));
    inactive.enter()
      .append('path')
      .attr('class', 'path inactive')
    inactive.exit().remove();
    inactive
      .style('stroke', (d: any) => d.selected ? `url(#fadeGrad)` : '#cccccc')
      .style('stroke-width', 1)
      .style('fill', 'none')
      .attr('d', (d: any) => this.pathGenerator(d));
}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.params.next(changes['data'].currentValue);
    }
  }

  reveal() {
    if (!this.revealed) {
      this.revealed = true;
      this.svg.attr('class', 'revealed');
      console.log('REVEAL', this.data.name, this.data.display);
    }
  }
  
  selectCountries(countries: Country[]) {
    [...this.data.active, ...this.data.inactive].forEach((c) => {
      c.selected = countries.find((cc) => cc.name === c.name) ? true : false;
      if (c.selected) {
        console.log('CCCCC', c.selected);
      }
    });
    this.redraw(this.data);
  }

}
