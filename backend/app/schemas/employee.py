from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class EmployeeBase(BaseModel):
    name: str
    department: str = "General"
    role_title: str = "Staff"
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True


class EmployeeCreate(EmployeeBase):
    id: Optional[str] = None
    code: Optional[str] = None


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    role_title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeResponse(EmployeeBase):
    id: str
    code: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
