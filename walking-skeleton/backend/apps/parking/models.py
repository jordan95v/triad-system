from django.conf import settings
from django.db import models
from django.db.models import Q


class ParkingSpot(models.Model):
    ROW_CHOICES = [
        ("A", "Row A (Electric)"),
        ("B", "Row B"),
        ("C", "Row C"),
        ("D", "Row D"),
        ("E", "Row E"),
        ("F", "Row F (Electric)"),
    ]

    id = models.CharField(max_length=5, primary_key=True)
    row = models.CharField(max_length=1, choices=ROW_CHOICES)
    number = models.IntegerField()
    is_electric = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        self.is_electric = self.row in ["A", "F"]
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["row", "number"]

    def __str__(self):
        return f"Spot {self.id}"


class Reservation(models.Model):
    STATUS_CHOICES = [
        ("CONFIRMED", "Confirmed"),
        ("CHECKED_IN", "Checked In"),
        ("CANCELLED", "Cancelled"),
        ("EXPIRED", "Expired (No check-in)"),
    ]

    SLOT_CHOICES = [("AM", "Morning"), ("PM", "Afternoon")]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reservations"
    )
    spot = models.ForeignKey(
        ParkingSpot, on_delete=models.CASCADE, related_name="reservations"
    )
    date = models.DateField()
    slot = models.CharField(max_length=2, choices=SLOT_CHOICES, default="AM")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="CONFIRMED")
    check_in_time = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "slot", "spot"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "date", "slot"],
                condition=Q(status__in=["CONFIRMED", "CHECKED_IN"]),
                name="uniq_active_reservation_per_user_per_date_slot",
            ),
        ]

    def __str__(self):
        return f"{self.user} - {self.spot} on {self.date} {self.slot} ({self.status})"
