from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from . import models, seed, serializers

# Employee-id style logins that map onto a portal username.
LOGIN_ALIASES = {
    "kgc\\aag1000972": "admin",
    "aag1000972": "admin",
}


# --------------------------------------------------------------------------- permissions
class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class AdminWritesOnly(permissions.BasePermission):
    """Everyone signed in can read; only admins can create/change/delete."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return request.method in permissions.SAFE_METHODS or user.role == "admin"


class AdminDeletesOnly(permissions.BasePermission):
    """Signed-in engineers can read/create/edit; only admins can delete."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return request.method != "DELETE" or user.role == "admin"


# --------------------------------------------------------------------------- auth
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        username = str(request.data.get("username", "")).strip().lower()
        password = str(request.data.get("password", "")).strip()
        if not username or not password:
            return Response(
                {"detail": "User ID and password are required."}, status=status.HTTP_400_BAD_REQUEST
            )

        username = LOGIN_ALIASES.get(username, username)
        user = (
            models.User.objects.filter(username__iexact=username).first()
            or models.User.objects.filter(email__iexact=username).first()
        )
        # Same message for unknown user and wrong password: do not reveal which accounts exist.
        if user is None or not user.check_password(password):
            return Response(
                {"detail": "Authentication failed: invalid user ID or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {"detail": "This account is deactivated. Please contact the administrator."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": serializers.UserSerializer(user).data})


@api_view(["POST"])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def me(request):
    return Response(serializers.UserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def reset_sample_data(request):
    """Restore the factory sample projects, ECNs and site visits (admin only)."""
    seed.reset_operational_data()
    return Response({"detail": "Sample data restored."})


# --------------------------------------------------------------------------- resources
class UserViewSet(viewsets.ModelViewSet):
    queryset = models.User.objects.all()
    serializer_class = serializers.UserSerializer
    permission_classes = [AdminWritesOnly]

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise PermissionDenied("You cannot delete your own account.")
        instance.delete()


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = models.Project.objects.all()
    serializer_class = serializers.ProjectSerializer
    permission_classes = [AdminDeletesOnly]


class EcnViewSet(viewsets.ModelViewSet):
    queryset = models.EcnEcr.objects.all()
    serializer_class = serializers.EcnEcrSerializer
    permission_classes = [AdminDeletesOnly]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Log an ECN/ECR and apply Rule 1.

        Rule 1: logging a change notice against a CLOSED project automatically
        re-opens that project. The response carries the new notice, the updated
        project and whether the project was re-opened.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ecn = serializer.save()

        project = (
            models.Project.objects.select_for_update().filter(pk=ecn.project_id).first()
            or models.Project.objects.select_for_update().filter(project_code=ecn.project_code).first()
        )
        did_reopen = False
        project_data = None
        if project is not None:
            if ecn.id not in project.ecn_ids:
                project.ecn_ids = [*project.ecn_ids, ecn.id]
            if project.status == "CLOSED":
                project.status = "OPEN"
                did_reopen = True
            project.updated_at = timezone.now()
            project.save()
            project_data = serializers.ProjectSerializer(project).data

        return Response(
            {"ecn": serializer.data, "project": project_data, "didReopen": did_reopen},
            status=status.HTTP_201_CREATED,
        )


class SiteVisitViewSet(viewsets.ModelViewSet):
    queryset = models.SiteVisit.objects.all()
    serializer_class = serializers.SiteVisitSerializer
    permission_classes = [AdminDeletesOnly]


class AlternatorViewSet(viewsets.ModelViewSet):
    queryset = models.AlternatorCatalogItem.objects.all()
    serializer_class = serializers.AlternatorSerializer
    permission_classes = [AdminDeletesOnly]


class InspectionAuthorityViewSet(viewsets.ModelViewSet):
    queryset = models.InspectionAuthority.objects.all()
    serializer_class = serializers.InspectionAuthoritySerializer
    permission_classes = [AdminDeletesOnly]


class FormFieldViewSet(viewsets.ModelViewSet):
    queryset = models.FormFieldConfig.objects.all()
    serializer_class = serializers.FormFieldSerializer
    permission_classes = [AdminWritesOnly]


class TrialViewSet(viewsets.ModelViewSet):
    queryset = models.TrialRecord.objects.all()
    serializer_class = serializers.TrialSerializer
    permission_classes = [AdminDeletesOnly]


class DrawingViewSet(viewsets.ModelViewSet):
    queryset = models.DrawingItem.objects.all()
    serializer_class = serializers.DrawingSerializer
    permission_classes = [AdminDeletesOnly]
