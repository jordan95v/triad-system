from django.contrib.auth import get_user_model
from rest_framework import authentication

User = get_user_model()


class DevAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        dev_user = request.headers.get("X-Dev-User")

        if not dev_user:
            return None

        user, _ = User.objects.get_or_create(
            username=dev_user,
            defaults={
                "email": f"{dev_user}@example.com",
                "is_staff": dev_user in ["admin", "secretary", "manager"],
            },
        )

        return (user, None)
