from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers

from .models import ParkingSpot, Reservation


class ParkingSpotSerializer(serializers.ModelSerializer):
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = ParkingSpot
        fields = ["id", "row", "number", "is_electric", "is_available"]

    def get_is_available(self, obj):
        target_date = self.context.get("target_date") or timezone.now().date()
        slot = self.context.get("slot") or "AM"

        return not obj.reservations.filter(
            date=target_date,
            slot=slot,
            status__in=["CONFIRMED", "CHECKED_IN"],
        ).exists()


class ReservationSerializer(serializers.ModelSerializer):
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
            "slot",
            "status",
            "check_in_time",
            "created_at",
        ]
        read_only_fields = ["user", "status", "check_in_time", "created_at"]
        extra_kwargs = {
            "spot": {"error_messages": {"does_not_exist": "Invalid parking spot ID."}}
        }

    def validate_slot(self, value: str):
        if value not in ["AM", "PM"]:
            raise serializers.ValidationError("Invalid slot. Use AM or PM.")
        return value

    def validate_date(self, value):
        today = timezone.now().date()

        if value < today:
            raise serializers.ValidationError("Cannot reserve a spot in the past.")

        max_date = today + timedelta(days=5)
        if value > max_date:
            raise serializers.ValidationError("Cannot reserve more than 5 days in advance.")

        return value

    def validate(self, data):
        spot = data.get("spot")
        date = data.get("date")
        slot = data.get("slot", "AM")

        if spot and date:
            exists = Reservation.objects.filter(
                spot=spot,
                date=date,
                slot=slot,
                status__in=["CONFIRMED", "CHECKED_IN"],
            ).exists()
            if exists:
                raise serializers.ValidationError(
                    f"Spot {spot.id} already reserved for {date} ({slot})."
                )
        return data

    def create(self, validated_data):
        user = self.context["request"].user
        if user.is_anonymous:
            raise serializers.ValidationError("Authentication required. Please login first.")
        validated_data["user"] = user
        return super().create(validated_data)
