import { Component, OnInit, inject, signal } from "@angular/core"
import { Router } from "@angular/router"
import { ParkingService, Reservation } from "../../services/parking.service"
import { AuthService } from "../../services/auth.service"
import { DatePipe } from "@angular/common"

@Component({
    selector: "app-admin-reservations",
    standalone: true,
    templateUrl: "./admin-reservations.component.html",
    imports: [DatePipe],
})
export class AdminReservationsComponent implements OnInit {
    private readonly parking = inject(ParkingService)
    private readonly router = inject(Router)
    readonly auth = inject(AuthService)

    readonly reservations = signal<Reservation[]>([])
    readonly loading = signal(true)

    ngOnInit(): void {
        if (!this.auth.isStaffLike()) {
            this.loading.set(false)
            return
        }

        this.loading.set(true)
        this.parking.getAdminReservations().subscribe({
            next: (data) => {
                this.reservations.set(data)
                this.loading.set(false)
            },
            error: () => this.loading.set(false),
        })
    }

    back(): void {
        this.router.navigate(["/parking"])
    }
}