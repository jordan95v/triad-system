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

export interface Reservation {
  id: number
  user: string
  spot: string
  spot_id: string
  date: string
  status: "CONFIRMED" | "CHECKED_IN" | "CANCELLED"
  check_in_time: string | null
  created_at: string
}

@Injectable({ providedIn: "root" })
export class ParkingService {
  private readonly http = inject(HttpClient)
  private readonly auth = inject(AuthService)
  private readonly baseUrl = "http://127.0.0.1:8000/api/v1"

  private getHeaders(): HttpHeaders {
    return new HttpHeaders(this.auth.getAuthHeader())
  }

  getSpots(): Observable<ParkingSpot[]> {
    return this.http.get<ParkingSpot[]>(`${this.baseUrl}/spots/`, {
      headers: this.getHeaders(),
    })
  }

  getAvailableSpots(date: string): Observable<ParkingSpot[]> {
    return this.http.get<ParkingSpot[]>(
      `${this.baseUrl}/spots/available/?date=${date}`,
      {
        headers: this.getHeaders(),
      }
    )
  }

  getReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/`, {
      headers: this.getHeaders(),
    })
  }

  createReservation(spotId: string, date: string): Observable<Reservation> {
    return this.http.post<Reservation>(
      `${this.baseUrl}/reservations/`,
      { spot: spotId, date },
      { headers: this.getHeaders() }
    )
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
}
