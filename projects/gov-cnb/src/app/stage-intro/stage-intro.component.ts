import { Component, ElementRef, Input, SimpleChanges } from '@angular/core';
import { path } from 'd3-path';
import { select } from 'd3-selection';
import { animationFrameScheduler, delay, EMPTY, filter, first, interval, ReplaySubject, switchMap, take, tap, timer } from 'rxjs';
import { flag_names, flags } from '../flags';
import { LayoutService } from '../layout.service';
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
  countrySelections = new ReplaySubject<Country[]>(1);
  svg: any;

  revealed = false;
  finishedAnimation = false;
  layoutUtils: LayoutUtils;
  animateCountry: string[] = [];
  countryPositions: {[key: string]: any} = {};
  selectedCountries: Country[] = [];
  introducedCountries: {[key: string]: boolean} = {};

  constructor(public el: ElementRef, private layout: LayoutService) {
    this.ready.pipe(
      switchMap(() => this.params),
      filter((data) => !!data),
      delay(1),
      tap((data) => {
        this.layoutUtils = new LayoutUtils(this.width, this.height, this.data.active.length);
        this.prepareCountryPositions(data);
      }),
      switchMap(() => interval(10, animationFrameScheduler)),
      take(flag_names.length + 40),
      tap((i) => {
        const flagName = flag_names[i];
        if (i % 2 === 0) {
          if (flagName) {
            this.animateCountry.push(flagName);
          }
          if (i > 20) {
            this.animateCountry.shift();
          }
        }
        if (flagName) {
          this.introducedCountries[flagName] = true;
        }
        this.redraw(this.data);
      }),
      filter((i) => i === flag_names.length + 39),
      switchMap((i) => {
        return this.countrySelections;
      }),
    ).subscribe((countries) => {
      console.log('SELECTING COUNTRIES', countries);
      this.finishedAnimation = true;
      this.selectedCountries = countries;
      this.redraw(this.data);
    });
    this.countrySelections.next([]);
  }

  prepareCountryPositions(data: StageData) {
    flag_names.forEach((cn: string) => {
      const activeCountry = data.active.find((c) => c.name === cn);
      if (activeCountry && activeCountry.prevPosition) {
        this.countryPositions[cn] = {
          x: this.x(activeCountry.prevPosition),
          y: this.y(activeCountry.prevPosition)
        };
      } else {
        this.countryPositions[cn] = {
          x: Math.random() * this.width,
          y: Math.random() * this.height
        };
      }
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
      .data(flag_names.filter((cn) => !data.active.find((c) => c.name === cn)).filter((c) => !!this.introducedCountries[c]))
      .enter()
      .append('circle')
      .attr('class', 'bg-points')
      .attr('cx', (d: any) => this.countryPositions[d].x)
      .attr('cy', (d: any) => this.countryPositions[d].y)
      .attr('r', 2)
      .style('fill', '#cccccc');

    // Paths
    const active = group.selectAll('.path')
      .data(data.active);
    active.enter()
      .append('path')
      .attr('class', 'path')
    active.exit().remove();
    active
      .style('stroke', '#cccccc')
      .style('stroke-width', (d: Country) => d.name === 'israel' ? 2 : (this.layout.mobile ? 0.5 : 1))
      .style('fill', 'none')
      .attr('d', (d: any) => this.pathGenerator(d))
      .style('stroke-dasharray', (d: any, i: number, nodes: Element[]) => (nodes[i] as SVGPathElement).getTotalLength())
      .style('stroke-dashoffset', (d: any, i: number, nodes: Element[]) => (nodes[i] as SVGPathElement).getTotalLength())
    timer(1).subscribe(() => {
      active.style('transition', `stroke-dashoffset ${REVEAL_ANIMATION_DURATION}ms linear`);
    });

    const fgPoints = group.selectAll('.fg-points')
      .data(data.active.filter((c) => !!this.introducedCountries[c.name]));
    fgPoints.enter()
      .append('circle')
      .attr('class', 'fg-points');
    fgPoints
      .attr('cx', (d: any) => this.countryPositions[d.name].x)
      .attr('cy', (d: any) => this.countryPositions[d.name].y)
      .attr('r', 2)
      .style('fill', '#cccccc');

    const selectedFlags = this.selectedCountries.map((c) => c.name);
    if (this.introducedCountries['israel']) {
      selectedFlags.push('israel');
    }
    const showFlags = new Set([...selectedFlags, ...this.animateCountry]);
    const flagImages = group.selectAll('.flag')
      .data(flag_names);
    flagImages.enter()
      .append('g')
      .attr('class', 'flag')
      .attr('transform', (d: any) => `translate(${this.countryPositions[d].x - 10}, ${this.countryPositions[d].y - 10})`)
      // .attr('x', (d: any) => this.countryPositions[d].x - 10)
      // .attr('y', (d: any) => this.countryPositions[d].y - 10)
      .append('image')
      .attr('xlink:href', (d: string) => flags[d])
      .attr('width', 20)
      .attr('height', 20)
    ;
    flagImages
      .attr('class', (d: string) => 'flag' + (showFlags.has(d) ? (selectedFlags.includes(d) ? ' show' : ' half-show') : ''))
      .select('image')
      .style('transition-delay', (d: string, i: number) => this.finishedAnimation ? (i * 10) + 'ms' : '0ms')
    ;
    flagImages.exit().remove();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.params.next(changes['data'].currentValue);
    }
  }

  reveal() {
    if (!this.revealed) {
      this.revealed = true;
      this.svg?.attr('class', 'revealed');
    }
  }
  
  selectCountries(countries: Country[]) {
    this.countrySelections.next(countries);
  }
}
