from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from . import models


@admin.register(models.User)
class PortalUserAdmin(UserAdmin):
    list_display = ("username", "full_name", "role", "email", "is_active")
    fieldsets = UserAdmin.fieldsets + (("Portal", {"fields": ("full_name", "role", "department")}),)
    add_fieldsets = UserAdmin.add_fieldsets + (("Portal", {"fields": ("full_name", "role", "department")}),)


for _m in (
    models.Project,
    models.EcnEcr,
    models.SiteVisit,
    models.AlternatorCatalogItem,
    models.InspectionAuthority,
    models.FormFieldConfig,
    models.TrialRecord,
    models.DrawingItem,
):
    admin.site.register(_m)
