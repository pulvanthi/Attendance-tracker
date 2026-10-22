from datetime import datetime, timezone


def utcnow() -> datetime:
    """Current UTC time as a naive datetime (what the TIMESTAMP columns store).

    Replaces the deprecated datetime.utcnow() with identical behaviour.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)
