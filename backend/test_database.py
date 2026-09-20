import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database.database import init_db, SessionLocal
from backend.database.models import Location, Zone, Camera, CrowdMeasurement, Alert

def test_db():
    print("Initializing SQLite database & tables...")
    init_db()

    db = SessionLocal()
    try:
        locations = db.query(Location).all()
        print(f"Locations count: {len(locations)}")
        assert len(locations) > 0, "Location query failed"

        zones = db.query(Zone).all()
        if len(zones) == 0:
            test_zone = Zone(id="zone-test-1", location_id=locations[0].id, name="Test Zone 1", capacity=100, latitude=9.9252, longitude=78.1198)
            db.add(test_zone)
            db.commit()
            zones = db.query(Zone).all()
        print(f"Zones count: {len(zones)}")
        assert len(zones) > 0, "Expected at least 1 zone"
        for z in zones:
            print(f" - Zone: {z.name} (Capacity: {z.capacity}, Lat: {z.latitude}, Lng: {z.longitude})")

        print("Testing CrowdMeasurement insertion...")
        m = CrowdMeasurement(zone_id=zones[0].id, people_count=42, capacity=100, occupancy=42.0, status="LOW")
        db.add(m)
        db.commit()

        meas = db.query(CrowdMeasurement).filter_by(zone_id=zones[0].id).all()
        assert len(meas) > 0

        import uuid
        a = Alert(id=f"alert-{uuid.uuid4().hex[:6]}", zone_id=zones[0].id, type="HIGH_OCCUPANCY", severity="warning", message="High density")
        db.add(a)
        db.commit()

        alerts = db.query(Alert).filter_by(resolved=False).all()
        assert len(alerts) > 0

        print("\nAll SQLite Database CRUD tests PASSED successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    test_db()
