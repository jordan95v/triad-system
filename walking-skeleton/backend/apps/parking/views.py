from datetime import datetime, timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Reservation, ParkingSpot
from .permissions import IsManager, IsStaffLike
from .serializers import ReservationSerializer, ParkingSpotSerializer


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

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Reservation.objects.none()
        role = getattr(user, "role", "employee")
        if role == "employee":
            return Reservation.objects.filter(user=user)

        return Reservation.objects.filter(user=user)

    @action(detail=False, methods=["get"], url_path="admin", permission_classes=[IsStaffLike])
    def admin_list(self, request):
        qs = Reservation.objects.all().order_by("-date", "slot", "spot_id")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="stats", permission_classes=[IsManager])
    def stats(self, request):
        today = timezone.localdate()

        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")

        try:
            date_from = datetime.strptime(from_str, "%Y-%m-%d").date() if from_str else (today - timedelta(days=6))
            date_to = datetime.strptime(to_str, "%Y-%m-%d").date() if to_str else today
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

        qs = Reservation.objects.filter(date__gte=date_from, date__lte=date_to)

        total = qs.count()
        expired = qs.filter(status="EXPIRED").count()
        checked_in = qs.filter(status="CHECKED_IN").count()
        cancelled = qs.filter(status="CANCELLED").count()
        confirmed = qs.filter(status="CONFIRMED").count()

        electric_total = qs.filter(spot__is_electric=True).count()

        days = (date_to - date_from).days + 1
        capacity = 60 * 2 * days

        occupancy_rate = (total / capacity) if capacity else 0
        no_show_rate = (expired / total) if total else 0
        electric_rate = (electric_total / total) if total else 0

        split = qs.values("slot").annotate(count=Count("id"))
        split_map = {item["slot"]: item["count"] for item in split}

        return Response({
            "from": str(date_from),
            "to": str(date_to),
            "total_reservations": total,
            "by_status": {
                "CONFIRMED": confirmed,
                "CHECKED_IN": checked_in,
                "CANCELLED": cancelled,
                "EXPIRED": expired,
            },
            "occupancy_rate": occupancy_rate,
            "no_show_rate": no_show_rate,
            "electric_rate": electric_rate,
            "by_slot": {
                "AM": split_map.get("AM", 0),
                "PM": split_map.get("PM", 0),
            },
        })
