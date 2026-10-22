from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.schemas.user import UserCreate, UserLogin, UserUpdate, UserResponse, Token
from app.auth.password_utils import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.auth.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user and issue an access token."""
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )

    # First registered user becomes admin
    user_count = db.query(User).count()
    role = "admin" if user_count == 0 else "staff"

    hashed_pw = hash_password(user_in.password)
    user = User(
        email=user_in.email.lower(),
        hashed_password=hashed_pw,
        full_name=user_in.full_name,
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive a JWT access token."""
    identifier = credentials.email.strip()
    if "@" in identifier:
        user = db.query(User).filter(User.email == identifier.lower()).first()
    else:
        # Employee ID / code login (only works for accounts linked to that employee)
        user = (
            db.query(User)
            .join(Employee, Employee.id == User.employee_id)
            .filter((func.lower(Employee.code) == identifier.lower()) | (Employee.id == identifier))
            .first()
        )
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )

    token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return current_user


@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Admin: list all login accounts."""
    return db.query(User).order_by(User.id.asc()).all()


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin: change an account's role, active flag, or the employee it is linked to."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = update.model_dump(exclude_unset=True)

    # Never let the last active admin lock everyone out
    demoting = data.get("role") not in (None, "admin") or data.get("is_active") is False
    if user.role == "admin" and demoting:
        other_admins = db.query(User).filter(
            User.role == "admin", User.is_active == True, User.id != user.id  # noqa: E712
        ).count()
        if other_admins == 0:
            raise HTTPException(status_code=400, detail="Cannot remove the last active admin")

    if "employee_id" in data:
        emp_id = data["employee_id"] or None
        if emp_id:
            if not db.query(Employee).filter(Employee.id == emp_id).first():
                raise HTTPException(status_code=404, detail="Employee not found")
            taken = db.query(User).filter(User.employee_id == emp_id, User.id != user.id).first()
            if taken:
                raise HTTPException(status_code=400, detail="That employee is already linked to another account")
        user.employee_id = emp_id
    if data.get("role") is not None:
        user.role = data["role"]
    if data.get("is_active") is not None:
        user.is_active = data["is_active"]

    db.commit()
    db.refresh(user)
    return user
