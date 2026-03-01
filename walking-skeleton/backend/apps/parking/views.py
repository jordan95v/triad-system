from datetime import datetime

from django.db import transaction, IntegrityError
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import ParkingSpot, Reservation
from .serializers import ParkingSpotSerializer, ReservationSerializer


class ParkingSpotViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ParkingSpot.objects.all()
    serializer_class = ParkingSpotSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=["get"])
    def available(self, request):
        date_str = request.query_params.get("date")
        slot = request.query_params.get("slot", "AM")

        if slot not in ["AM", "PM"]:
            return Response({"error": "Invalid slot. Use AM or PM."}, status=400)

        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)
        else:
            target_date = timezone.now().date()

        reserved_spot_ids = Reservation.objects.filter(
            date=target_date,
            slot=slot,
            status__in=["CONFIRMED", "CHECKED_IN"],
        ).values_list("spot_id", flat=True)

        available = self.queryset.exclude(id__in=reserved_spot_ids)

        serializer = self.get_serializer(
            available, many=True, context={"target_date": target_date, "slot": slot}
        )
        return Response(serializer.data)


class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.is_staff:
                return Reservation.objects.all()
            return Reservation.objects.filter(user=user)
        return Reservation.objects.none()

    @action(detail=False, methods=["post"], url_path="check-in/(?P<spot_id>[^/.]+)")
    def check_in(self, request, spot_id=None):
        today = timezone.now().date()

        now = timezone.localtime()
        slot = "AM" if now.hour < 12 else "PM"

        try:
            reservation = Reservation.objects.get(
                spot_id=spot_id,
                date=today,
                slot=slot,
                status="CONFIRMED",
            )
            reservation.status = "CHECKED_IN"
            reservation.check_in_time = timezone.now()
            reservation.save()

            return Response({"status": "checked_in", "spot": spot_id, "slot": slot, "user": reservation.user.username})
        except Reservation.DoesNotExist:
            return Response(
                {"error": f"No active reservation found for this spot today ({slot})."},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        if reservation.status != "CANCELLED":
            reservation.status = "CANCELLED"
            reservation.save()
            return Response({"status": "cancelled"})
        return Response({"status": "already cancelled"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        reservation = self.get_object()

        if reservation.status != "CANCELLED":
            return Response({"error": "Only cancelled reservations can be restored."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                conflict = Reservation.objects.filter(
                    spot=reservation.spot,
                    date=reservation.date,
                    slot=reservation.slot,
                    status__in=["CONFIRMED", "CHECKED_IN"],
                ).exists()

                if conflict:
                    return Response({"error": "Spot is already reserved."}, status=status.HTTP_409_CONFLICT)

                reservation.status = "CONFIRMED"
                reservation.save()

            return Response({"status": "restored"})
        except IntegrityError:
            return Response({"error": "Spot is already reserved."}, status=status.HTTP_409_CONFLICT)
