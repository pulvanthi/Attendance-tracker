"""Link login accounts to employees; normalise legacy role names.

Revision ID: 0002
Revises: 0001
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("employee_id", sa.String(50), nullable=True))
        batch.create_foreign_key("fk_users_employee_id", "employees", ["employee_id"], ["id"], ondelete="SET NULL")
        batch.create_index("ix_users_employee_id", ["employee_id"], unique=True)
    # Old code used "employee"/"staff" inconsistently; the app now uses admin / manager / staff.
    op.execute("UPDATE users SET role = 'staff' WHERE role NOT IN ('admin', 'manager', 'staff')")


def downgrade():
    with op.batch_alter_table("users") as batch:
        batch.drop_index("ix_users_employee_id")
        batch.drop_constraint("fk_users_employee_id", type_="foreignkey")
        batch.drop_column("employee_id")
