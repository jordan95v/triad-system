import { Component, signal, inject, OnInit } from "@angular/core"
import { Router } from "@angular/router"
import { FormsModule } from "@angular/forms"
import { ParkingService, ParkingSpot } from "../../services/parking.service"

@Component({
  selector: "app-parking-grid",
  imports: [FormsModule],
  template: `
    <div>
      <h2>Parking Overview</h2>
      <button (click)="goToReserve()">New Reservation</button>

      <div>
        <label
          >Date:
          <input
            type="date"
            [ngModel]="selectedDate()"
            (ngModelChange)="onDateChange($event)"
        /></label>
      </div>

      @if (loading()) {
        <p>Loading...</p>
      } @else {
        <table border="1" cellpadding="5">
          @for (row of rows; track row) {
            <tr>
              <td>
                <b>{{ row }}</b>
              </td>
              @for (spot of getSpotsByRow(row); track spot.id) {
                <td
                  [style.background-color]="spot.is_available ? '#90EE90' : '#FFB6C1'"
                  [style.font-weight]="spot.is_electric ? 'bold' : 'normal'"
                >
                  {{ spot.id }}
                </td>
              }
            </tr>
          }
        </table>
        <p><small>Green=Available, Pink=Reserved, Bold=Electric</small></p>
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
      td {
        text-align: center;
        min-width: 40px;
      }
    `,
  ],
})
export class ParkingGridComponent implements OnInit {
  private readonly parkingService = inject(ParkingService)
  private readonly router = inject(Router)

  readonly rows = ["A", "B", "C", "D", "E", "F"]
  readonly spots = signal<ParkingSpot[]>([])
  readonly loading = signal(true)
  readonly selectedDate = signal(this.getTodayDate())

  ngOnInit(): void {
    this.loadSpots()
  }

  private getTodayDate(): string {
    const now = new Date()
    return now.toISOString().split("T")[0]
  }

  onDateChange(date: string): void {
    this.selectedDate.set(date)
    this.loadSpots()
  }

  private loadSpots(): void {
    this.loading.set(true)
    this.parkingService.getAvailableSpots(this.selectedDate()).subscribe({
      next: (availableSpots) => {
        // Merge with full spots list to show reserved ones too
        this.parkingService.getSpots().subscribe({
          next: (allSpots) => {
            const availableIds = new Set(availableSpots.map((s) => s.id))
            const merged = allSpots.map((spot) => ({
              ...spot,
              is_available: availableIds.has(spot.id),
            }))
            this.spots.set(merged)
            this.loading.set(false)
          },
          error: () => this.loading.set(false),
        })
      },
      error: () => this.loading.set(false),
    })
  }

  getSpotsByRow(row: string): ParkingSpot[] {
    return this.spots().filter((s) => s.row === row)
  }

  goToReserve(): void {
    this.router.navigate(["/reserve"])
  }
}
