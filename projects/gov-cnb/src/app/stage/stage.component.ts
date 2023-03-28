import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { delay, filter, ReplaySubject, switchMap, tap, timer } from 'rxjs';
import { Country, Highlight, Position, StageData } from '../types';
import { select } from 'd3-selection';
import { path } from 'd3-path';
import { LayoutUtils } from './layout-utils';
import { IStage } from './istage';
import { REVEAL_ANIMATION_DURATION } from '../stages/animations';

@Component({
  selector: 'app-stage',
  templateUrl: './stage.component.html',
  styleUrls: ['./stage.component.less'],
})
export class StageComponent implements AfterViewInit, OnChanges, IStage {

  @Input() data: StageData;

  @Output() hover = new EventEmitter<Highlight[]>();

  highlighted: Highlight[] = [];

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
    this.layoutUtils = new LayoutUtils(this.width, this.height);
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
        .attr('id', 'fadeGrad' + data.name)
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
        .attr('stop-color', this.data.color);

      this.svg = this.svg
        .append('g');
    }
    const group = this.svg;

    const active = group.selectAll('.path.active')
      .data(data.active, (d: any) => (d as Country).name);
    active.enter()
      .append('path')
      .attr('class', 'path active');
    active.exit().remove();
    active
      .style('stroke', (d: any) => d.selected ? `url(#fadeGrad${data.name})` : '#cccccc')
      .style('stroke-width', (d: any) => d.name === 'israel' ? 2 : 1)
      .style('fill', 'none')
      .attr('d', (d: any) => this.pathGenerator(d))
      .style('stroke-dasharray', (d: any, i: number, nodes: Element[]) => (nodes[i] as SVGPathElement).getTotalLength())
      .style('stroke-dashoffset', (d: any, i: number, nodes: Element[]) => (nodes[i] as SVGPathElement).getTotalLength());
    timer(1).subscribe(() => {
      active.style('transition', (d: Country) => `stroke-dashoffset ${REVEAL_ANIMATION_DURATION}ms linear`);
    });

    const inactive = group.selectAll('.path.inactive')
    .data(data.inactive, (d: any) => (d as Country).name);
    inactive.enter()
      .append('path')
      .attr('class', 'path inactive')
    inactive.exit().remove();
    inactive
      .style('stroke', (d: any) => d.selected ? `url(#fadeGrad${data.name})` : '#cccccc')
      .style('stroke-width', (d: any) => d.name === 'israel' ? 2 : 1)
      .style('fill', 'none')
      .attr('d', (d: any) => this.pathGenerator(d))
      .style('stroke-dasharray', (d: any, i: number, nodes: Element[]) => (nodes[i] as SVGPathElement).getTotalLength())
      .style('stroke-dashoffset', (d: any, i: number, nodes: Element[]) => (nodes[i] as SVGPathElement).getTotalLength());
    timer(1).subscribe(() => {
      inactive.style('transition', (d: Country) => `stroke-dashoffset ${REVEAL_ANIMATION_DURATION}ms linear`);
    });
    const hoverable = group.selectAll('.path.hoverable')
      .data([...data.active, ...data.inactive], (d: any) => (d as Country).name);
    hoverable.enter()
      .append('path')
      .attr('class', 'path hoverable');
    hoverable.exit().remove();
    hoverable
      .style('stroke', '#ffffff00')
      .style('stroke-width', 8)
      .style('fill', 'none')
      .attr('d', (d: any) => this.pathGenerator(d))
      .on('mouseover', (_: Event, d: Country) => this.hover.emit([...this.highlighted, {country: d, stepName: this.data.name}]))
      .on('mouseout', () => this.hover.emit(this.highlighted))
    ;
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
    this.highlighted = [];
    [this.data.active, this.data.inactive].forEach(lists => {
      let selectedNum = 0;
      let lastSelected = false;
      lists.forEach((c) => {
        c.selected = countries.find((cc) => cc.name === c.name) ? true : false;
        if (c.position) {
          if (c.selected) {
            if (c.position?.index > 0) {
              selectedNum++;
            }
            lastSelected = true;
          } else if (lastSelected) {
            lastSelected = false;
            selectedNum++;
          }
          c.position.selectedNum = selectedNum;
        }
        if (c.selected) {
          this.highlighted.push({country: c, stepName: this.data.name});
        }
      });
    });
    this.redraw(this.data);
    this.hover.emit(this.highlighted);
  }

}
