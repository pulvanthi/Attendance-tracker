from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.timeutil import utcnow

ROLES = ("admin", "manager", "staff")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="staff", nullable=False)  # admin, manager, staff
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    # The employee this login belongs to. Staff accounts may only punch for this employee.
    employee_id = Column(
        String(50), ForeignKey("employees.id", ondelete="SET NULL"),
        unique=True, nullable=True, index=True,
    )

    employee = relationship("Employee")
