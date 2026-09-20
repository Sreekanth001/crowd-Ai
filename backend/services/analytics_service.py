from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend.database.models import CrowdMeasurement, Zone, Alert

class AnalyticsService:
    @staticmethod
    def record_measurement(db: Session, zone_id: str, people_count: int, capacity: int, occupancy: float, status: str):
        # Throttle recording to prevent DB flooding (store every 5 seconds per zone)
        latest = db.query(CrowdMeasurement).filter(
            CrowdMeasurement.zone_id == zone_id
        ).order_by(CrowdMeasurement.timestamp.desc()).first()

        if latest:
            elapsed = (datetime.utcnow() - latest.timestamp).total_seconds()
            if elapsed < 4.0: # Skip if less than 4s elapsed
                return

        measurement = CrowdMeasurement(
            zone_id=zone_id,
            people_count=people_count,
            capacity=capacity,
            occupancy=occupancy,
            status=status
        )
        db.add(measurement)
        db.commit()

    @staticmethod
    def get_zone_history(db: Session, zone_id: str, time_filter: str = "today") -> Dict[str, Any]:
        now = datetime.utcnow()
        if time_filter == "1h":
            start_time = now - timedelta(hours=1)
        elif time_filter == "24h":
            start_time = now - timedelta(hours=24)
        elif time_filter == "7d":
            start_time = now - timedelta(days=7)
        else: # "today"
            start_time = datetime(now.year, now.month, now.day)

        zone = db.query(Zone).filter(Zone.id == zone_id).first()
        zone_name = zone.name if zone else "Zone"

        query = db.query(CrowdMeasurement).filter(
            CrowdMeasurement.zone_id == zone_id,
            CrowdMeasurement.timestamp >= start_time
        ).order_by(CrowdMeasurement.timestamp.asc())

        measurements = query.all()

        if not measurements:
            return {
                "zone_id": zone_id,
                "zone_name": zone_name,
                "time_filter": time_filter,
                "peak_people": 0,
                "avg_people": 0.0,
                "peak_occupancy": 0.0,
                "avg_occupancy": 0.0,
                "high_events_count": 0,
                "critical_events_count": 0,
                "datapoints": []
            }

        counts = [m.people_count for m in measurements]
        occupancies = [m.occupancy for m in measurements]

        high_events = sum(1 for m in measurements if m.status == "HIGH")
        critical_events = sum(1 for m in measurements if m.status == "CRITICAL")

        datapoints = [
            {
                "timestamp": m.timestamp.isoformat(),
                "time": m.timestamp.strftime("%H:%M:%S"),
                "people": m.people_count,
                "occupancy": m.occupancy,
                "status": m.status
            }
            for m in measurements[-50:] # Return recent 50 for chart rendering
        ]

        return {
            "zone_id": zone_id,
            "zone_name": zone_name,
            "time_filter": time_filter,
            "peak_people": max(counts),
            "avg_people": round(sum(counts) / len(counts), 1),
            "peak_occupancy": max(occupancies),
            "avg_occupancy": round(sum(occupancies) / len(occupancies), 1),
            "high_events_count": high_events,
            "critical_events_count": critical_events,
            "datapoints": datapoints
        }

analytics_service = AnalyticsService()
