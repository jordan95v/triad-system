import { Injectable, inject } from "@angular/core"
import { HttpClient, HttpHeaders } from "@angular/common/http"
import { Observable } from "rxjs"
import { AuthService } from "./auth.service"

export interface ParkingSpot {
  id: string
  row: string
  number: number
  is_electric: boolean
  is_available: boolean
}

export type Slot = "AM" | "PM"

export interface Reservation {
  id: number
  user: string
  spot: string
  spot_id: string
  date: string
  slot: Slot
  status: "CONFIRMED" | "CHECKED_IN" | "CANCELLED" | "EXPIRED"
  check_in_time: string | null
  created_at: string
}

export interface StatsResponse {
  from: string
  to: string
  total_reservations: number
  by_status: {
    CONFIRMED: number
    CHECKED_IN: number
    CANCELLED: number
    EXPIRED: number
  }
  occupancy_rate: number
  no_show_rate: number
  electric_rate: number
  by_slot: { AM: number; PM: number }
}

@Injectable({ providedIn: "root" })
export class ParkingService {
  private readonly http = inject(HttpClient)
  private readonly auth = inject(AuthService)
  private readonly baseUrl = "/api/v1"

  private getHeaders(): HttpHeaders {
    return new HttpHeaders(this.auth.getAuthHeader())
  }

  getSpots(): Observable<ParkingSpot[]> {
    return this.http.get<ParkingSpot[]>(`${this.baseUrl}/spots/`, {
      headers: this.getHeaders(),
    })
  }

  getReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/`, {
      headers: this.getHeaders(),
    })
  }

  checkIn(spotId: string): Observable<{ status: string; spot: string; user: string }> {
    return this.http.post<{ status: string; spot: string; user: string }>(
      `${this.baseUrl}/reservations/check-in/${spotId}/`,
      {},
      { headers: this.getHeaders() }
    )
  }

  cancelReservation(id: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(
      `${this.baseUrl}/reservations/${id}/cancel/`,
      {},
      { headers: this.getHeaders() }
    )
  }

  restoreReservation(id: number) {
    return this.http.post<{ status: string }>(
      `${this.baseUrl}/reservations/${id}/restore/`,
      {},
      { headers: this.getHeaders() }
    )
  }


  getAvailableSpots(date: string, slot: Slot): Observable<ParkingSpot[]> {
    return this.http.get<ParkingSpot[]>(
      `${this.baseUrl}/spots/available/?date=${date}&slot=${slot}`,
      { headers: this.getHeaders() }
    )
  }

  createReservation(spotId: string, date: string, slot: Slot): Observable<Reservation> {
    return this.http.post<Reservation>(
      `${this.baseUrl}/reservations/`,
      { spot: spotId, date, slot },
      { headers: this.getHeaders() }
    )
  }

  getAdminReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/admin/`, {
      headers: this.getHeaders(),
    })
  }

  getStats(params?: { from?: string; to?: string }): Observable<StatsResponse> {
    const query =
      params?.from || params?.to
        ? `?${params.from ? `from=${params.from}` : ""}${params.from && params.to ? "&" : ""}${params.to ? `to=${params.to}` : ""}`
        : ""

    return this.http.get<StatsResponse>(`${this.baseUrl}/reservations/stats/${query}`, {
      headers: this.getHeaders(),
    })
  }
}
