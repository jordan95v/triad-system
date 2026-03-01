import { Component, signal, inject, OnInit } from "@angular/core"
import { ParkingService, Reservation } from "../../services/parking.service"
import Swal from "sweetalert2"

@Component({
  selector: "app-my-reservations",
  standalone: true,
  templateUrl: "./my-reservations.component.html",
})
export class MyReservationsComponent implements OnInit {
  private readonly parkingService = inject(ParkingService)

  readonly reservations = signal<Reservation[]>([])
  readonly loading = signal(true)

  ngOnInit(): void {
    this.loadReservations()
  }

  private loadReservations(): void {
    this.loading.set(true)
    this.parkingService.getReservations().subscribe({
      next: (data) => {
        this.reservations.set(data)
        this.loading.set(false)
      },
      error: () => this.loading.set(false),
    })
  }

  private getApiError(err: any): string {
    return (
      err?.error?.detail ||
      err?.error?.non_field_errors?.[0] ||
      err?.error?.error ||
      (typeof err?.error === "string" ? err.error : "") ||
      "Server error"
    )
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case "CONFIRMED":
        return "Confirmed"
      case "CHECKED_IN":
        return "Checked-in"
      case "CANCELLED":
        return "Cancelled"
      default:
        return status
    }
  }

  async cancel(reservation: Reservation): Promise<void> {
    const result = await Swal.fire({
      title: "Cancel this reservation?",
      text: `Spot #${reservation.spot_id} on ${reservation.date}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel",
      cancelButtonText: "No",
      reverseButtons: true,
    })

    if (!result.isConfirmed) return

    this.parkingService.cancelReservation(reservation.id).subscribe({
      next: async () => {
        await Swal.fire({
          icon: "success",
          title: "Cancelled",
          timer: 1100,
          showConfirmButton: false,
        })
        this.loadReservations()
      },
      error: async (err) => {
        await Swal.fire({
          icon: "error",
          title: "Cancel failed",
          text: this.getApiError(err),
        })
      },
    })
  }

  async reReserve(reservation: Reservation): Promise<void> {
    const result = await Swal.fire({
      title: "Restore this reservation?",
      text: `Spot #${reservation.spot_id} on ${reservation.date}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Restore",
    })

    if (!result.isConfirmed) return

    this.parkingService.restoreReservation(reservation.id).subscribe({
      next: async () => {
        await Swal.fire({
          icon: "success",
          title: "Reservation restored",
          timer: 1200,
          showConfirmButton: false,
        })
        this.loadReservations()
      },
      error: async (err) => {
        await Swal.fire({
          icon: "error",
          title: "Restore failed",
          text:
            err?.error?.error ||
            err?.error?.detail ||
            "Spot is already reserved.",
        })
        this.loadReservations()
      },
    })
  }
}