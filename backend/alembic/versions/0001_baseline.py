"""Baseline: users, employees, attendance_records (original schema, text dates).

Idempotent: databases created by the old create_all() already have these tables.

Revision ID: 0001
Revises:
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    insp = sa.inspect(op.get_bind())

    if not insp.has_table("users"):
        op.create_table(
            "users",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("email", sa.String(255), nullable=False),
            sa.Column("hashed_password", sa.String(255), nullable=False),
            sa.Column("full_name", sa.String(255), nullable=False),
            sa.Column("role", sa.String(50), nullable=False),
            sa.Column("is_active", sa.Boolean, nullable=False),
            sa.Column("created_at", sa.DateTime, nullable=False),
        )
        op.create_index("ix_users_id", "users", ["id"])
        op.create_index("ix_users_email", "users", ["email"], unique=True)

    if not insp.has_table("employees"):
        op.create_table(
            "employees",
            sa.Column("id", sa.String(50), primary_key=True),
            sa.Column("code", sa.String(50), nullable=False),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("department", sa.String(100), nullable=False),
            sa.Column("role_title", sa.String(100), nullable=False),
            sa.Column("email", sa.String(255)),
            sa.Column("phone", sa.String(50)),
            sa.Column("is_active", sa.Boolean, nullable=False),
            sa.Column("created_at", sa.DateTime, nullable=False),
        )
        op.create_index("ix_employees_id", "employees", ["id"])
        op.create_index("ix_employees_code", "employees", ["code"], unique=True)

    if not insp.has_table("attendance_records"):
        op.create_table(
            "attendance_records",
            sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
            sa.Column("employee_id", sa.String(50), sa.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False),
            sa.Column("date", sa.String(10), nullable=False),
            sa.Column("status", sa.String(50), nullable=False),
            sa.Column("location", sa.String(50), nullable=False),
            sa.Column("clock_in", sa.String(10)),
            sa.Column("clock_out", sa.String(10)),
            sa.Column("minutes_worked", sa.Float, nullable=False),
            sa.Column("notes", sa.String(500)),
            sa.Column("updated_at", sa.DateTime, nullable=False),
            sa.UniqueConstraint("employee_id", "date", name="uix_employee_date"),
        )
        op.create_index("ix_attendance_records_id", "attendance_records", ["id"])
        op.create_index("ix_attendance_records_employee_id", "attendance_records", ["employee_id"])
        op.create_index("ix_attendance_records_date", "attendance_records", ["date"])


def downgrade():
    op.drop_table("attendance_records")
    op.drop_table("employees")
    op.drop_table("users")
