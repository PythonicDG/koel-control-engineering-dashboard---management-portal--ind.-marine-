import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


def _new_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


class Entity(models.Model):
    """Base for all portal records.

    The frontend identifies records by string ids (proj-..., ecn-...) and
    creates them client-side, so the primary key is a string. If a client does
    not send one, the server generates it.
    """

    ID_PREFIX = "rec"

    id = models.CharField(primary_key=True, max_length=64)
    inserted_at = models.DateTimeField(default=timezone.now, editable=False, db_index=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _new_id(self.ID_PREFIX)
        super().save(*args, **kwargs)


class User(AbstractUser):
    """Portal account. Passwords are hashed by Django (never stored in clear text)."""

    ROLE_CHOICES = [("admin", "Admin"), ("engineer", "Engineer")]

    id = models.CharField(primary_key=True, max_length=64)
    full_name = models.CharField(max_length=200, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="engineer")
    department = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["date_joined", "id"]

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _new_id("usr")
        # Superusers (createsuperuser) are portal admins; role drives Django admin access.
        if self.is_superuser:
            self.role = "admin"
        self.is_staff = self.role == "admin"
        super().save(*args, **kwargs)

    @property
    def last_login_display(self):
        if not self.last_login:
            return "Never"
        return timezone.localtime(self.last_login).strftime("%Y-%m-%d %I:%M %p")


class Project(Entity):
    ID_PREFIX = "proj"
    STATUS_CHOICES = [(s, s) for s in ("OPEN", "IN_PROGRESS", "UNDER_REVIEW", "CLOSED")]

    project_code = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="OPEN", db_index=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    progress_percent = models.PositiveSmallIntegerField(default=0)
    # The 53-point design input sheet and sub-project tree (incl. SOTR) are
    # deeply nested documents edited as a whole, so they are stored as JSON.
    design_inputs = models.JSONField(default=dict)
    sub_projects = models.JSONField(default=list, blank=True)
    ecn_ids = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["-inserted_at", "id"]

    def __str__(self):
        return self.project_code


class EcnEcr(Entity):
    ID_PREFIX = "ecn"

    change_type = models.CharField(max_length=3, choices=[("ECN", "ECN"), ("ECR", "ECR")])
    manual_change_number = models.CharField(max_length=100)
    project_id = models.CharField(max_length=64, db_index=True)
    project_code = models.CharField(max_length=64)
    project_name = models.CharField(max_length=255, blank=True)
    part_description = models.TextField()
    reason_for_change = models.TextField(blank=True)
    engineer_name = models.CharField(max_length=200, blank=True)
    date_logged = models.CharField(max_length=32)
    status = models.CharField(max_length=30, default="Open")
    impact_analysis = models.TextField(blank=True)
    affected_components = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["-inserted_at", "id"]
        verbose_name = "ECN / ECR"

    def __str__(self):
        return self.manual_change_number


class SiteVisit(Entity):
    ID_PREFIX = "sv"

    visit_date = models.CharField(max_length=32)
    shipyard_name = models.CharField(max_length=255)
    customer_name = models.CharField(max_length=255, blank=True)
    vessel_yard_number = models.CharField(max_length=255, blank=True)
    engineer_name = models.CharField(max_length=200, blank=True)
    purpose = models.TextField(blank=True)
    findings = models.TextField(blank=True)
    action_items = models.TextField(blank=True)
    uploaded_document_name = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=30, default="Scheduled")

    class Meta:
        ordering = ["-inserted_at", "id"]


class AlternatorCatalogItem(Entity):
    ID_PREFIX = "alt"

    model = models.CharField(max_length=100)
    series = models.CharField(max_length=100, blank=True)
    rating_kva = models.FloatField(default=0)
    voltage_v = models.FloatField(default=0)
    frequency_hz = models.FloatField(default=50)
    rpm = models.FloatField(default=1500)
    frame_size = models.CharField(max_length=50, blank=True)
    ip_protection = models.CharField(max_length=20, blank=True)
    efficiency_pct = models.FloatField(default=0)
    cooling = models.CharField(max_length=100, blank=True)
    weight_kg = models.FloatField(default=0)
    marine_approved_societies = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["-inserted_at", "id"]

    def __str__(self):
        return self.model


class InspectionAuthority(Entity):
    ID_PREFIX = "auth"

    code = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=255)
    country = models.CharField(max_length=100, blank=True)
    marine_rules_edition = models.CharField(max_length=255, blank=True)
    standard_temp_rise_limits = models.TextField(blank=True)
    witness_testing_requirements = models.TextField(blank=True)
    official_rule_document_name = models.CharField(max_length=255, blank=True)
    pdf_url = models.CharField(max_length=500, blank=True, null=True)
    contact_representative = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["inserted_at", "id"]
        verbose_name_plural = "inspection authorities"

    def __str__(self):
        return self.code


class FormFieldConfig(Entity):
    ID_PREFIX = "fld"

    form_id = models.CharField(max_length=20, db_index=True)
    field_key = models.CharField(max_length=100)
    label = models.CharField(max_length=255)
    section = models.CharField(max_length=255, blank=True)
    type = models.CharField(max_length=20, default="text")
    is_mandatory = models.BooleanField(default=False)
    is_custom = models.BooleanField(default=False)
    options = models.JSONField(null=True, blank=True)
    default_value = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ["inserted_at", "id"]

    def __str__(self):
        return f"{self.form_id}.{self.field_key}"


class TrialRecord(Entity):
    ID_PREFIX = "tr"

    trial_code = models.CharField(max_length=64)
    project_code = models.CharField(max_length=64)
    vessel_name = models.CharField(max_length=255)
    trial_type = models.CharField(max_length=30)
    date = models.CharField(max_length=32)
    shipyard = models.CharField(max_length=255)
    classification_society = models.CharField(max_length=100, blank=True)
    surveyor_name = models.CharField(max_length=200, blank=True)
    load_test_profile = models.TextField(blank=True)
    voltage_dip_pct = models.FloatField(default=0)
    frequency_recovery_sec = models.FloatField(default=0)
    oil_pressure_bar = models.FloatField(default=0)
    cooling_water_temp_c = models.FloatField(default=0)
    status = models.CharField(max_length=40, default="Under Observation")
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ["-inserted_at", "id"]


class DrawingItem(Entity):
    ID_PREFIX = "dwg"

    drawing_number = models.CharField(max_length=150)
    revision = models.CharField(max_length=30)
    title = models.CharField(max_length=500)
    project_code = models.CharField(max_length=64)
    category = models.CharField(max_length=60)
    cad_format = models.CharField(max_length=10)
    plm_release_status = models.CharField(max_length=40)
    release_date = models.CharField(max_length=32, blank=True)
    designer = models.CharField(max_length=200, blank=True)
    approver = models.CharField(max_length=200, blank=True)
    classification_approval = models.CharField(max_length=40, blank=True)

    class Meta:
        ordering = ["-inserted_at", "id"]
