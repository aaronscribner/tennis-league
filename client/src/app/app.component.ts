import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { SharedModule } from './shared/shared.module';
import { AuthService } from './core/services/auth.service';
import { UserRole } from './core/models/user.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SharedModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Tennis League';
  isAuthenticated$: Observable<boolean>;
  isHandset$: Observable<boolean>;
  
  // Add computed signal for coordinator check
  isCoordinator = computed(() => 
    this.authService.currentUser()?.role === UserRole.COORDINATOR
  );

  constructor(
    public authService: AuthService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
      
    this.isAuthenticated$ = this.authService.isAuthenticated();
  }

  ngOnInit() {
    // No need to subscribe here as the signal is already initialized in the auth service
  }

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }
}
