import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "crowdvision.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.abspath(DB_PATH)}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from backend.database.models import Location, Zone, Camera
    Base.metadata.create_all(bind=engine)
    
    # Ensure default location exists if database is empty
    db = SessionLocal()
    try:
        if db.query(Location).count() == 0:
            default_location = Location(
                id="loc-tce-campus",
                name="TCE Campus",
                latitude=9.9252,
                longitude=78.1198
            )
            db.add(default_location)
            db.commit()
    finally:
        db.close()
