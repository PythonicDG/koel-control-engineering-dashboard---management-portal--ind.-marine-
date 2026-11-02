import re

from django.utils import timezone
from rest_framework import serializers

from . import models

_ID_RE = re.compile(r"^[A-Za-z0-9_.:-]{1,64}$")


def to_camel(name):
    head, *tail = name.split("_")
    return head + "".join(p[:1].upper() + p[1:] for p in tail)


def to_snake(name):
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


class CamelModelSerializer(serializers.ModelSerializer):
    """Speaks the frontend's camelCase at the top level only.

    JSON documents stored inside a field (designInputs, subProjects, ...) are
    passed through untouched so their keys are never rewritten.
    """

    id = serializers.CharField(max_length=64, required=False)

    class Meta:
        exclude = ("inserted_at",)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {to_camel(k): v for k, v in data.items()}

    def to_internal_value(self, data):
        if hasattr(data, "items"):
            data = {to_snake(k): v for k, v in data.items()}
        return super().to_internal_value(data)

    def validate_id(self, value):
        if not _ID_RE.match(value):
            raise serializers.ValidationError("Invalid id.")
        if self.instance is None and self.Meta.model.objects.filter(pk=value).exists():
            raise serializers.ValidationError("A record with this id already exists.")
        return value

    def update(self, instance, validated_data):
        validated_data.pop("id", None)  # ids are immutable
        return super().update(instance, validated_data)


def make_serializer(model_cls, **extra_meta):
    meta = type("Meta", (CamelModelSerializer.Meta,), {"model": model_cls, **extra_meta})
    return type(f"{model_cls.__name__}Serializer", (CamelModelSerializer,), {"Meta": meta})


EcnEcrSerializer = make_serializer(models.EcnEcr)
SiteVisitSerializer = make_serializer(models.SiteVisit)
AlternatorSerializer = make_serializer(models.AlternatorCatalogItem)
InspectionAuthoritySerializer = make_serializer(models.InspectionAuthority)
FormFieldSerializer = make_serializer(models.FormFieldConfig)
TrialSerializer = make_serializer(models.TrialRecord)
DrawingSerializer = make_serializer(models.DrawingItem)


class ProjectSerializer(CamelModelSerializer):
    class Meta(CamelModelSerializer.Meta):
        model = models.Project
        read_only_fields = ("updated_at",)

    def validate_design_inputs(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("designInputs must be an object.")
        return value

    def validate_sub_projects(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("subProjects must be a list.")
        return value

    def validate_ecn_ids(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("ecnIds must be a list.")
        return value

    def validate(self, attrs):
        # Rule 2: a project may only be moved to CLOSED once every sub-project
        # has been released in PLM (and there is at least one).
        target = attrs.get("status")
        was_closed = self.instance is not None and self.instance.status == "CLOSED"
        if target == "CLOSED" and not was_closed:
            subs = attrs.get("sub_projects", self.instance.sub_projects if self.instance else [])
            unreleased = [s for s in subs if s.get("plmStatus") != "Released in PLM"]
            if not subs or unreleased:
                raise serializers.ValidationError(
                    {"status": "A project can only be CLOSED when all sub-projects are 'Released in PLM'."}
                )
        return attrs

    def create(self, validated_data):
        validated_data["updated_at"] = timezone.now()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("created_at", None)
        validated_data["updated_at"] = timezone.now()
        return super().update(instance, validated_data)


class UserSerializer(serializers.ModelSerializer):
    """Account representation. The password is write-only and always hashed."""

    id = serializers.CharField(max_length=64, required=False)
    fullName = serializers.CharField(source="full_name", max_length=200)
    lastLogin = serializers.CharField(source="last_login_display", read_only=True)
    active = serializers.BooleanField(source="is_active", required=False, default=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, trim_whitespace=True)
    email = serializers.CharField(max_length=254, required=False, allow_blank=True)
    department = serializers.CharField(max_length=200, required=False, allow_blank=True)

    class Meta:
        model = models.User
        fields = ("id", "username", "password", "fullName", "role", "email", "department", "lastLogin", "active")

    def validate_id(self, value):
        if not _ID_RE.match(value):
            raise serializers.ValidationError("Invalid id.")
        if self.instance is None and models.User.objects.filter(pk=value).exists():
            raise serializers.ValidationError("A record with this id already exists.")
        return value

    def validate_username(self, value):
        value = value.strip()
        clash = models.User.objects.filter(username__iexact=value)
        if self.instance is not None:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "A password is required for new users."})
        request = self.context.get("request")
        if self.instance is not None and request is not None and request.user.pk == self.instance.pk:
            if attrs.get("is_active") is False:
                raise serializers.ValidationError({"active": "You cannot deactivate your own account."})
            if attrs.get("role") and attrs["role"] != "admin" and self.instance.role == "admin":
                raise serializers.ValidationError({"role": "You cannot remove your own admin role."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = models.User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        validated_data.pop("id", None)
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
