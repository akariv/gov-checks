import { AfterViewInit, Directive, ElementRef } from '@angular/core';

import { environment } from '../environments/environment';

@Directive({
  selector: '[lrlr]',
  standalone: true
})
export class LrlrDirective implements AfterViewInit{

  constructor(private el: ElementRef) { 
  }

  ngAfterViewInit() {
    if (!environment.rtl) {
      this.el.nativeElement.classList.add('ltr');
      if (environment.lang) {
        this.el.nativeElement.classList.add('lang-' + environment.lang);
      } else {
        this.el.nativeElement.classList.add('lang-he');
      }
    }
  }

}
