import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { delay, filter, interval, map, switchMap, take, tap, throttleTime, timer } from 'rxjs';
import { DataService } from './data.service';
import { StagesComponent } from './stages/stages.component';
import { Step, Country, Slide } from './types';

import { marked } from 'marked';
import { MarkdownService } from './markdown.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements AfterViewInit {
  countries: Country[];
  steps: Step[];
  slides: Slide[];
  
  observer: IntersectionObserver;

  marked = marked;

  @ViewChild('stages') stages: StagesComponent;

  constructor(private data: DataService, private el: ElementRef, public md: MarkdownService) {
    // Marked.js options
    const renderer = new marked.Renderer();
    const linkRenderer = renderer.link;
    renderer.link = (href, title, text) => {
      const localLink = (href || '').startsWith(`${location.protocol}//${location.hostname}`);
      const html = linkRenderer.call(renderer, href, title, text);
      return localLink ? html : html.replace(/^<a /, `<a target="_blank" rel="noreferrer noopener nofollow" `);
    };
    marked.use({renderer});
  }

  ngAfterViewInit() {
    this.data.data.pipe(
      tap(data => {
        this.countries = data.countries;
        this.steps = data.steps;
        this.slides = data.slides;
        this.slides.forEach((slide, i) => {
          slide.textHtml = this.md._(slide.text);
        });
      }),
      delay(1),
      // switchMap(() => 
      //   interval(10000).pipe(
      //     filter(x => !!x),
      //     take(this.steps.length),
      //     map(x => this.steps[x-1]),
      //     tap(step => {
      //       this.stages.goto(step);
      //     }),
      //     delay(1000),
      //     tap(() => {
      //       console.log('highlight', this.countries[0].display);
      //       this.stages.highlight(this.countries[0]);
      //     })    
      //   )
      // )
    ).subscribe(() => {
      this.setupObserver();
    });
  }  

  setupObserver() {
    this.observer = new IntersectionObserver((entries) => {
      for (let entry of entries) {
        if (entry.isIntersecting) {
          const slideIdx = entry.target.getAttribute('data-slide-idx') || '0';
          const slide: Slide = this.slides[parseInt(slideIdx, 10)];
          const step: Step | undefined = slide.step;
          if (step) {
            console.log('goto', step.name);
            this.stages.goto(step);
            this.stages.highlight(slide.highlight_country);
          }
          break;
        }
      }
    }, {threshold: 0.25});
    this.el.nativeElement.querySelectorAll('.slide').forEach((el: HTMLElement) => {
      this.observer.observe(el);
    });
  }
}
