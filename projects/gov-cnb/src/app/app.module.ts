import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StageComponent } from './stage/stage.component';
import { StagesComponent } from './stages/stages.component';
import { StageIntroComponent } from './stage-intro/stage-intro.component';

@NgModule({
  declarations: [
    AppComponent,
    StageComponent,
    StagesComponent,
    StageIntroComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
