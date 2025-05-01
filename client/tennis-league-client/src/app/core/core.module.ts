import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

// Services
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { EventService } from './services/event.service';
import { LineupService } from './services/lineup.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
  ],
  providers: [
    AuthService,
    UserService,
    EventService,
    LineupService
  ]
})
export class CoreModule { }
