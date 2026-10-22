from app.routers.auth import router as auth_router
from app.routers.employees import router as employees_router
from app.routers.attendance import router as attendance_router
from app.routers.analytics import router as analytics_router

__all__ = [
    "auth_router",
    "employees_router",
    "attendance_router",
    "analytics_router",
]
