"""Dev authentication middleware - creates/gets user from X-Dev-User header."""

from django.contrib.auth import get_user_model

User = get_user_model()


class DevAuthMiddleware:
    """
    Development-only middleware that authenticates users via X-Dev-User header.
    This simulates login without a real auth system for the walking skeleton.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        dev_user = request.headers.get('X-Dev-User')
        
        if dev_user:
            user, _ = User.objects.get_or_create(
                username=dev_user,
                defaults={
                    'email': f'{dev_user}@example.com',
                    'is_staff': dev_user in ['admin', 'secretary', 'manager'],
                }
            )
            request.user = user
        
        return self.get_response(request)
