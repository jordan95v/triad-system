import { Component, ChangeDetectionStrategy, inject } from "@angular/core"
import { RouterOutlet, RouterLink, RouterLinkActive } from "@angular/router"
import { AuthService } from "./services/auth.service"

@Component({
  selector: "app-root",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (auth.isLoggedIn()) {
      <nav class="nav">
        <a routerLink="/parking" routerLinkActive="active">🅿️ Parking</a>
        <a routerLink="/reserve" routerLinkActive="active">➕ Reserve</a>
        <a routerLink="/my-reservations" routerLinkActive="active"
          >📋 My Reservations</a
        >
        <span class="spacer"></span>
        <span class="username">{{ auth.currentUser() }}</span>
        <button class="btn btn-sm" (click)="auth.logout()">Logout</button>
      </nav>
    }
    <main>
      <router-outlet />
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
      main {
        padding: 2rem;
      }
      .spacer {
        flex: 1;
      }
      .username {
        color: var(--text-secondary);
      }
      .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class AppComponent {
  readonly auth = inject(AuthService)
}
