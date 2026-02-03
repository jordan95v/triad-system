from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import ParkingSpot, Reservation
from .serializers import ParkingSpotSerializer, ReservationSerializer


class ParkingSpotViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for listing parking spots."""
    
    queryset = ParkingSpot.objects.all()
    serializer_class = ParkingSpotSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """List spots available for a given date (defaults to today)."""
        date_str = request.query_params.get('date')
        if date_str:
            from datetime import datetime
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            target_date = timezone.now().date()
        
        reserved_spots = Reservation.objects.filter(
            date=target_date,
            status__in=['CONFIRMED', 'CHECKED_IN']
        ).values_list('spot_id', flat=True)
        
        available = self.queryset.exclude(id__in=reserved_spots)
        serializer = self.get_serializer(available, many=True)
        return Response(serializer.data)


class ReservationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing reservations."""
    
    serializer_class = ReservationSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.is_staff:
                return Reservation.objects.all()
            return Reservation.objects.filter(user=user)
        return Reservation.objects.none()
    
    @action(detail=False, methods=['post'], url_path='check-in/(?P<spot_id>[^/.]+)')
    def check_in(self, request, spot_id=None):
        """Check in to a spot by scanning QR code."""
        today = timezone.now().date()
        
        try:
            reservation = Reservation.objects.get(
                spot_id=spot_id,
                date=today,
                status='CONFIRMED'
            )
            reservation.status = 'CHECKED_IN'
            reservation.check_in_time = timezone.now()
            reservation.save()
            
            return Response({
                'status': 'checked_in',
                'spot': spot_id,
                'user': reservation.user.username
            })
        except Reservation.DoesNotExist:
            return Response(
                {'error': 'No active reservation found for this spot today.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a reservation."""
        reservation = self.get_object()
        if reservation.status != 'CANCELLED':
            reservation.status = 'CANCELLED'
            reservation.save()
            return Response({'status': 'cancelled'})
        return Response(
            {'status': 'already cancelled'},
            status=status.HTTP_400_BAD_REQUEST
        )
