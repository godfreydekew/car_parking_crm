from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings

class Base(DeclarativeBase):
    pass


engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    from . import models 
    Base.metadata.create_all(bind=engine)
    
def drop_tables():
    from . import models 
    Base.metadata.drop_all(bind=engine)
    
def reset_database():
    drop_tables()
    create_tables()

if __name__ == "__main__":
    # For testing purposes
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
        print("Database connection OK:", result)
