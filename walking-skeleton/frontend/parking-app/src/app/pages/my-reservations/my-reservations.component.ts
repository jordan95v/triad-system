import { Component, signal, inject, OnInit } from "@angular/core"
import { ParkingService, Reservation } from "../../services/parking.service"

@Component({
  selector: "app-my-reservations",
  template: `
    <div>
      <h2>My Reservations</h2>

      @if (loading()) {
        <p>Loading...</p>
      } @else if (reservations().length === 0) {
        <p>No reservations</p>
      } @else {
        <table border="1" cellpadding="5">
          <tr>
            <th>Spot</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
          @for (reservation of reservations(); track reservation.id) {
            <tr>
              <td>{{ reservation.spot_id }}</td>
              <td>{{ reservation.date }}</td>
              <td>{{ getStatusLabel(reservation.status) }}</td>
              <td>
                @if (reservation.status === "CONFIRMED") {
                  <button (click)="cancel(reservation)">Cancel</button>
                }
              </td>
            </tr>
          }
        </table>
      }
    </div>
  `,
  styles: [
    `
      div {
        padding: 20px;
      }
      table {
        margin-top: 10px;
      }
    `,
  ],
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

  cancel(reservation: Reservation): void {
    this.parkingService.cancelReservation(reservation.id).subscribe({
      next: () => this.loadReservations(),
      error: (err) => console.error("Cancel error:", err),
    })
  }
}
