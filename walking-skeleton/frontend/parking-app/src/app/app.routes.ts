import { Routes } from "@angular/router"

export const routes: Routes = [
  { path: "", redirectTo: "login", pathMatch: "full" },
  {
    path: "login",
    loadComponent: () =>
      import("./pages/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "parking",
    loadComponent: () =>
      import("./pages/parking-grid/parking-grid.component").then(
        (m) => m.ParkingGridComponent
      ),
  },
  {
    path: "reserve",
    loadComponent: () =>
      import("./pages/reserve/reserve.component").then((m) => m.ReserveComponent),
  },
  {
    path: "my-reservations",
    loadComponent: () =>
      import("./pages/my-reservations/my-reservations.component").then(
        (m) => m.MyReservationsComponent
      ),
  },
  {
    path: "check-in/:spotId",
    loadComponent: () =>
      import("./pages/check-in/check-in.component").then((m) => m.CheckInComponent),
  },
  {
    path: "qr",
    loadComponent: () =>
      import("./pages/qr/qr.component").then((m) => m.QrComponent),
  },
]
