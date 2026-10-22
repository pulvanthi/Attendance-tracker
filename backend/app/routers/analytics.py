import datetime as dt
from collections import defaultdict
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord
from app.auth.dependencies import get_current_user

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics & Reports"],
    dependencies=[Depends(get_current_user)],  # every analytics route needs a valid token
)


@router.get("/trends")
def get_trends(days: int = Query(7, ge=1, le=90), db: Session = Depends(get_db)):
    """Day-by-day attendance trends for the past N days (one query for the whole range)."""
    today = dt.date.today()
    start = today - dt.timedelta(days=days - 1)
    total_active_staff = db.query(Employee).filter(Employee.is_active == True).count()  # noqa: E712

    counts = defaultdict(lambda: {"present": 0, "late": 0})
    rows = db.query(AttendanceRecord.date, AttendanceRecord.status).filter(
        AttendanceRecord.date >= start, AttendanceRecord.date <= today
    ).all()
    for day, status in rows:
        if status == "Present":
            counts[day]["present"] += 1
        elif status == "Late":
            counts[day]["late"] += 1

    trends = []
    for i in range(days):
        day = start + dt.timedelta(days=i)
        present, late = counts[day]["present"], counts[day]["late"]
        absent = max(total_active_staff - (present + late), 0)
        rate = round((present + late) / total_active_staff * 100, 1) if total_active_staff else 0
        trends.append({
            "date": day.isoformat(),
            "day_name": day.strftime("%a"),
            "present": present,
            "late": late,
            "absent": absent,
            "total": total_active_staff,
            "rate": rate,
        })
    return trends


@router.get("/department-breakdown")
def get_department_breakdown(target_date: Optional[dt.date] = None, db: Session = Depends(get_db)):
    """Breakdown of attendance by department for a specific date."""
    calc_date = target_date or dt.date.today()
    employees = db.query(Employee).filter(Employee.is_active == True).all()  # noqa: E712
    records = {r.employee_id: r for r in db.query(AttendanceRecord).filter(AttendanceRecord.date == calc_date).all()}

    dept_stats: Dict[str, Dict[str, Any]] = {}
    for emp in employees:
        dept = emp.department or "General"
        stats = dept_stats.setdefault(dept, {"department": dept, "total": 0, "present": 0, "late": 0, "absent": 0})
        stats["total"] += 1
        rec = records.get(emp.id)
        if not rec or rec.status == "Absent":
            stats["absent"] += 1
        elif rec.status == "Late":
            stats["late"] += 1
        else:
            stats["present"] += 1

    return sorted(dept_stats.values(), key=lambda d: d["department"])


def _csv_cell(value) -> str:
    """Quote a CSV cell and neutralise spreadsheet formulas (=, +, -, @) in user-controlled text."""
    text = "" if value is None else str(value)
    if text[:1] in ("=", "+", "-", "@"):
        text = "'" + text
    return '"' + text.replace('"', '""') + '"'


@router.get("/export-csv")
def export_csv(target_date: Optional[dt.date] = None, db: Session = Depends(get_db)):
    """CSV of the given date's attendance."""
    calc_date = target_date or dt.date.today()
    employees = db.query(Employee).filter(Employee.is_active == True).order_by(Employee.code.asc()).all()  # noqa: E712
    records = {r.employee_id: r for r in db.query(AttendanceRecord).filter(AttendanceRecord.date == calc_date).all()}

    lines = ["Date,Employee Code,Name,Department,Status,Location,Clock In,Clock Out,Hours Worked"]
    for emp in employees:
        rec = records.get(emp.id)
        status_val = rec.status if rec else "Absent"
        loc_val = rec.location if rec else "In-Office"
        cin = rec.clock_in.strftime("%H:%M:%S") if rec and rec.clock_in else ""
        cout = rec.clock_out.strftime("%H:%M:%S") if rec and rec.clock_out else ""
        hours = round(rec.minutes_worked / 60.0, 2) if rec and rec.minutes_worked else 0.0
        lines.append(",".join([
            calc_date.isoformat(), _csv_cell(emp.code), _csv_cell(emp.name), _csv_cell(emp.department),
            status_val, loc_val, cin, cout, str(hours),
        ]))

    return Response(
        content="﻿" + "\r\n".join(lines),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=attendance-{calc_date.isoformat()}.csv"},
    )
