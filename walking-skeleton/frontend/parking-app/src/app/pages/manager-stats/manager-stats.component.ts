import { Component, OnInit, inject, signal } from "@angular/core"
import { Router } from "@angular/router"
import { AuthService } from "../../services/auth.service"
import { ParkingService, StatsResponse } from "../../services/parking.service"

@Component({
    selector: "app-manager-stats",
    standalone: true,
    templateUrl: "./manager-stats.component.html",
})
export class ManagerStatsComponent implements OnInit {
    private readonly parking = inject(ParkingService)
    private readonly router = inject(Router)
    readonly auth = inject(AuthService)

    readonly loading = signal(true)
    readonly stats = signal<StatsResponse | null>(null)

    ngOnInit(): void {
        if (!this.auth.isManager()) {
            this.loading.set(false)
            return
        }

        this.loading.set(true)
        this.parking.getStats().subscribe({
            next: (data) => {
                this.stats.set(data)
                this.loading.set(false)
            },
            error: () => this.loading.set(false),
        })
    }

    pct(v: number): string {
        return `${Math.round(v * 1000) / 10}%`
    }

    back(): void {
        this.router.navigate(["/parking"])
    }
}