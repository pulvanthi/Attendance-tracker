"""Store attendance dates/times as real DATE and TIME columns instead of text.

Revision ID: 0003
Revises: 0002
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("UPDATE attendance_records SET clock_in = NULL WHERE clock_in = ''")
        op.execute("UPDATE attendance_records SET clock_out = NULL WHERE clock_out = ''")
        op.alter_column("attendance_records", "date", type_=sa.Date(), postgresql_using="date::date")
        op.alter_column("attendance_records", "clock_in", type_=sa.Time(), postgresql_using="clock_in::time")
        op.alter_column("attendance_records", "clock_out", type_=sa.Time(), postgresql_using="clock_out::time")
    else:
        # SQLite keeps ISO text for DATE/TIME; batch mode just rewrites the declared column types.
        with op.batch_alter_table("attendance_records") as batch:
            batch.alter_column("date", type_=sa.Date(), existing_nullable=False)
            batch.alter_column("clock_in", type_=sa.Time(), existing_nullable=True)
            batch.alter_column("clock_out", type_=sa.Time(), existing_nullable=True)


def downgrade():
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.alter_column("attendance_records", "date", type_=sa.String(10), postgresql_using="to_char(date, 'YYYY-MM-DD')")
        op.alter_column("attendance_records", "clock_in", type_=sa.String(10), postgresql_using="to_char(clock_in, 'HH24:MI:SS')")
        op.alter_column("attendance_records", "clock_out", type_=sa.String(10), postgresql_using="to_char(clock_out, 'HH24:MI:SS')")
    else:
        with op.batch_alter_table("attendance_records") as batch:
            batch.alter_column("date", type_=sa.String(10), existing_nullable=False)
            batch.alter_column("clock_in", type_=sa.String(10), existing_nullable=True)
            batch.alter_column("clock_out", type_=sa.String(10), existing_nullable=True)
