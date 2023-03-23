import { Component, ElementRef, Input, SimpleChanges } from '@angular/core';
import { path } from 'd3-path';
import { select } from 'd3-selection';
import { delay, filter, ReplaySubject, switchMap, tap, timer } from 'rxjs';
import { IStage } from '../stage/istage';
import { LayoutUtils } from '../stage/layout-utils';
import { REVEAL_ANIMATION_DURATION } from '../stages/animations';
import { Country, Position, StageData } from '../types';

@Component({
  selector: 'app-stage-intro',
  templateUrl: './stage-intro.component.html',
  styleUrls: ['./stage-intro.component.less']
})
export class StageIntroComponent implements IStage {

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
    p.moveTo(this.x(d.prevPosition), this.y(d.prevPosition));
    const midPoint = (this.y(d.prevPosition) + this.y(d.position)) / 2;
    p.bezierCurveTo(this.x(d.prevPosition), midPoint, this.x(d.position), midPoint, this.x(d.position), this.y(d.position));
    return p.toString();
  }

  ngAfterViewInit() {
    this.height = this.el.nativeElement.offsetHeight;
    this.width = this.el.nativeElement.offsetWidth;
    this.layoutUtils = new LayoutUtils(this.width, this.height);
    this.ready.next();
  }

  x(p: Position | undefined) {
    return this.layoutUtils.x(p);
  }

  y(p: Position | undefined) {
    return this.layoutUtils.y(p);
  }

  redraw(data: StageData) {
    // console.log('REDRAW', data);
    if (!this.svg) {
      this.svg = select(this.el.nativeElement).append('svg')
        .attr('width', this.width)
        .attr('height', this.height);
      this.svg = this.svg
        .append('g');
    }
    const group = this.svg;
    // BG countries
    group.selectAll('.bg-points')
      .data(Array(195 - data.active.length).map((_, i) => [i]))
      .enter()
      .append('circle')
      .attr('class', 'bg-points')
      .attr('cx', (d: any) => Math.random() * this.width)
      .attr('cy', (d: any) => Math.random() * this.height)
      .attr('r', 2)
      .style('fill', '#cccccc');

    // Paths
    const active = group.selectAll('.path')
      .data(data.active, (d: any) => (d as Country).name);
    active.enter()
      .append('path')
      .attr('class', 'path')
    active.exit().remove();
    active
      .style('stroke', '#cccccc')
      .style('stroke-width', 1)
      .style('fill', 'none')
      .attr('d', (d: any) => this.pathGenerator(d))
      .style('stroke-dasharray', (d: any, i: number, nodes: Element[]) => (nodes[i] as SVGPathElement).getTotalLength())
      .style('stroke-dashoffset', (d: any, i: number, nodes: Element[]) => (nodes[i] as SVGPathElement).getTotalLength())
    timer(1).subscribe(() => {
      active.style('transition', `stroke-dashoffset ${REVEAL_ANIMATION_DURATION}ms linear`);
    });

    const fgPoints = group.selectAll('.fg-points')
      .data(data.active);
    fgPoints.enter()
      .append('circle')
      .attr('class', 'fg-points');
    fgPoints
      .attr('cx', (d: any) => this.layoutUtils.x(d.prevPosition))
      .attr('cy', (d: any) => this.layoutUtils.y(d.prevPosition))
      .attr('r', 3)
      .style('fill', '#cccccc');
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
      console.log('REVEAL', this.data.name, this.data.display, this.data.active);
    }
  }
  
  selectCountries(countries: Country[]) {
    // [...this.data.active, ...this.data.inactive].forEach((c) => {
    //   c.selected = countries.find((cc) => cc.name === c.name) ? true : false;
    // });
    this.redraw(this.data);
  }
}
