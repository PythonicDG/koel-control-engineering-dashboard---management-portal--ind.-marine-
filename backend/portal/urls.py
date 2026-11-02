from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter(trailing_slash=False)
router.register("users", views.UserViewSet, basename="user")
router.register("projects", views.ProjectViewSet, basename="project")
router.register("ecns", views.EcnViewSet, basename="ecn")
router.register("site-visits", views.SiteVisitViewSet, basename="sitevisit")
router.register("alternators", views.AlternatorViewSet, basename="alternator")
router.register("authorities", views.InspectionAuthorityViewSet, basename="authority")
router.register("form-fields", views.FormFieldViewSet, basename="formfield")
router.register("trials", views.TrialViewSet, basename="trial")
router.register("drawings", views.DrawingViewSet, basename="drawing")

urlpatterns = [
    path("auth/login", views.LoginView.as_view(), name="login"),
    path("auth/logout", views.logout, name="logout"),
    path("auth/me", views.me, name="me"),
    path("admin/reset-sample-data", views.reset_sample_data, name="reset-sample-data"),
    path("", include(router.urls)),
]
