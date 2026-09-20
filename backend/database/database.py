import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "crowdvision.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.abspath(DB_PATH)}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30  # 30-second timeout to prevent SQLite database lock crashes
    }
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.close()

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
    
    db = SessionLocal()
    try:
        location_id = "loc-tce-campus"
        loc = db.query(Location).filter_by(id=location_id).first()
        if not loc:
            loc = Location(
                id=location_id,
                name="TCE Campus",
                latitude=9.9252,
                longitude=78.1198
            )
            db.add(loc)
            db.commit()
    finally:
        db.close()




