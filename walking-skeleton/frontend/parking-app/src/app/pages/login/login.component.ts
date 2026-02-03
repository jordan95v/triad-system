import { Component, inject } from "@angular/core"
import { AuthService } from "../../services/auth.service"

@Component({
  selector: "app-login",
  template: `
    <div>
      <h1>Parking Reservation System</h1>
      <p>Select role:</p>
      <button (click)="loginAs('employee')">Employee</button>
      <button (click)="loginAs('manager')">Manager</button>
      <button (click)="loginAs('secretary')">Secretary</button>
    </div>
  `,
  styles: [
    `
      div {
        padding: 20px;
      }
      button {
        margin: 5px;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthService)

  loginAs(role: string): void {
    this.auth.login(role)
  }
}
