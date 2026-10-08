from rest_framework import permissions
from .models import ClubMember, ClubMemberRole

class IsClubOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        club_id = request.headers.get('X-Club-Id') or request.query_params.get('club_id')
        if not club_id:
            # club_id yo'q bo'lsa faqat o'qish uchun ruxsat
            return request.method in permissions.SAFE_METHODS
        return ClubMember.objects.filter(club_id=club_id, user=request.user, role=ClubMemberRole.OWNER).exists()

    def has_object_permission(self, request, view, obj):
        club = getattr(obj, 'club', obj)
        return ClubMember.objects.filter(club=club, user=request.user, role=ClubMemberRole.OWNER).exists() or club.owner == request.user

class IsClubStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        club_id = request.headers.get('X-Club-Id') or request.query_params.get('club_id')
        if not club_id:
            # club_id yo'q bo'lsa faqat o'qish uchun ruxsat
            return request.method in permissions.SAFE_METHODS
        return ClubMember.objects.filter(club_id=club_id, user=request.user, is_active=True).exists()

    def has_object_permission(self, request, view, obj):
        club = getattr(obj, 'club', obj)
        return ClubMember.objects.filter(club=club, user=request.user, is_active=True).exists() or club.owner == request.user

class HasActiveSubscription(permissions.BasePermission):
    message = "Klub obuna muddati tugagan. Amallarni davom ettirish uchun to'lovni amalga oshiring."

    def has_permission(self, request, view):
        # Allow read-only methods (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        club_id = request.headers.get('X-Club-Id') or request.data.get('club_id') or request.query_params.get('club_id')
        if not club_id:
            # Write operatsiyalarda club_id majburiy — xavfsizlik uchun
            # Ba'zi view'lar o'zida tekshirishni bajaradi, shuning uchun True qaytaramiz
            # lekin ular o'zlari club ni olishda tekshirishadi
            return True
        
        # Check subscription
        from .models import Club
        try:
            club = Club.objects.get(id=club_id)
            if not club.is_active:
                self.message = "Klub bloklangan. Administrator bilan bog'laning."
                return False
            return club.has_active_subscription
        except Club.DoesNotExist:
            return True
