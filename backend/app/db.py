from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings
import psycopg2    

class Base(DeclarativeBase):
    """Base class for all database models."""
    pass



engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    """Dependency for FastAPI to get database session."""
    db = SessionLocal()
    try:
        print("Db yeild")
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


