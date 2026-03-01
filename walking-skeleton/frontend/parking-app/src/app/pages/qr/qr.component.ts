import { Component, inject, signal, OnInit, computed } from "@angular/core"
import { ParkingService, ParkingSpot } from "../../services/parking.service"
import { AuthService } from "../../services/auth.service"
import { RouterLink } from "@angular/router"

@Component({
    selector: "app-qr",
    standalone: true,
    imports: [RouterLink],
    templateUrl: "./qr.component.html",
})
export class QrComponent implements OnInit {
    private readonly parking = inject(ParkingService)
    private readonly auth = inject(AuthService)

    readonly loading = signal(true)
    readonly spots = signal<ParkingSpot[]>([])

    ngOnInit(): void {
        if (!this.auth.isLoggedIn()) this.auth.login("secretary")

        this.parking.getSpots().subscribe({
            next: (data) => {
                const sorted = [...data].sort((a, b) => a.id.localeCompare(b.id))
                this.spots.set(sorted)
                this.loading.set(false)
            },
            error: () => this.loading.set(false),
        })
    }

    checkInUrl(spotId: string): string {
        return `/check-in/${spotId}`
    }

    print(): void {
        window.print()
    }
}