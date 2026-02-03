from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import ParkingSpot, Reservation


class ParkingSpotSerializer(serializers.ModelSerializer):
    """Serializer for parking spots with availability status."""

    is_available = serializers.SerializerMethodField()

    class Meta:
        model = ParkingSpot
        fields = ["id", "row", "number", "is_electric", "is_available"]

    def get_is_available(self, obj):
        """Check if spot is available today."""
        today = timezone.now().date()
        return not obj.reservations.filter(
            date=today, status__in=["CONFIRMED", "CHECKED_IN"]
        ).exists()


class ReservationSerializer(serializers.ModelSerializer):
    """Serializer for reservations with business rule validation."""

    user = serializers.StringRelatedField(read_only=True)
    spot_id = serializers.CharField(source="spot.id", read_only=True)

    class Meta:
        model = Reservation
        fields = [
            "id",
            "user",
            "spot",
            "spot_id",
            "date",
            "status",
            "check_in_time",
            "created_at",
        ]
        read_only_fields = ["user", "status", "check_in_time", "created_at"]
        extra_kwargs = {
            "spot": {"error_messages": {"does_not_exist": "Invalid parking spot ID."}}
        }

    def validate_date(self, value):
        """Validate reservation date follows business rules."""
        today = timezone.now().date()

        # Cannot reserve in the past
        if value < today:
            raise serializers.ValidationError("Cannot reserve a spot in the past.")

        # Maximum 5 days in advance (for employees)
        # Note: Manager check would be done in the view
        max_date = today + timedelta(days=5)
        if value > max_date:
            raise serializers.ValidationError(
                "Cannot reserve more than 5 days in advance."
            )

        return value

    def validate(self, data):
        """Validate spot is available for the requested date."""
        spot = data.get("spot")
        date = data.get("date")

        if spot and date:
            # Check if spot is already reserved for this date
            existing = Reservation.objects.filter(
                spot=spot, date=date, status__in=["CONFIRMED", "CHECKED_IN"]
            ).exists()

            if existing:
                raise serializers.ValidationError(
                    f"Spot {spot.id} is already reserved for {date}."
                )

        return data

    def create(self, validated_data):
        user = self.context["request"].user
        if user.is_anonymous:
            raise serializers.ValidationError(
                "Authentication required. Please login first."
            )
        validated_data["user"] = user
        return super().create(validated_data)
