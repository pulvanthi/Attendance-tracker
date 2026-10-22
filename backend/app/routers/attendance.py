import datetime as dt
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord
from app.models.user import User
from app.auth.dependencies import get_current_user, require_manager
from app.schemas.attendance import (
    AttendanceRecordResponse,
    AttendanceRecordPatch,
    PunchRequest,
    AttendanceSummaryResponse,
)

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance Records"],
    dependencies=[Depends(get_current_user)],  # every attendance route needs a valid token
)


def parse_time(value: Optional[str]) -> Optional[dt.time]:
    """'HH:MM' / 'HH:MM:SS' -> time (None or '' -> None). Input is pre-validated by the schemas."""
    if not value:
        return None
    return dt.time.fromisoformat(value)


def calculate_worked_minutes(clock_in: Optional[dt.time], clock_out: Optional[dt.time]) -> float:
    if clock_in is None or clock_out is None:
        return 0.0
    today = dt.date.today()
    diff = dt.datetime.combine(today, clock_out) - dt.datetime.combine(today, clock_in)
    if diff.total_seconds() < 0:  # overnight shift
        diff += dt.timedelta(days=1)
    return round(diff.total_seconds() / 60.0, 2)


def is_late_punch(clock_in: dt.time, threshold: str = None) -> bool:
    return clock_in > dt.time.fromisoformat(threshold or settings.DEFAULT_SHIFT_START)


@router.get("/", response_model=List[AttendanceRecordResponse])
def get_attendance(
    target_date: Optional[dt.date] = Query(None, description="Date in YYYY-MM-DD format"),
    employee_id: Optional[str] = Query(None, description="Filter by employee ID"),
    start_date: Optional[dt.date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[dt.date] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    """Retrieve attendance records filtered by date or date range."""
    query = db.query(AttendanceRecord)

    if target_date:
        query = query.filter(AttendanceRecord.date == target_date)
    elif start_date and end_date:
        query = query.filter(AttendanceRecord.date >= start_date, AttendanceRecord.date <= end_date)
    elif start_date:
        query = query.filter(AttendanceRecord.date >= start_date)

    if employee_id:
        query = query.filter(AttendanceRecord.employee_id == employee_id)

    return query.order_by(AttendanceRecord.date.desc(), AttendanceRecord.employee_id.asc()).limit(1000).all()


@router.get("/by-date/{target_date}", response_model=Dict[str, AttendanceRecordResponse])
def get_attendance_map_by_date(target_date: dt.date, db: Session = Depends(get_db)):
    """All attendance records for a specific date as a dict keyed by employee_id."""
    records = db.query(AttendanceRecord).filter(AttendanceRecord.date == target_date).all()
    return {r.employee_id: r for r in records}


@router.post("/punch", response_model=AttendanceRecordResponse)
def punch_attendance(
    punch: PunchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clock in or out. Staff may only punch for their own linked employee."""
    if current_user.role == "staff" and current_user.employee_id != punch.employee_id:
        raise HTTPException(
            status_code=403,
            detail="You can only clock in/out for your own employee profile "
                   "(ask an admin to link your account to your employee record)",
        )
    if punch.custom_time and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can set a custom punch time")

    emp = db.query(Employee).filter(Employee.id == punch.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    today = dt.date.today()
    if punch.custom_time:
        punch_time = parse_time(punch.custom_time)
    else:
        punch_time = dt.datetime.now().time().replace(microsecond=0)

    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == punch.employee_id,
        AttendanceRecord.date == today,
    ).first()

    if punch.type == "out" and (not record or not record.clock_in):
        raise HTTPException(status_code=400, detail="Cannot clock out before clocking in")

    if not record:
        record = AttendanceRecord(
            employee_id=punch.employee_id,
            date=today,
            status="Present",
            location=punch.location or "In-Office",
            minutes_worked=0.0,
        )
        db.add(record)

    if punch.type == "in":
        record.clock_in = punch_time
        record.clock_out = None
        record.status = "Late" if is_late_punch(punch_time) else "Present"
        if punch.location:
            record.location = punch.location
        record.minutes_worked = 0.0
    else:
        record.clock_out = punch_time
        record.minutes_worked = calculate_worked_minutes(record.clock_in, punch_time)

    if punch.notes:
        record.notes = punch.notes

    db.commit()
    db.refresh(record)
    return record


@router.post("/patch-by-date", response_model=AttendanceRecordResponse)
def patch_record_by_date(
    employee_id: str = Query(...),
    target_date: dt.date = Query(...),
    patch: AttendanceRecordPatch = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Manager/admin: update or insert an attendance record for an employee on a given date."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == employee_id,
        AttendanceRecord.date == target_date,
    ).first()

    if not record:
        record = AttendanceRecord(
            employee_id=employee_id,
            date=target_date,
            status="Absent",
            location="In-Office",
            minutes_worked=0.0,
        )
        db.add(record)

    if patch:
        fields = patch.model_dump(exclude_unset=True)

        if fields.get("status") is not None:
            record.status = fields["status"]
            if record.status == "Absent":
                record.clock_in = None
                record.clock_out = None
        if fields.get("location") is not None:
            record.location = fields["location"]
        if "clock_in" in fields and fields["clock_in"] is not None:
            record.clock_in = parse_time(fields["clock_in"])
            if record.clock_in and record.status == "Absent":
                record.status = "Late" if is_late_punch(record.clock_in) else "Present"
        if "clock_out" in fields and fields["clock_out"] is not None:
            record.clock_out = parse_time(fields["clock_out"])
        if "notes" in fields and fields["notes"] is not None:
            record.notes = fields["notes"]

        record.minutes_worked = calculate_worked_minutes(record.clock_in, record.clock_out)

    db.commit()
    db.refresh(record)
    return record


@router.get("/summary", response_model=AttendanceSummaryResponse)
def get_daily_summary(
    target_date: Optional[dt.date] = Query(None, description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
):
    """Summary figures for the dashboard."""
    calc_date = target_date or dt.date.today()
    employees = db.query(Employee).filter(Employee.is_active == True).all()  # noqa: E712
    records = db.query(AttendanceRecord).filter(AttendanceRecord.date == calc_date).all()
    rec_by_emp = {r.employee_id: r for r in records}

    in_office = field_remote = absent = late = present = 0
    total_minutes = 0.0

    for emp in employees:
        rec = rec_by_emp.get(emp.id)
        if not rec or rec.status == "Absent":
            absent += 1
            continue

        if rec.status == "Late":
            late += 1
        else:
            present += 1

        total_minutes += rec.minutes_worked or 0.0

        if rec.location == "In-Office":
            in_office += 1
        else:
            field_remote += 1

    return {
        "date": calc_date,
        "total_staff": len(employees),
        "in_office": in_office,
        "field_remote": field_remote,
        "absent": absent,
        "late": late,
        "present": present,
        "total_hours_worked": round(total_minutes / 60.0, 1),
    }
