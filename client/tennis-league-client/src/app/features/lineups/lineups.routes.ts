import { Routes } from '@angular/router';
import { LineupViewComponent } from './lineup-view/lineup-view.component';
import { ScoreFormComponent } from './score-form/score-form.component';
import { authGuard } from '../../core/guards/auth.guard';

export const LINEUPS_ROUTES: Routes = [
  { path: 'event/:id', component: LineupViewComponent, canActivate: [authGuard] },
  { path: ':eventId/score/:matchId', component: ScoreFormComponent, canActivate: [authGuard] }
];