from datetime import time

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.parking.models import Reservation


class Command(BaseCommand):
    help = "Expire CONFIRMED reservations without check-in after 11:00 for the current slot/day."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Don't update DB, only print what would be expired.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Ignore time rule and run expiration anyway (useful for tests).",
        )

    def handle(self, *args, **options):
        dry_run: bool = options["dry_run"]
        force: bool = options["force"]

        now = timezone.localtime()
        today = now.date()

        # Slot of the day based on current time
        slot = "AM" if now.hour < 12 else "PM"

        # Business rule: if no check-in by 11:00 AM, reservation becomes available.
        cutoff = time(11, 0)

        if slot == "AM" and (now.time() < cutoff) and not force:
            self.stdout.write(
                self.style.WARNING(
                    f"Not expiring yet: now={now.time().strftime('%H:%M:%S')} < 11:00 (use --force to override)."
                )
            )
            return

        # NOTE: The spec mentions 11AM for freeing the space.
        # It makes the most sense for AM reservations. For PM, you can decide another cutoff later.
        # Here: AM expires after 11:00; PM does not auto-expire unless --force.
        if slot == "PM" and not force:
            self.stdout.write(
                self.style.WARNING(
                    "PM slot expiration is not applied by default (use --force if you want to expire PM too)."
                )
            )
            return

        qs = Reservation.objects.filter(
            date=today,
            slot=slot,
            status="CONFIRMED",
        )

        count = qs.count()

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"[DRY RUN] Would expire {count} reservation(s) for {today} {slot}."
                )
            )
            return

        updated = qs.update(status="EXPIRED")
        self.stdout.write(
            self.style.SUCCESS(
                f"Expired {updated} reservation(s) for {today} {slot}."
            )
        )
