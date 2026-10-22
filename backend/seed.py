import logging
from datetime import date, time
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.db_migrate import run_migrations
from app.models.user import User
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord
from app.auth.password_utils import hash_password, verify_password
from app.config import settings
import secrets

logger = logging.getLogger("uvicorn.error")

SEED_STAFF = [
    {
        "id": "s1",
        "code": "EMP-001",
        "name": "Asha Menon",
        "department": "Finance",
        "role_title": "Senior Accountant",
        "email": "asha.menon@company.com",
    },
    {
        "id": "s2",
        "code": "EMP-002",
        "name": "Daniel Okafor",
        "department": "Engineering",
        "role_title": "Lead Backend Dev",
        "email": "daniel.okafor@company.com",
    },
    {
        "id": "s3",
        "code": "EMP-003",
        "name": "Priya Raman",
        "department": "Operations",
        "role_title": "Operations Manager",
        "email": "priya.raman@company.com",
    },
    {
        "id": "s4",
        "code": "EMP-004",
        "name": "Lucas Ferreira",
        "department": "Sales",
        "role_title": "Account Executive",
        "email": "lucas.ferreira@company.com",
    },
    {
        "id": "s5",
        "code": "EMP-005",
        "name": "Mei Tanaka",
        "department": "Design",
        "role_title": "UI/UX Designer",
        "email": "mei.tanaka@company.com",
    },
    {
        "id": "s6",
        "code": "EMP-006",
        "name": "Marcus Vance",
        "department": "Engineering",
        "role_title": "DevOps Engineer",
        "email": "marcus.vance@company.com",
    },
]


def seed_database(db: Session = None):
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # Make sure the schema is up to date (Alembic)
        run_migrations()

        # 1. Seed the initial admin user (password comes from ADMIN_PASSWORD, never hard-coded)
        admin_email = settings.ADMIN_EMAIL.lower()
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_password = settings.ADMIN_PASSWORD
            generated = not admin_password
            if generated:
                admin_password = secrets.token_urlsafe(12)
            admin_user = User(
                email=admin_email,
                hashed_password=hash_password(admin_password),
                full_name="Admin Director",
                role="admin",
                is_active=True,
            )
            db.add(admin_user)
            if generated:
                logger.warning(f"Created admin {admin_email} with generated password: {admin_password} "
                               f"(shown once - set ADMIN_PASSWORD in .env to choose your own)")
            else:
                logger.info(f"Created admin user: {admin_email}")
        elif verify_password("admin123", admin_user.hashed_password):
            # Upgrade databases created by older versions that used the public default password
            if settings.ADMIN_PASSWORD:
                admin_user.hashed_password = hash_password(settings.ADMIN_PASSWORD)
                logger.warning("Admin account still used the old default password; replaced with ADMIN_PASSWORD.")
            else:
                logger.error("Admin account uses the insecure default password 'admin123'. Set ADMIN_PASSWORD in .env and restart.")

        # 2. Seed Staff
        for s in SEED_STAFF:
            emp = db.query(Employee).filter(Employee.id == s["id"]).first()
            if not emp:
                emp = Employee(
                    id=s["id"],
                    code=s["code"],
                    name=s["name"],
                    department=s["department"],
                    role_title=s["role_title"],
                    email=s["email"],
                    is_active=True,
                )
                db.add(emp)

        db.commit()

        # 3. Seed sample attendance for today and yesterday if empty
        today_str = date.today()

        today_records = db.query(AttendanceRecord).filter(AttendanceRecord.date == today_str).count()
        if today_records == 0:
            sample_records = [
                AttendanceRecord(
                    employee_id="s1",
                    date=today_str,
                    status="Present",
                    location="In-Office",
                    clock_in=time.fromisoformat("09:15:00"),
                    clock_out=None,
                    minutes_worked=0.0
                ),
                AttendanceRecord(
                    employee_id="s2",
                    date=today_str,
                    status="Late",
                    location="In-Office",
                    clock_in=time.fromisoformat("09:48:30"),
                    clock_out=None,
                    minutes_worked=0.0
                ),
                AttendanceRecord(
                    employee_id="s3",
                    date=today_str,
                    status="Present",
                    location="Remote",
                    clock_in=time.fromisoformat("09:00:15"),
                    clock_out=None,
                    minutes_worked=0.0
                ),
                AttendanceRecord(
                    employee_id="s4",
                    date=today_str,
                    status="Absent",
                    location="In-Office",
                    clock_in=None,
                    clock_out=None,
                    minutes_worked=0.0
                ),
                AttendanceRecord(
                    employee_id="s5",
                    date=today_str,
                    status="Present",
                    location="In-Office",
                    clock_in=time.fromisoformat("09:25:00"),
                    clock_out=None,
                    minutes_worked=0.0
                ),
            ]
            for r in sample_records:
                db.add(r)
            db.commit()
            logger.info("📅 Seeded today's attendance sample records")

    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    seed_database()
    print("Database seeding completed.")
