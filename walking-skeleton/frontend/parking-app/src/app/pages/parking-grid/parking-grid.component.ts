import { Component, signal, inject, OnInit } from "@angular/core"
import { Router } from "@angular/router"
import { FormsModule } from "@angular/forms"
import { ParkingService, ParkingSpot, Slot } from "../../services/parking.service"
import { NgClass } from "@angular/common"
import Swal from "sweetalert2"

@Component({
  selector: "app-parking-grid",
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: "./parking-grid.component.html",
})
export class ParkingGridComponent implements OnInit {
  private readonly parkingService = inject(ParkingService)
  private readonly router = inject(Router)

  readonly selectedSlot = signal<Slot>("AM")
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

  onSlotChange(slot: Slot): void {
    this.selectedSlot.set(slot)
    this.loadSpots()
  }

  private loadSpots(): void {
    this.loading.set(true)
    this.parkingService.getAvailableSpots(this.selectedDate(), this.selectedSlot()).subscribe({
      next: (availableSpots) => {
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

  quickReserve(spot: ParkingSpot): void {
    if (!spot.is_available) return

    const date = this.selectedDate()
    const slot = this.selectedSlot()

    Swal.fire({
      title: "Reserve this spot?",
      html: `<div>Spot <b>#${spot.id}</b><br/>Date <b>${date}</b>${spot.is_electric ? "<br/><small>(Electric)</small>" : ""
        }</div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Reserve",
      cancelButtonText: "Cancel",
    }).then((res) => {
      if (!res.isConfirmed) return

      this.parkingService.createReservation(spot.id, date, slot).subscribe({
        next: async () => {
          await Swal.fire({
            icon: "success",
            title: "Reserved!",
            timer: 1100,
            html: `<div>Spot <b>#${spot.id}</b><br/>Date <b>${date}</b><br/>Slot <b>${slot}</b>${spot.is_electric ? "<br/><small>(Electric)</small>" : ""}</div>`,
            showConfirmButton: false,
          })
          this.loadSpots()
        },
        error: async (err) => {
          await Swal.fire({
            icon: "error",
            title: "Reservation failed",
            text: err?.error?.date[0] ? err?.error?.date[0] : "Server Error",
          })
          this.loadSpots()
        },
      })
    })
  }

  onSpotClick(spot: ParkingSpot): void {
    if (!spot.is_available) {
      Swal.fire({
        icon: "info",
        title: "Not available",
        text: `Spot #${spot.id} is already reserved for ${this.selectedDate()}.`,
      })
      return
    }
    this.quickReserve(spot)
  }

  getSpotsByRow(row: string): ParkingSpot[] {
    return this.spots().filter((s) => s.row === row)
  }

  goToReserve(): void {
    this.router.navigate(["/reserve"])
  }
}