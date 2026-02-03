from django.db import models
from django.conf import settings
from django.utils import timezone


class ParkingSpot(models.Model):
    """Parking spot model - 60 spots organized in 6 rows (A-F) x 10."""

    ROW_CHOICES = [
        ("A", "Row A (Electric)"),
        ("B", "Row B"),
        ("C", "Row C"),
        ("D", "Row D"),
        ("E", "Row E"),
        ("F", "Row F (Electric)"),
    ]

    id = models.CharField(max_length=5, primary_key=True)  # e.g. "A01"
    row = models.CharField(max_length=1, choices=ROW_CHOICES)
    number = models.IntegerField()
    is_electric = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # Auto-set electric for rows A and F
        self.is_electric = self.row in ["A", "F"]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Spot {self.id}"

    class Meta:
        ordering = ["row", "number"]


class Reservation(models.Model):
    """Reservation model for parking spots."""

    STATUS_CHOICES = [
        ("CONFIRMED", "Confirmed"),
        ("CHECKED_IN", "Checked In"),
        ("CANCELLED", "Cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reservations"
    )
    spot = models.ForeignKey(
        ParkingSpot, on_delete=models.CASCADE, related_name="reservations"
    )
    date = models.DateField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="CONFIRMED"
    )
    check_in_time = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["spot", "date"]  # Prevent double booking
        ordering = ["-date", "spot"]

    def __str__(self):
        return f"{self.user} - {self.spot} on {self.date} ({self.status})"
