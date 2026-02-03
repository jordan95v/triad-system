"""Seed script to create 60 parking spots (A01-F10)."""

from apps.parking.models import ParkingSpot

rows = ['A', 'B', 'C', 'D', 'E', 'F']

for row in rows:
    for num in range(1, 11):
        spot_id = f"{row}{num:02d}"
        ParkingSpot.objects.get_or_create(
            id=spot_id,
            defaults={
                'row': row,
                'number': num,
            }
        )
        print(f"Created spot {spot_id}")

print(f"\nTotal spots: {ParkingSpot.objects.count()}")
