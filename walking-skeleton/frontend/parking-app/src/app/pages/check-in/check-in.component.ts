import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  input,
} from "@angular/core"
import { ParkingService } from "../../services/parking.service"
import { AuthService } from "../../services/auth.service"

@Component({
  selector: "app-check-in",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="check-in-container">
      <div class="check-in-card card">
        @if (loading()) {
          <div class="status loading">
            <div class="icon">⏳</div>
            <h2>Check-in in progress...</h2>
            <p>Spot {{ spotId() }}</p>
          </div>
        } @else if (success()) {
          <div class="status success">
            <div class="icon">✅</div>
            <h2>Check-in successful!</h2>
            <p>
              Spot <strong>{{ spotId() }}</strong> confirmed
            </p>
            <p class="user">Welcome, {{ userName() }}</p>
          </div>
        } @else {
          <div class="status error">
            <div class="icon">❌</div>
            <h2>Check-in failed</h2>
            <p>{{ errorMessage() }}</p>
          </div>
        }

        <a href="/parking" class="btn btn-primary">Back to parking</a>
      </div>
    </div>
  `,
  styles: [
    `
      .check-in-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 80vh;
      }
      .check-in-card {
        text-align: center;
        max-width: 400px;
        width: 100%;
        padding: 3rem 2rem;
      }
      .status .icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }
      .status h2 {
        margin-bottom: 0.5rem;
      }
      .status p {
        color: var(--text-secondary);
      }
      .status.success h2 {
        color: var(--success);
      }
      .status.error h2 {
        color: var(--danger);
      }
      .user {
        margin-top: 1rem;
        font-size: 1.1rem;
        color: var(--text-primary) !important;
      }
      .btn {
        margin-top: 2rem;
      }
    `,
  ],
})
export class CheckInComponent implements OnInit {
  private readonly parkingService = inject(ParkingService)
  private readonly auth = inject(AuthService)

  readonly spotId = input.required<string>()

  readonly loading = signal(true)
  readonly success = signal(false)
  readonly userName = signal("")
  readonly errorMessage = signal("")

  ngOnInit(): void {
    // Ensure user is logged in for check-in
    if (!this.auth.isLoggedIn()) {
      this.auth.login("employee")
    }

    this.performCheckIn()
  }

  private performCheckIn(): void {
    this.parkingService.checkIn(this.spotId()).subscribe({
      next: (response) => {
        this.success.set(true)
        this.userName.set(response.user)
        this.loading.set(false)
      },
      error: (err) => {
        this.success.set(false)
        this.errorMessage.set(
          err.error?.error || "No reservation found for this spot today"
        )

        this.loading.set(false)
      },
    })
  }
}
