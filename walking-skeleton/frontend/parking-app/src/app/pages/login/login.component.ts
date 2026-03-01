import { Component, inject } from "@angular/core"
import { AuthService } from "../../services/auth.service"

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
})
export class LoginComponent {
  private readonly auth = inject(AuthService)

  loginAs(role: string): void {
    this.auth.login(role)
  }
}