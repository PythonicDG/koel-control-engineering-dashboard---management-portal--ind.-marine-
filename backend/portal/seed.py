"""Sample data loader (the data the app shipped with as browser-only demo data)."""
import json
from datetime import datetime, timedelta
from pathlib import Path

from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from . import models
from .serializers import to_snake

SEED_FILE = Path(__file__).resolve().parent / "fixtures" / "seed.json"

# (json key, model, newest-first?)  -- newest-first lists are inserted so the
# first sample item ends up on top, exactly like the original app.
COLLECTIONS = [
    ("authorities", models.InspectionAuthority, False),
    ("form_fields", models.FormFieldConfig, False),
    ("alternators", models.AlternatorCatalogItem, True),
    ("projects", models.Project, True),
    ("ecns", models.EcnEcr, True),
    ("site_visits", models.SiteVisit, True),
    ("trials", models.TrialRecord, True),
    ("drawings", models.DrawingItem, True),
]
OPERATIONAL = ("projects", "ecns", "site_visits")


def _load():
    return json.loads(SEED_FILE.read_text(encoding="utf-8"))


def _stamp(i, newest_first):
    base = timezone.now()
    return base - timedelta(milliseconds=i) if newest_first else base + timedelta(milliseconds=i)


def _seed_users(rows):
    for i, row in enumerate(rows):
        last_login = None
        if row.get("lastLogin"):
            try:
                last_login = timezone.make_aware(datetime.strptime(row["lastLogin"], "%Y-%m-%d %I:%M %p"))
            except ValueError:
                pass
        user = models.User(
            id=row["id"],
            username=row["username"],
            full_name=row["fullName"],
            role=row["role"],
            email=row.get("email", ""),
            department=row.get("department", ""),
            is_active=row.get("active", True),
            last_login=last_login,
        )
        user.set_password(row["password"])
        user.save()


def _seed_rows(key, model, rows, newest_first):
    objs = []
    for i, row in enumerate(rows):
        data = {to_snake(k): v for k, v in row.items()}
        if model is models.Project:
            for f in ("created_at", "updated_at"):
                data[f] = parse_datetime(data[f])
        objs.append(model(inserted_at=_stamp(i, newest_first), **data))
    model.objects.bulk_create(objs)


@transaction.atomic
def seed_all():
    """Idempotent: each table is only filled if it is currently empty."""
    seed = _load()
    created = []
    if not models.User.objects.exists():
        _seed_users(seed["users"])
        created.append("users")
    for key, model, newest_first in COLLECTIONS:
        if not model.objects.exists():
            _seed_rows(key, model, seed[key], newest_first)
            created.append(key)
    return created


@transaction.atomic
def reset_operational_data():
    """Wipe projects, ECNs and site visits and restore the sample records."""
    seed = _load()
    for key, model, newest_first in COLLECTIONS:
        if key in OPERATIONAL:
            model.objects.all().delete()
            _seed_rows(key, model, seed[key], newest_first)
