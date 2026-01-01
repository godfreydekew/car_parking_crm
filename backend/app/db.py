"""
Database configuration and session management.

Uses SQLite database with SQLAlchemy ORM.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


# Create database engine (SQLite doesn't need pool_pre_ping)
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # Required for SQLite
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    """Dependency for FastAPI to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables."""
    from . import models
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all database tables."""
    from . import models
    Base.metadata.drop_all(bind=engine)


def reset_database():
    """Drop and recreate all database tables."""
    drop_tables()
    create_tables()
