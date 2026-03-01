import { Injectable, signal, computed, inject } from "@angular/core"
import { Router } from "@angular/router"

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly router = inject(Router)
  private readonly user = signal<string | null>(null)

  readonly currentUser = computed(() => this.user())
  readonly isLoggedIn = computed(() => this.user() !== null)
  readonly role = computed(() => (this.user() ?? "employee") as "employee" | "manager" | "secretary")

  readonly isEmployee = computed(() => this.role() === "employee")
  readonly isManager = computed(() => this.role() === "manager")
  readonly isSecretary = computed(() => this.role() === "secretary")
  readonly isStaffLike = computed(() => this.isManager() || this.isSecretary())

  constructor() {
    const stored = sessionStorage.getItem("user")
    if (stored) {
      this.user.set(stored)
    }
  }

  login(username: string): void {
    this.user.set(username)
    sessionStorage.setItem("user", username)
    this.router.navigate(["/parking"])
  }

  logout(): void {
    this.user.set(null)
    sessionStorage.removeItem("user")
    this.router.navigate(["/login"])
  }

  getAuthHeader(): Record<string, string> {
    const user = this.user()
    return user ? { "X-Dev-User": user } : {}
  }
}
