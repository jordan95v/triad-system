import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  computed,
} from "@angular/core"
import { Router } from "@angular/router"
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import { ParkingService, ParkingSpot } from "../../services/parking.service"
import { AuthService } from "../../services/auth.service"

@Component({
  selector: "app-reserve",
  imports: [ReactiveFormsModule],
  template: `
    <div>
      <h2>Reserve Parking Spot</h2>

      <form [formGroup]="reservationForm" (ngSubmit)="onSubmit()">
        <div>
          <label
            >Date:
            <input
              type="date"
              formControlName="date"
              [min]="minDate()"
              [max]="maxDate()"
          /></label>
        </div>

        <div>
          <label
            ><input type="checkbox" formControlName="needsElectric" /> Electric spot
            needed</label
          >
        </div>

        <div>
          <label
            >Spot:
            @if (loadingSpots()) {
              <span>Loading...</span>
            } @else {
              <select formControlName="spotId">
                <option value="">-- Select --</option>
                @for (spot of availableSpots(); track spot.id) {
                  <option [value]="spot.id">
                    {{ spot.id }}
                    @if (spot.is_electric) {
                      (Electric)
                    }
                  </option>
                }
              </select>
            }
          </label>
        </div>

        @if (errorMessage()) {
          <p style="color: red;">{{ errorMessage() }}</p>
        }
        @if (successMessage()) {
          <p style="color: green;">{{ successMessage() }}</p>
        }

        <button type="submit" [disabled]="!reservationForm.valid || submitting()">
          Reserve
        </button>
        <button type="button" (click)="goBack()">Cancel</button>
      </form>

      <p><small>Max 5 days in advance. Electric spots: rows A & F.</small></p>
    </div>
  `,
  styles: [
    `
      div {
        padding: 20px;
      }
      label {
        display: block;
        margin: 10px 0;
      }
      input,
      select {
        margin: 5px;
      }
      button {
        margin: 5px;
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
