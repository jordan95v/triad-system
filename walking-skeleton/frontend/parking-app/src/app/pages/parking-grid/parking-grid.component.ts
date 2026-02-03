import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
} from "@angular/core"
import { Router } from "@angular/router"
import { FormsModule } from "@angular/forms"
import { ParkingService, ParkingSpot } from "../../services/parking.service"

@Component({
  selector: "app-parking-grid",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Parking Overview</h1>
        <button class="btn btn-primary" (click)="goToReserve()">
          ➕ New Reservation
        </button>
      </div>

      <div class="controls card">
        <label>
          View Date:
          <input
            type="date"
            [ngModel]="selectedDate()"
            (ngModelChange)="onDateChange($event)"
          />
        </label>
        <div class="legend">
          <span class="legend-item"><span class="dot available"></span> Available</span>
          <span class="legend-item"><span class="dot reserved"></span> Reserved</span>
          <span class="legend-item"><span class="dot electric"></span> Electric</span>
        </div>
      </div>

      @if (loading()) {
        <p class="text-center">Loading...</p>
      } @else {
        <div class="parking-layout">
          @for (row of rows; track row) {
            <div class="parking-row">
              <div class="row-label">{{ row }}</div>
              @for (spot of getSpotsByRow(row); track spot.id) {
                <div
                  class="parking-spot"
                  [class.reserved]="!spot.is_available"
                  [class.electric]="spot.is_electric"
                  [attr.aria-label]="
                    'Spot ' + spot.id + (spot.is_available ? ' available' : ' reserved')
                  "
                >
                  {{ spot.id }}
                </div>
              }
            </div>
          }
        </div>
      }

      <div class="info card">
        <p>
          📅 Showing availability for {{ selectedDate() }}. Use the "New Reservation"
          button to book a spot.
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .header h1 {
        margin: 0;
      }
      .controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 2rem;
      }
      .controls label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .controls input {
        width: auto;
      }
      .legend {
        display: flex;
        gap: 1.5rem;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
      .dot {
        width: 12px;
        height: 12px;
        border-radius: 4px;
      }
      .dot.available {
        background: var(--success);
      }
      .dot.reserved {
        background: var(--danger);
      }
      .dot.electric {
        background: var(--success);
        border: 2px solid var(--electric);
      }
      .parking-layout {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .parking-row {
        display: flex;
        gap: 0.5rem;
      }
      .row-label {
        width: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.25rem;
        color: var(--text-secondary);
      }
      .parking-spot {
        flex: 1;
        min-width: 60px;
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--border);
        border-radius: 0.375rem;
        font-weight: 600;
        font-size: 0.875rem;
        background: var(--success);
        color: white;
        cursor: default;
      }
      .parking-spot.reserved {
        background: var(--danger);
        opacity: 0.6;
      }
      .parking-spot.electric {
        border-color: var(--electric);
        border-width: 3px;
      }
      .info {
        margin-top: 1.5rem;
        text-align: center;
        color: var(--text-secondary);
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
