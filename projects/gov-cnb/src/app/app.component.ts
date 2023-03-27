import { AfterViewInit, Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { delay, filter, first, fromEvent, interval, map, switchMap, take, tap, throttleTime, timer } from 'rxjs';
import { DataService } from './data.service';
import { StagesComponent } from './stages/stages.component';
import { Step, Country, Slide, Bill } from './types';

import { marked } from 'marked';
import { MarkdownService } from './markdown.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements AfterViewInit {

  @ViewChild('stages') stages: StagesComponent;
  @ViewChild('slidesContainer') slidesContainer: ElementRef<HTMLElement>;
  @ViewChild('title') titleImg: ElementRef<HTMLElement>;
  @ViewChildren('steptext') stepTexts: QueryList<ElementRef<HTMLElement>>;

  marked = marked;

  countries: Country[];
  steps: Step[];
  slides: Slide[];
  bills: Bill[];
  content: any = {};
  
  observer: IntersectionObserver;

  currentSlide = 0;
  currentStepIndex = -1;

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
        this.bills = data.bills;
        this.content = data.content;
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
      const content = this.slidesContainer.nativeElement.querySelector('.slide:first-child > *:first-child') as HTMLElement;
      const titleEl = this.titleImg.nativeElement as HTMLElement;
      titleEl.style.top = (content.getBoundingClientRect().top - 120) + 'px';
      titleEl.style.display = 'block';
      fromEvent(this.el.nativeElement, 'scroll').pipe(
        first()
      ).subscribe(() => {
        titleEl.classList.add('scrolled');
      });
      // console.log('LLLL', content);
    });
  }  

  setupObserver() {
    this.observer = new IntersectionObserver((entries) => {
      for (let entry of entries) {
        if (entry.isIntersecting) {
          const slideIdx = entry.target.getAttribute('data-slide-idx');
          if (!slideIdx) return;
          this.currentSlide = parseInt(slideIdx, 10);
          const slide: Slide = this.slides[this.currentSlide];
          const step: Step | undefined = slide.step;
          if (step) {
            console.log('goto', step.name);
            this.currentStepIndex = this.steps.indexOf(step);
            this.highlightStepText();
            this.stages.goto(step);
            this.stages.highlight(slide.highlight_country);
          }
          break;
        }
      }
    }, {threshold: 0.75});
    this.el.nativeElement.querySelectorAll('.slide').forEach((el: HTMLElement) => {
      this.observer.observe(el);
    });
  }

  highlightStepText() {
    const el = this.stepTexts.toArray()[this.currentStepIndex].nativeElement;
    const left = el.offsetLeft;
    const right = left + el.offsetWidth;
    const parent = el.offsetParent as HTMLElement;
    if (parent.scrollLeft > left) {
      parent.scrollTo({left, behavior: 'smooth'});
    } else if (parent.scrollLeft + parent.offsetWidth < right) {
      parent.scrollTo({left: right - parent.offsetWidth, behavior: 'smooth'});
    }
  }

  scrollMore() {
    const el = this.el.nativeElement as HTMLElement;
    const height = this.el.nativeElement.offsetHeight * 1.25;
    console.log('scrollMore', el, height);
    el.scrollBy({top: height, behavior: 'smooth'});
  }
}
