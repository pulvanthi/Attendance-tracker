from sqlalchemy import Column, Integer, String, Float, Date, Time, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from app.timeutil import utcnow


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(String(50), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(String(50), default="Absent", nullable=False)  # Present, Late, Absent, Half-Day
    location = Column(String(50), default="In-Office", nullable=False)  # In-Office, Remote, Field Duty
    clock_in = Column(Time, nullable=True)
    clock_out = Column(Time, nullable=True)
    minutes_worked = Column(Float, default=0.0, nullable=False)
    notes = Column(String(500), nullable=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    employee = relationship("Employee", back_populates="attendance_records")

    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uix_employee_date"),
    )
