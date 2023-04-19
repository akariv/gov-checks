import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StageComponent } from './stage/stage.component';
import { StagesComponent } from './stages/stages.component';
import { StageIntroComponent } from './stage-intro/stage-intro.component';
import { BillsComponent } from './bills/bills.component';
import { CountryHoverComponent } from './country-hover/country-hover.component';
import { LrlrDirective } from './lrlr.directive';

@NgModule({
  declarations: [
    AppComponent,
    StageComponent,
    StagesComponent,
    StageIntroComponent,
    BillsComponent,
    CountryHoverComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    LrlrDirective,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
