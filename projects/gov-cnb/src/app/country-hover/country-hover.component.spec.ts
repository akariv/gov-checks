import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountryHoverComponent } from './country-hover.component';

describe('CountryHoverComponent', () => {
  let component: CountryHoverComponent;
  let fixture: ComponentFixture<CountryHoverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CountryHoverComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CountryHoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
