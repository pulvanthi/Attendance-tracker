import pytest
from fastapi.testclient import TestClient
from app.main import app

ADMIN = {"email": "admin@attendance.pro", "password": "Test-Admin-Pass-1"}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:  # runs startup (tables + seed)
        yield c


@pytest.fixture(scope="module")
def admin_headers(client):
    res = client.post("/api/auth/login", json=ADMIN)
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_login_admin(client):
    response = client.post("/api/auth/login", json=ADMIN)
    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@attendance.pro"


def test_old_default_password_rejected(client):
    res = client.post("/api/auth/login", json={"email": "admin@attendance.pro", "password": "admin123"})
    assert res.status_code == 401


@pytest.mark.parametrize("method,url", [
    ("get", "/api/attendance/summary"),
    ("get", "/api/attendance/by-date/2026-01-01"),
    ("get", "/api/attendance/"),
    ("post", "/api/attendance/punch"),
    ("post", "/api/attendance/patch-by-date?employee_id=s1&target_date=2026-01-01"),
    ("get", "/api/analytics/trends"),
    ("get", "/api/analytics/department-breakdown"),
    ("get", "/api/analytics/export-csv"),
])
def test_protected_routes_require_login(client, method, url):
    assert getattr(client, method)(url).status_code == 401


def test_employees_require_login(client):
    assert client.get("/api/employees/").status_code == 401


def test_list_employees(client, admin_headers):
    data = client.get("/api/employees/", headers=admin_headers).json()
    assert isinstance(data, list) and len(data) >= 5


def test_summary(client, admin_headers):
    data = client.get("/api/attendance/summary", headers=admin_headers).json()
    assert {"total_staff", "in_office", "absent"} <= data.keys()


def test_punch_flow_admin_custom_time(client, admin_headers):
    res_in = client.post("/api/attendance/punch", headers=admin_headers, json={
        "employee_id": "s1", "type": "in", "location": "In-Office", "custom_time": "09:00:00"})
    assert res_in.status_code == 200
    assert res_in.json()["clock_in"] == "09:00:00"
    assert res_in.json()["status"] == "Present"

    res_out = client.post("/api/attendance/punch", headers=admin_headers, json={
        "employee_id": "s1", "type": "out", "custom_time": "17:30:00"})
    assert res_out.status_code == 200
    assert res_out.json()["minutes_worked"] == 510.0


def test_punch_rejects_bad_input(client, admin_headers):
    base = {"employee_id": "s2", "type": "in"}
    assert client.post("/api/attendance/punch", headers=admin_headers, json={**base, "custom_time": "25:99"}).status_code == 422
    assert client.post("/api/attendance/punch", headers=admin_headers, json={**base, "type": "sideways"}).status_code == 422
    assert client.post("/api/attendance/punch", headers=admin_headers, json={**base, "location": "Moon"}).status_code == 422


def test_analytics_trends(client, admin_headers):
    data = client.get("/api/analytics/trends?days=5", headers=admin_headers).json()
    assert len(data) == 5


def test_register_cannot_choose_admin_role(client):
    res = client.post("/api/auth/register", json={
        "email": "new.user@example.com", "password": "Passw0rd!x", "full_name": "New User", "role": "admin"})
    assert res.status_code == 201
    assert res.json()["user"]["role"] == "staff"


def _staff_headers(client):
    token = client.post("/api/auth/login", json={"email": "new.user@example.com", "password": "Passw0rd!x"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_staff_cannot_use_admin_features(client):
    h = _staff_headers(client)
    assert client.post("/api/attendance/punch", headers=h, json={
        "employee_id": "s3", "type": "in", "custom_time": "08:00:00"}).status_code == 403
    assert client.post("/api/attendance/patch-by-date?employee_id=s3&target_date=2026-01-01",
                       headers=h, json={"status": "Present"}).status_code == 403
    assert client.get("/api/auth/users", headers=h).status_code == 403
    assert client.post("/api/employees/", headers=h, json={"name": "X"}).status_code == 403


def test_staff_can_only_punch_for_own_linked_employee(client, admin_headers):
    h = _staff_headers(client)
    # Not linked yet -> cannot punch anyone, not even "themselves"
    assert client.post("/api/attendance/punch", headers=h, json={"employee_id": "s4", "type": "in"}).status_code == 403

    me = client.get("/api/auth/me", headers=h).json()
    res = client.patch(f"/api/auth/users/{me['id']}", headers=admin_headers, json={"employee_id": "s4"})
    assert res.status_code == 200 and res.json()["employee_id"] == "s4"

    assert client.post("/api/attendance/punch", headers=h, json={"employee_id": "s5", "type": "in"}).status_code == 403
    ok = client.post("/api/attendance/punch", headers=h, json={"employee_id": "s4", "type": "in", "location": "Remote"})
    assert ok.status_code == 200
    assert ok.json()["location"] == "Remote"
    assert ok.json()["status"] in ("Present", "Late")


def test_cannot_demote_last_admin(client, admin_headers):
    admin_id = client.get("/api/auth/me", headers=admin_headers).json()["id"]
    res = client.patch(f"/api/auth/users/{admin_id}", headers=admin_headers, json={"role": "staff"})
    assert res.status_code == 400


def test_clock_out_requires_clock_in(client, admin_headers):
    res = client.post("/api/attendance/punch", headers=admin_headers, json={"employee_id": "s6", "type": "out"})
    assert res.status_code == 400


def test_patch_record_and_csv(client, admin_headers):
    res = client.post("/api/attendance/patch-by-date?employee_id=s6&target_date=2026-03-02", headers=admin_headers,
                      json={"status": "Present", "clock_in": "09:00", "clock_out": "17:00"})
    assert res.status_code == 200
    body = res.json()
    assert body["date"] == "2026-03-02" and body["clock_in"] == "09:00:00" and body["minutes_worked"] == 480.0

    by_date = client.get("/api/attendance/by-date/2026-03-02", headers=admin_headers).json()
    assert by_date["s6"]["clock_out"] == "17:00:00"

    csv = client.get("/api/analytics/export-csv?target_date=2026-03-02", headers=admin_headers)
    assert csv.status_code == 200 and "Marcus Vance" in csv.text and "8.0" in csv.text

    assert client.get("/api/attendance/by-date/not-a-date", headers=admin_headers).status_code == 422


def test_health_does_not_leak_password(client):
    assert "Test-Admin" not in client.get("/api/health").text


def test_login_with_employee_id(client, admin_headers):
    h = _staff_headers(client)
    me = client.get("/api/auth/me", headers=h).json()
    # account was linked to s4 (EMP-004) in an earlier test
    assert me["employee_id"] == "s4"
    ok = client.post("/api/auth/login", json={"email": "emp-004", "password": "Passw0rd!x"})
    assert ok.status_code == 200 and ok.json()["user"]["email"] == "new.user@example.com"
    assert client.post("/api/auth/login", json={"email": "EMP-004", "password": "wrong"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "EMP-001", "password": "Passw0rd!x"}).status_code == 401  # unlinked employee
