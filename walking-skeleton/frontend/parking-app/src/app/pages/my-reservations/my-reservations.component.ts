import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
} from "@angular/core"
import { DatePipe } from "@angular/common"
import { ParkingService, Reservation } from "../../services/parking.service"

@Component({
  selector: "app-my-reservations",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <div class="container">
      <h1>My Reservations</h1>

      @if (loading()) {
        <p>Loading...</p>
      } @else if (reservations().length === 0) {
        <div class="card empty">
          <p>No reservations</p>
          <a routerLink="/parking" class="btn btn-primary">Book a spot</a>
        </div>
      } @else {
        <div class="reservations-list">
          @for (reservation of reservations(); track reservation.id) {
            <div class="reservation-card card">
              <div class="reservation-info">
                <div class="spot-id">🅿️ {{ reservation.spot_id }}</div>
                <div class="date">{{ reservation.date | date: "fullDate" }}</div>
                <span
                  class="badge"
                  [class]="'badge-' + getStatusClass(reservation.status)"
                >
                  {{ getStatusLabel(reservation.status) }}
                </span>
              </div>
              @if (reservation.status === "CONFIRMED") {
                <button class="btn btn-danger" (click)="cancel(reservation)">
                  Cancel
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .empty {
        text-align: center;
        padding: 3rem;
      }
      .empty p {
        margin-bottom: 1rem;
        color: var(--text-secondary);
      }
      .reservations-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .reservation-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .reservation-info {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }
      .spot-id {
        font-size: 1.25rem;
        font-weight: 700;
      }
      .date {
        color: var(--text-secondary);
      }
      .badge-success {
        background: var(--success);
      }
      .badge-warning {
        background: var(--warning);
      }
      .badge-danger {
        background: var(--danger);
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

  getStatusClass(status: string): string {
    switch (status) {
      case "CONFIRMED":
        return "warning"
      case "CHECKED_IN":
        return "success"
      case "CANCELLED":
        return "danger"
      default:
        return "warning"
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case "CONFIRMED":
        return "Confirmé"
      case "CHECKED_IN":
        return "Check-in effectué"
      case "CANCELLED":
        return "Annulé"
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
