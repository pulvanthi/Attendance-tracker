from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, ConfigDict, Field

Role = Literal["admin", "manager", "staff"]


class UserCreate(BaseModel):
    """Self-registration. The role is never taken from the client."""
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    model_config = ConfigDict(extra="ignore")


class UserLogin(BaseModel):
    """`email` may be a work email or an employee code (e.g. EMP-001) of a linked account."""
    email: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class UserUpdate(BaseModel):
    """Admin-only changes to an account."""
    role: Optional[Role] = None
    is_active: Optional[bool] = None
    employee_id: Optional[str] = None  # '' unlinks


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    employee_id: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
