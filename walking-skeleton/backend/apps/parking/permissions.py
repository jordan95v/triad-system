from rest_framework.permissions import BasePermission


def _role(request):
    return getattr(getattr(request, "user", None), "role", None)


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return _role(request) == "manager"


class IsSecretary(BasePermission):
    def has_permission(self, request, view):
        return _role(request) == "secretary"


class IsStaffLike(BasePermission):
    # manager OU secretary
    def has_permission(self, request, view):
        return _role(request) in ["manager", "secretary"]
