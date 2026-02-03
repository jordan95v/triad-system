import { Component, ChangeDetectionStrategy, inject } from "@angular/core"
import { AuthService } from "../../services/auth.service"

@Component({
  selector: "app-login",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-container">
      <div class="login-card card">
        <h1>🅿️ Parking Reservation</h1>
        <p class="subtitle">Parking reservation system</p>

        <div class="login-buttons">
          <button class="btn btn-primary btn-large" (click)="loginAs('employee')">
            👤 Employee Login
          </button>
          <button
            class="btn btn-primary btn-large manager"
            (click)="loginAs('manager')"
          >
            👔 Manager Login
          </button>
          <button
            class="btn btn-primary btn-large secretary"
            (click)="loginAs('secretary')"
          >
            📋 Secretary Login
          </button>
        </div>

        <p class="info">Walking Skeleton - Demo Version</p>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 80vh;
      }
      .login-card {
        text-align: center;
        max-width: 400px;
        width: 100%;
      }
      .subtitle {
        color: var(--text-secondary);
        margin-bottom: 2rem;
      }
      .login-buttons {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .btn-large {
        padding: 1rem 2rem;
        font-size: 1.1rem;
      }
      .manager {
        background: linear-gradient(135deg, #8b5cf6, #6366f1);
      }
      .secretary {
        background: linear-gradient(135deg, #10b981, #059669);
      }
      .info {
        margin-top: 2rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    `,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthService)

  loginAs(role: string): void {
    this.auth.login(role)
  }
}
