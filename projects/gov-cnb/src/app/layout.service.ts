import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  window: (Window & typeof globalThis) | null;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.window = this.document.defaultView;
  }

  get mobile() {
    return (this.window?.innerWidth || 0) < 768;
  }

  get desktop() {
    return (this.window?.innerWidth || 0) >= 768;
  }

}
