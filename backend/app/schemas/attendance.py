import datetime as dt
import re
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.employee import EmployeeResponse

Status = Literal["Present", "Late", "Absent", "Half-Day"]
Location = Literal["In-Office", "Remote", "Field Duty"]

_TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$")


def _check_time(v):
    """Allow None/'' (clears the value) or HH:MM / HH:MM:SS (24-hour)."""
    if v in (None, ""):
        return v
    if not _TIME_RE.match(v):
        raise ValueError("time must be HH:MM or HH:MM:SS (24-hour)")
    return v


class AttendanceRecordPatch(BaseModel):
    """Partial update. A field left out is unchanged; '' for a time clears it."""
    status: Optional[Status] = None
    location: Optional[Location] = None
    clock_in: Optional[str] = None
    clock_out: Optional[str] = None
    notes: Optional[str] = Field(default=None, max_length=500)

    _v_times = field_validator("clock_in", "clock_out")(_check_time)


class AttendanceRecordResponse(BaseModel):
    id: int
    employee_id: str
    date: dt.date
    status: str
    location: str
    clock_in: Optional[dt.time] = None
    clock_out: Optional[dt.time] = None
    notes: Optional[str] = None
    minutes_worked: float
    updated_at: dt.datetime
    employee: Optional[EmployeeResponse] = None
    model_config = ConfigDict(from_attributes=True)


class PunchRequest(BaseModel):
    employee_id: str
    type: Literal["in", "out"]
    location: Optional[Location] = None
    custom_time: Optional[str] = None  # admin-only HH:MM:SS override
    notes: Optional[str] = Field(default=None, max_length=500)

    _v_time = field_validator("custom_time")(_check_time)


class AttendanceSummaryResponse(BaseModel):
    date: dt.date
    total_staff: int
    in_office: int
    field_remote: int
    absent: int
    late: int
    present: int
    total_hours_worked: float
