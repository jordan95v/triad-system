import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  computed,
} from "@angular/core"
import { Router } from "@angular/router"
import { DatePipe } from "@angular/common"
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import { ParkingService, ParkingSpot } from "../../services/parking.service"
import { AuthService } from "../../services/auth.service"

@Component({
  selector: "app-reserve",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <div class="container">
      <h1>🅿️ Reserve Parking Spot</h1>

      <div class="card">
        <form [formGroup]="reservationForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="date">Reservation Date *</label>
            <input
              type="date"
              id="date"
              formControlName="date"
              [min]="minDate()"
              [max]="maxDate()"
              required
            />
            @if (dateControl.touched && dateControl.invalid) {
              <small class="error">Please select a valid date</small>
            }
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" formControlName="needsElectric" />
              I need an electric charging spot
            </label>
          </div>

          <div class="form-group">
            <label for="spot">Available Spots</label>
            @if (loadingSpots()) {
              <p>Loading available spots...</p>
            } @else if (availableSpots().length === 0) {
              <p class="no-spots">No spots available for this date.</p>
            } @else {
              <select id="spot" formControlName="spotId" required>
                <option value="">-- Select a spot --</option>
                @for (spot of availableSpots(); track spot.id) {
                  <option [value]="spot.id">
                    {{ spot.id }} - Row {{ spot.row }}
                    @if (spot.is_electric) {
                      ⚡
                    }
                  </option>
                }
              </select>
              @if (spotControl.touched && spotControl.invalid) {
                <small class="error">Please select a parking spot</small>
              }
            }
          </div>

          @if (errorMessage()) {
            <div class="alert alert-error">{{ errorMessage() }}</div>
          }

          @if (successMessage()) {
            <div class="alert alert-success">{{ successMessage() }}</div>
          }

          <div class="actions">
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="!reservationForm.valid || submitting()"
            >
              @if (submitting()) {
                Reserving...
              } @else {
                Reserve Spot
              }
            </button>
            <button type="button" class="btn btn-secondary" (click)="goBack()">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div class="info-card card">
        <h3>ℹ️ Reservation Rules</h3>
        <ul>
          <li>Reservations can be made for up to 5 working days</li>
          <li>Electric spots (rows A & F) have charging capabilities</li>
          <li>Please check-in by 11 AM on your reservation day</li>
          <li>Unreserved spots may be released after 11 AM</li>
        </ul>
      </div>
    </div>
  `,
  styles: [
    `
      .form-group {
        margin-bottom: 1.5rem;
      }
      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      .form-group input[type="date"],
      .form-group select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 0.375rem;
        font-size: 1rem;
      }
      .form-group input[type="checkbox"] {
        width: auto;
        margin-right: 0.5rem;
      }
      .error {
        color: var(--danger);
        font-size: 0.875rem;
        margin-top: 0.25rem;
        display: block;
      }
      .no-spots {
        color: var(--text-secondary);
        font-style: italic;
      }
      .alert {
        padding: 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
      }
      .alert-error {
        background: rgba(239, 68, 68, 0.1);
        color: var(--danger);
        border: 1px solid var(--danger);
      }
      .alert-success {
        background: rgba(16, 185, 129, 0.1);
        color: var(--success);
        border: 1px solid var(--success);
      }
      .actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
      }
      .btn-secondary {
        background: var(--background);
        color: var(--text);
        border: 1px solid var(--border);
      }
      .btn-secondary:hover {
        background: var(--surface);
      }
      .info-card {
        margin-top: 2rem;
      }
      .info-card h3 {
        margin-bottom: 1rem;
      }
      .info-card ul {
        list-style-position: inside;
        color: var(--text-secondary);
      }
      .info-card li {
        margin-bottom: 0.5rem;
      }
    `,
  ],
})
export class ReserveComponent implements OnInit {
  private readonly parkingService = inject(ParkingService)
  private readonly authService = inject(AuthService)
  private readonly router = inject(Router)

  readonly reservationForm = new FormGroup({
    date: new FormControl(this.getTodayDate(), [Validators.required]),
    needsElectric: new FormControl(false),
    spotId: new FormControl("", [Validators.required]),
  })

  readonly availableSpots = signal<ParkingSpot[]>([])
  readonly loadingSpots = signal(false)
  readonly submitting = signal(false)
  readonly errorMessage = signal("")
  readonly successMessage = signal("")

  readonly minDate = computed(() => this.getTodayDate())
  readonly maxDate = computed(() => {
    const today = new Date()
    const max = new Date(today)
    max.setDate(today.getDate() + 5)
    return max.toISOString().split("T")[0]
  })

  get dateControl() {
    return this.reservationForm.controls.date
  }

  get spotControl() {
    return this.reservationForm.controls.spotId
  }

  ngOnInit(): void {
    // Load spots when date changes
    this.dateControl.valueChanges.subscribe(() => {
      this.loadAvailableSpots()
    })

    // Load spots when electric filter changes
    this.reservationForm.controls.needsElectric.valueChanges.subscribe(() => {
      this.loadAvailableSpots()
    })

    // Load initial spots
    this.loadAvailableSpots()
  }

  private getTodayDate(): string {
    const now = new Date()
    return now.toISOString().split("T")[0]
  }

  private loadAvailableSpots(): void {
    const date = this.dateControl.value
    if (!date) return

    this.loadingSpots.set(true)
    this.parkingService.getAvailableSpots(date).subscribe({
      next: (spots) => {
        let filtered = spots
        if (this.reservationForm.controls.needsElectric.value) {
          filtered = spots.filter((s) => s.is_electric)
        }
        this.availableSpots.set(filtered)
        this.loadingSpots.set(false)

        // Reset spot selection if not in available list
        const currentSpot = this.spotControl.value
        if (currentSpot && !filtered.find((s) => s.id === currentSpot)) {
          this.spotControl.setValue("")
        }
      },
      error: () => {
        this.loadingSpots.set(false)
        this.errorMessage.set("Failed to load available spots")
      },
    })
  }

  onSubmit(): void {
    if (!this.reservationForm.valid) return

    const spotId = this.spotControl.value!
    const date = this.dateControl.value!

    this.submitting.set(true)
    this.errorMessage.set("")
    this.successMessage.set("")

    this.parkingService.createReservation(spotId, date).subscribe({
      next: () => {
        this.successMessage.set(`✅ Successfully reserved spot ${spotId} for ${date}`)
        this.submitting.set(false)

        // Redirect after 2 seconds
        setTimeout(() => {
          this.router.navigate(["/my-reservations"])
        }, 2000)
      },
      error: (err) => {
        this.submitting.set(false)
        const errorMsg =
          err.error?.detail ||
          err.error?.non_field_errors?.[0] ||
          "Failed to create reservation"
        this.errorMessage.set(`❌ ${errorMsg}`)
      },
    })
  }

  goBack(): void {
    this.router.navigate(["/parking"])
  }
}
