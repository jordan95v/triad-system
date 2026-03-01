# apps/parking/auth.py (ou où tu l'as mis)
from django.contrib.auth import get_user_model
from rest_framework import authentication

User = get_user_model()

ROLE_TO_STAFF = {"secretary": True, "manager": True, "admin": True}


class DevAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        dev_user = request.headers.get("X-Dev-User")
        if not dev_user:
            return None

        username = dev_user.strip().lower()

        user, _ = User.objects.get_or_create(
            username=username,
            defaults={
                "email": f"{username}@example.com",
                "is_staff": ROLE_TO_STAFF.get(username, False),
            },
        )

        # 👇 IMPORTANT : role "virtuel" (pas en DB)
        user.role = username if username in ["employee", "manager", "secretary"] else "employee"

        return (user, None)
