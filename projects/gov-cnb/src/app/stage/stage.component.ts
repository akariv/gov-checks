import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { delay, filter, fromEvent, ReplaySubject, switchMap, takeUntil, tap, timer } from 'rxjs';
import { Country, Highlight, Position, StageData } from '../types';
import { select } from 'd3-selection';
import { path } from 'd3-path';
import { LayoutUtils } from './layout-utils';
import { IStage } from './istage';
import { REVEAL_ANIMATION_DURATION } from '../stages/animations';
import { LayoutService } from '../layout.service';

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
  lastHovered: string | null = null;

  constructor(public el: ElementRef, private layout: LayoutService) {
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
    this.layoutUtils = new LayoutUtils(this.width, this.height, this.data.active.length + this.data.inactive.length);
    this.ready.next();
  }

  x(p: Position | undefined) {
    return this.layoutUtils.x(p);
  }

  handleTouch(e: TouchEvent) {
    const x = e.touches[0].clientX - this.el.nativeElement.getBoundingClientRect().left;
    const y = e.touches[0].clientY - this.el.nativeElement.getBoundingClientRect().top;
    // console.log('TOUCH0', y, this.height);
    if (y > this.height - 50) {
      let minDist = 1000;
      let minCountry: Country | undefined;
      [...this.data.inactive, ...this.data.active].forEach((c) => {
        const dist = Math.abs(this.x(c.position) - x);
        if (dist < minDist) {
          minDist = dist;
          minCountry = c;
        }
      });
      // console.log('TOUCH1', minCountry?.name, minDist, y, this.height);
      if (minCountry && minDist < 10) {
        if (this.lastHovered !== minCountry.name) {
          this.lastHovered = minCountry.name;
          this.hover.emit([{stepName: this.data.name}, ...this.highlighted, {country: minCountry, stepName: this.data.name, hover: true}]);
        }
        return true;
      }
    }
    return false;
  }

  redraw(data: StageData) {
    // console.log('REDRAW', data);
    if (!this.svg) {
      this.svg = select(this.el.nativeElement).append('svg')
        .attr('width', this.width)
        .attr('height', this.height + 10);
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
    if (this.layout.mobile) {
      this.svg
        .on('touchstart', (e: TouchEvent) => {
          this.lastHovered = null;
          if (this.handleTouch(e)) {
            // console.log('TOUCHSTART');
            fromEvent(e.currentTarget as SVGElement, 'touchmove').pipe(
              takeUntil(fromEvent(e.currentTarget as SVGElement, 'touchend').pipe(tap(() => {
                console.log('TOUCHEND');
                this.lastHovered = null;
              }))),
              tap((e: Event) => {
                // console.log('TOUCHMOVE');
                this.handleTouch(e as TouchEvent);
              }),
            ).subscribe();  
          }
        });
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
      .style('stroke-width', (d: any) => d.name === 'israel' ? 2 : (this.layout.mobile ? 0.5 : 1))
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
      .style('stroke', '#cccccc')
      .style('stroke-width', (d: any) => d.name === 'israel' ? 2 : (this.layout.mobile ? 0.5 : 1))
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
      .attr('d', (d: any) => this.pathGenerator(d));
    if (!this.layout.mobile) {
      hoverable
        .on('mouseover', (e: Event, d: Country) => {
          this.hover.emit([{stepName: this.data.name}, ...this.highlighted, {country: d, stepName: this.data.name, hover: true}]);
        });
    }

    const beads = group.selectAll('.bead')
      .data([...data.active, ...data.inactive], (d: any) => (d as Country).name);
    beads.enter()
      .append('ellipse')
      .attr('class', 'bead')
      .style('stroke', '#cccccc')
      .style('stroke-width', (d: any) => d.name === 'israel' ? 2 : 1)
      .style('fill', '#fafafa')
      .attr('cx', (d: any) => this.x(d.position))
      .attr('cy', this.height)
      .attr('rx', this.layout.desktop ? 4 : 2)
      .attr('ry', this.layout.desktop ? 6 : 4);
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
    console.log('SELECT COUNTRIES', this.data.name, countries);
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
    this.hover.emit([{stepName: this.data.name}, ...this.highlighted]);
  }

}
