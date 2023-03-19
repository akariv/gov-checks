import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  TOKEN = 'pat9QDk8XIA3CBNHN.ba97a9bf8e545d4dcad33d3e2811208421086747ab9018617bc9d0d00e61da35';
  URL = 'https://api.airtable.com/v0/appzJwhp1bRy4cE0w/';

  public data = new ReplaySubject<any>(1);

  constructor(private http: HttpClient) {
    forkJoin([this.fetch('Countries'), this.fetch('Steps'), this.fetch('Slides')]).subscribe(([countries, steps, slides]) => {
      console.log('steps', steps);
      console.log('countries', countries);
      console.log('slides', slides);
      const stepMap = steps.reduce((acc: any, step: any) => {
        acc[step._id] = step;
        return acc;
      }, {});
      const countryMap = countries.reduce((acc: any, country: any) => {
        acc[country._id] = country;
        return acc;
      }, {});
      countries.forEach((country: any) => {
        country.steps = country.steps.map((s: string) => stepMap[s]);
      });
      slides.forEach((slide: any) => {
        slide.step = stepMap[slide.step];
        slide.highlight_country = (slide.highlight_country || []).map((c: string) => countryMap[c]);
      });
      this.data.next({countries, steps, slides});
      this.data.complete();
    });
  }

  fetch(table: string) {
    const url = `${this.URL}${table}`;
    const params = {
      maxRecords: 1000,
      view: 'WEBSITE'
    };
    return this.http.get(url, {params, headers: {Authorization: `Bearer ${this.TOKEN}`}}).pipe(
      map((res: any) => res.records.map((r: any) => {
        const ret = r.fields;
        ret._id = r.id;
        return ret;
      }))
    );
  }

}
