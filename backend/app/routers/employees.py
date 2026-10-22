from typing import List, Optional
import time
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.auth.dependencies import require_admin, get_current_user

router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
    dependencies=[Depends(get_current_user)],  # employee data (emails, phones) is not public
)


@router.get("/", response_model=List[EmployeeResponse])
def list_employees(
    search: Optional[str] = Query(None, description="Search by name, code or department"),
    department: Optional[str] = Query(None, description="Filter by department"),
    active_only: bool = Query(True, description="Only show active employees"),
    db: Session = Depends(get_db),
):
    """List all employees with optional search and filters."""
    query = db.query(Employee)
    if active_only:
        query = query.filter(Employee.is_active == True)
    if department:
        query = query.filter(Employee.department == department)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Employee.name.ilike(s)) |
            (Employee.code.ilike(s)) |
            (Employee.department.ilike(s))
        )
    return query.order_by(Employee.code.asc()).all()


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    emp_in: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Add a new employee to the roster."""
    # Generate code if not provided
    code = emp_in.code
    if not code:
        existing = db.query(Employee).all()
        max_num = 0
        for e in existing:
            digits = ''.join(filter(str.isdigit, e.code))
            if digits:
                max_num = max(max_num, int(digits))
        code = f"EMP-{str(max_num + 1).zfill(3)}"

    # Check uniqueness
    if db.query(Employee).filter(Employee.code == code).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee code '{code}' already exists"
        )

    emp_id = emp_in.id or f"s_{int(time.time() * 1000)}"

    employee = Employee(
        id=emp_id,
        code=code,
        name=emp_in.name.strip(),
        department=emp_in.department.strip() or "General",
        role_title=emp_in.role_title.strip() or "Staff",
        email=emp_in.email,
        phone=emp_in.phone,
        is_active=emp_in.is_active,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: str, db: Session = Depends(get_db)):
    """Retrieve an employee by their ID or Code."""
    emp = db.query(Employee).filter(
        (Employee.id == employee_id) | (Employee.code == employee_id)
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: str,
    emp_update: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Update employee details."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = emp_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(emp, field, val)

    db.commit()
    db.refresh(emp)
    return emp


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Delete or deactivate an employee."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(emp)
    db.commit()
    return None
