import { Component, inject } from "@angular/core"
import { RouterOutlet, RouterLink } from "@angular/router"
import { AuthService } from "./services/auth.service"

@Component({
  selector: "app-root",
  imports: [RouterOutlet, RouterLink],
  template: `
    @if (auth.isLoggedIn()) {
      <div style="background: #eee; padding: 10px; border-bottom: 1px solid #ccc;">
        <a routerLink="/parking">Parking</a> | <a routerLink="/reserve">Reserve</a> |
        <a routerLink="/my-reservations">My Reservations</a>
        <span style="float: right;"
          >{{ auth.currentUser() }} |
          <a href="#" (click)="auth.logout()">Logout</a></span
        >
      </div>
    }
    <router-outlet />
  `,
  styles: [
    `
      a {
        margin: 0 5px;
      }
    `,
  ],
})
export class AppComponent {
  readonly auth = inject(AuthService)
}
