from rest_framework import permissions

class IsSuperAdminUser(permissions.BasePermission):
    """
    Ruxsatnoma: Faqatgina superuser yoki staff maqomiga ega bo'lgan Master Adminlarga ruxsat beradi.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser))
