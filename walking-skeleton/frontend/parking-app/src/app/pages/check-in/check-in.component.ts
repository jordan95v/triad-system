import { Component, signal, inject, OnInit, input } from "@angular/core"
import { ParkingService } from "../../services/parking.service"
import { AuthService } from "../../services/auth.service"

@Component({
  selector: "app-check-in",
  templateUrl: "./check-in.component.html",
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
