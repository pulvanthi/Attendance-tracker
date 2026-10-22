"""Test configuration: use an isolated SQLite file, never the real PostgreSQL database."""
import os
import tempfile

_tmp = tempfile.mkdtemp(prefix="attendance_test_")
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db".replace("\\", "/")
os.environ["SECRET_KEY"] = "test-secret-key-not-for-production-0123456789abcdef"
os.environ["ADMIN_EMAIL"] = "admin@attendance.pro"
os.environ["ADMIN_PASSWORD"] = "Test-Admin-Pass-1"
