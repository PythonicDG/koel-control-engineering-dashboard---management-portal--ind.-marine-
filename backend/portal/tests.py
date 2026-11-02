from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from . import models, seed


class ApiTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        seed.seed_all()

    def setUp(self):
        cache.clear()  # reset login throttling between tests

    def login(self, username="admin", password="admin123"):
        client = APIClient()
        res = client.post("/api/auth/login", {"username": username, "password": password}, format="json")
        if res.status_code == 200:
            client.credentials(HTTP_AUTHORIZATION=f"Token {res.data['token']}")
        return client, res


class AuthTests(ApiTestCase):
    def test_login_success_and_no_password_leak(self):
        _, res = self.login()
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["user"]["role"], "admin")
        self.assertNotIn("password", res.data["user"])

    def test_aliases_and_email_login(self):
        self.assertEqual(self.login("KGC\\AAG1000972", "admin123")[1].status_code, 200)
        self.assertEqual(self.login("r.kulkarni@kirloskar.com", "user123")[1].status_code, 200)

    def test_bad_credentials_rejected_with_same_message(self):
        a = self.login("admin", "nope")[1]
        b = self.login("ghost", "admin123")[1]
        self.assertEqual((a.status_code, b.status_code), (401, 401))
        self.assertEqual(a.data["detail"], b.data["detail"])
        self.assertEqual(self.login("admin", "")[1].status_code, 400)

    def test_deactivated_account_blocked(self):
        models.User.objects.filter(username="engineer").update(is_active=False)
        self.assertEqual(self.login("engineer", "user123")[1].status_code, 403)

    def test_endpoints_require_token(self):
        self.assertEqual(APIClient().get("/api/projects").status_code, 401)

    def test_logout_invalidates_token(self):
        client, _ = self.login()
        self.assertEqual(client.post("/api/auth/logout").status_code, 204)
        self.assertEqual(client.get("/api/projects").status_code, 401)


class UserManagementTests(ApiTestCase):
    def test_engineer_cannot_manage_users_but_can_list(self):
        client, _ = self.login("engineer", "user123")
        self.assertEqual(client.get("/api/users").status_code, 200)
        res = client.post("/api/users", {"username": "x", "fullName": "X", "password": "pw"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_admin_creates_user_with_hashed_password_and_password_change(self):
        client, _ = self.login()
        res = client.post(
            "/api/users",
            {"id": "usr-new", "username": "NewGuy", "fullName": "New Guy", "role": "engineer", "password": "secret1"},
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        user = models.User.objects.get(pk="usr-new")
        self.assertNotEqual(user.password, "secret1")
        self.assertEqual(self.login("newguy", "secret1")[1].status_code, 200)

        res = client.patch("/api/users/usr-new", {"password": "changed2"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(self.login("newguy", "secret1")[1].status_code, 401)
        self.assertEqual(self.login("newguy", "changed2")[1].status_code, 200)
        # username uniqueness is case-insensitive
        res = client.post("/api/users", {"username": "ADMIN", "fullName": "D", "password": "pw"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_admin_cannot_delete_or_deactivate_self(self):
        client, _ = self.login()
        me = client.get("/api/auth/me").data
        self.assertEqual(client.delete(f"/api/users/{me['id']}").status_code, 403)
        res = client.patch(f"/api/users/{me['id']}", {"active": False}, format="json")
        self.assertEqual(res.status_code, 400)


class ProjectTests(ApiTestCase):
    def test_seed_projects_roundtrip_camel_case_and_nested_json(self):
        client, _ = self.login()
        res = client.get("/api/projects")
        self.assertEqual([p["id"] for p in res.data], ["proj-1", "proj-2", "proj-3"])
        proj = res.data[0]
        self.assertIn("projectCode", proj)
        self.assertIn("projectName", proj["designInputs"])  # nested keys untouched
        self.assertIn("componentType", proj["subProjects"][0])

    def test_create_update_delete(self):
        client, _ = self.login()
        body = {
            "id": "proj-x1",
            "projectCode": "KOEL-MAR-2026-099",
            "status": "OPEN",
            "progressPercent": 15,
            "designInputs": {"projectName": "Test", "dgRatingKva": 100},
            "subProjects": [{"id": "sp-1", "plmStatus": "Pending", "taskTitle": "t"}],
            "ecnIds": [],
        }
        res = client.post("/api/projects", body, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["designInputs"]["dgRatingKva"], 100)
        # duplicate code / id rejected
        self.assertEqual(client.post("/api/projects", body, format="json").status_code, 400)

        body["progressPercent"] = 40
        body["subProjects"][0]["plmStatus"] = "In Review"
        res = client.put("/api/projects/proj-x1", body, format="json")
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data["progressPercent"], 40)
        self.assertEqual(res.data["subProjects"][0]["plmStatus"], "In Review")

        self.assertEqual(client.delete("/api/projects/proj-x1").status_code, 204)

    def test_only_admin_can_delete_projects(self):
        client, _ = self.login("engineer", "user123")
        self.assertEqual(client.delete("/api/projects/proj-1").status_code, 403)

    def test_rule2_cannot_close_with_unreleased_subprojects(self):
        client, _ = self.login()
        proj = client.get("/api/projects/proj-1").data
        proj["status"] = "CLOSED"
        res = client.put("/api/projects/proj-1", proj, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("status", res.data)

    def test_closed_project_can_still_be_edited(self):
        client, _ = self.login()
        proj = client.get("/api/projects/proj-2").data
        proj["progressPercent"] = 100
        self.assertEqual(client.put("/api/projects/proj-2", proj, format="json").status_code, 200)


class EcnTests(ApiTestCase):
    def ecn_body(self, project):
        return {
            "id": "ecn-new",
            "changeType": "ECN",
            "manualChangeNumber": "ECN/MAR/2026/050",
            "projectId": project["id"],
            "projectCode": project["projectCode"],
            "projectName": "n",
            "partDescription": "desc",
            "reasonForChange": "why",
            "engineerName": "Rajesh",
            "dateLogged": "2026-11-01",
            "status": "Open",
            "impactAnalysis": "",
            "affectedComponents": ["Junction Box"],
        }

    def test_rule1_ecn_reopens_closed_project(self):
        client, _ = self.login("engineer", "user123")
        closed = client.get("/api/projects/proj-2").data
        self.assertEqual(closed["status"], "CLOSED")
        res = client.post("/api/ecns", self.ecn_body(closed), format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertTrue(res.data["didReopen"])
        self.assertEqual(res.data["project"]["status"], "OPEN")
        self.assertIn("ecn-new", res.data["project"]["ecnIds"])
        self.assertEqual(client.get("/api/projects/proj-2").data["status"], "OPEN")

    def test_ecn_on_open_project_does_not_reopen(self):
        client, _ = self.login()
        res = client.post("/api/ecns", self.ecn_body(client.get("/api/projects/proj-1").data), format="json")
        self.assertFalse(res.data["didReopen"])
        self.assertEqual(res.data["project"]["status"], "IN_PROGRESS")


class MiscResourceTests(ApiTestCase):
    def test_lists_load_in_original_order(self):
        client, _ = self.login()
        self.assertEqual(client.get("/api/site-visits").data[0]["id"], "sv-1")
        self.assertEqual(len(client.get("/api/form-fields").data), 45)
        self.assertEqual(client.get("/api/authorities").data[0]["code"], "IRS")

    def test_new_records_appear_first(self):
        client, _ = self.login()
        res = client.post(
            "/api/trials",
            {
                "trialCode": "FAT-X", "projectCode": "KOEL-MAR-2026-001", "vesselName": "v", "trialType": "FAT",
                "date": "2026-11-01", "shipyard": "s", "status": "Passed & Stamped",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertTrue(res.data["id"].startswith("tr-"))
        self.assertEqual(client.get("/api/trials").data[0]["id"], res.data["id"])

    def test_form_field_changes_admin_only(self):
        eng, _ = self.login("engineer", "user123")
        self.assertEqual(eng.patch("/api/form-fields/fld-p-1", {"isMandatory": False}, format="json").status_code, 403)
        adm, _ = self.login()
        res = adm.patch("/api/form-fields/fld-p-1", {"isMandatory": False}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data["isMandatory"])

    def test_reset_sample_data_admin_only(self):
        eng, _ = self.login("engineer", "user123")
        self.assertEqual(eng.post("/api/admin/reset-sample-data").status_code, 403)
        adm, _ = self.login()
        adm.delete("/api/projects/proj-1")
        self.assertEqual(adm.post("/api/admin/reset-sample-data").status_code, 200)
        self.assertEqual([p["id"] for p in adm.get("/api/projects").data], ["proj-1", "proj-2", "proj-3"])
