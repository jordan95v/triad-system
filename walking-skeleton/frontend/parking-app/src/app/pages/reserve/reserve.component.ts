import { Component, signal, inject, OnInit, computed } from "@angular/core"
import { Router } from "@angular/router"
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import { ParkingService, ParkingSpot } from "../../services/parking.service"
import { AuthService } from "../../services/auth.service"

@Component({
  selector: "app-reserve",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./reserve.component.html",
})
export class ReserveComponent implements OnInit {
  private readonly parkingService = inject(ParkingService)
  private readonly authService = inject(AuthService)
  private readonly router = inject(Router)

  readonly reservationForm = new FormGroup({
    date: new FormControl(this.getTodayDate(), { nonNullable: true, validators: [Validators.required] }),
    needsElectric: new FormControl(false, { nonNullable: true }),
    spotId: new FormControl("", { nonNullable: true, validators: [Validators.required] }),
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
    this.dateControl.valueChanges.subscribe(() => this.loadAvailableSpots())
    this.reservationForm.controls.needsElectric.valueChanges.subscribe(() => this.loadAvailableSpots())
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
    this.errorMessage.set("")

    this.parkingService.getAvailableSpots(date).subscribe({
      next: (spots) => {
        const needsElec = this.reservationForm.controls.needsElectric.value
        const filtered = needsElec ? spots.filter((s) => s.is_electric) : spots

        this.availableSpots.set(filtered)
        this.loadingSpots.set(false)

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

    const spotId = this.spotControl.value
    const date = this.dateControl.value

    this.submitting.set(true)
    this.errorMessage.set("")
    this.successMessage.set("")

    this.parkingService.createReservation(spotId, date).subscribe({
      next: () => {
        this.successMessage.set(`✅ Successfully reserved spot ${spotId} for ${date}`)
        this.submitting.set(false)

        setTimeout(() => this.router.navigate(["/my-reservations"]), 2000)
      },
      error: (err) => {
        this.submitting.set(false)
        const errorMsg =
          err?.error?.detail ||
          err?.error?.non_field_errors?.[0] ||
          "Failed to create reservation"
        this.errorMessage.set(`❌ ${errorMsg}`)
      },
    })
  }

  goBack(): void {
    this.router.navigate(["/parking"])
  }
}