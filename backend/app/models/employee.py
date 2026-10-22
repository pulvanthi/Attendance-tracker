from app.timeutil import utcnow
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(50), primary_key=True, index=True)  # e.g. "s1" or uuid or "EMP-001"
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "EMP-001"
    name = Column(String(255), nullable=False)
    department = Column(String(100), default="General", nullable=False)
    role_title = Column(String(100), default="Staff", nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    attendance_records = relationship(
        "AttendanceRecord",
        back_populates="employee",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
