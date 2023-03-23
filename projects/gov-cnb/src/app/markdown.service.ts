import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {

  marked = marked;

  constructor(private sanitizer: DomSanitizer) { }

  replaceBolds(md: string) {
    const parts = md.split('**');
    return parts.map((part, i) => i % 2 === 0 ? ` ${part} ` : part.trim()).join('**');
  }

  fixHrefs(md: string) {
    // finds all links in markdown, and changes the link to something else
    return md.replace(/\[([^\]]+)\]\(([^\s]+)\)/g, (match, p1, p2) => {
      // console.log('replace?', p1, p2);
      if (p2.startsWith('http:///term/')) {
        p2 = p2.slice(13);
        p2 = 'term/' + encodeURIComponent(p2).replace(/[!'()*]/g, (c) => {
          // Also encode !, ', (, ), and *
          return '%' + c.charCodeAt(0).toString(16);
        });
        // console.log('replace!', p1, p2);
      }
      return `[${p1}](${p2})`;
    });
  }

  _(markdown: string) {
    markdown = this.replaceBolds(markdown);
    markdown = this.fixHrefs(markdown);
    const html = this.marked(markdown);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
