import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("uvicorn.error")

Base = declarative_base()

db_url = settings.DATABASE_URL
# Hosted providers (Render, Heroku, ...) hand out "postgres://"; SQLAlchemy needs "postgresql://"
if db_url.startswith("postgres://"):
    db_url = "postgresql://" + db_url[len("postgres://"):]
is_postgres = db_url.startswith("postgresql")


def _make_sqlite_engine(url: str):
    return create_engine(url, connect_args={"check_same_thread": False})


if is_postgres:
    try:
        engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
        with engine.connect() as conn:  # quick connectivity test
            conn.execute(text("SELECT 1"))
        logger.info(f"Connected to PostgreSQL at {db_url.split('@')[-1]}")
    except Exception as e:
        if not settings.ALLOW_SQLITE_FALLBACK:
            raise RuntimeError(
                f"Could not connect to PostgreSQL at {db_url.split('@')[-1]}: {e}\n"
                "Check that the PostgreSQL service is running and DATABASE_URL in backend/.env is correct. "
                "(Set ALLOW_SQLITE_FALLBACK=true to use a local SQLite file instead.)"
            ) from e
        logger.warning(f"Could not connect to PostgreSQL ({e}). Using SQLite fallback {settings.SQLITE_FALLBACK_URL}.")
        db_url = settings.SQLITE_FALLBACK_URL
        is_postgres = False
        engine = _make_sqlite_engine(db_url)
elif db_url.startswith("sqlite"):
    engine = _make_sqlite_engine(db_url)
else:
    engine = create_engine(db_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_info():
    return {
        "is_postgres": is_postgres,
        "database_type": "PostgreSQL" if is_postgres else "SQLite",
        "url_target": engine.url.render_as_string(hide_password=True),
    }
