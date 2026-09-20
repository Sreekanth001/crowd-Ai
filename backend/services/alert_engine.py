import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.database.models import Alert, CrowdMeasurement, Zone

class AlertEngine:
    GROWTH_THRESHOLD_PERCENT = 30.0 # 30% surge triggers rapid growth alert
    TIME_WINDOW_MINUTES = 5

    @classmethod
    def evaluate_zone(cls, db: Session, zone: Zone, current_people: int) -> Optional[Dict[str, Any]]:
        capacity = zone.capacity if zone.capacity > 0 else 50
        occupancy = round((current_people / capacity) * 100, 2)
        
        active_alert = None

        # 1. Capacity Exceeded Alert
        if occupancy > 100.0:
            active_alert = {
                "id": f"alert-{uuid.uuid4().hex[:8]}",
                "zone_id": zone.id,
                "zone_name": zone.name,
                "alert_type": "CAPACITY_EXCEEDED",
                "severity": "critical",
                "title": f"Critical Overcapacity in {zone.name}",
                "message": f"Capacity exceeded! {current_people}/{capacity} people ({occupancy}% occupancy)."
            }
        # 2. High Occupancy Alert
        elif occupancy >= 80.0:
            active_alert = {
                "id": f"alert-{uuid.uuid4().hex[:8]}",
                "zone_id": zone.id,
                "zone_name": zone.name,
                "alert_type": "HIGH_OCCUPANCY",
                "severity": "warning",
                "title": f"High Crowd Density in {zone.name}",
                "message": f"Approaching maximum capacity ({occupancy}% occupancy)."
            }
        # 3. Rapid Growth Detection
        else:
            rapid_growth = cls._check_rapid_growth(db, zone.id, current_people)
            if rapid_growth:
                active_alert = rapid_growth

        # Persist alert to database if valid
        if active_alert:
            # Avoid duplicate active alert for same zone & type within last 2 minutes
            recent_cutoff = datetime.utcnow() - timedelta(minutes=2)
            existing = db.query(Alert).filter(
                Alert.zone_id == zone.id,
                Alert.type == active_alert["alert_type"],
                Alert.resolved == False,
                Alert.timestamp >= recent_cutoff
            ).first()

            if not existing:
                db_alert = Alert(
                    id=active_alert["id"],
                    zone_id=zone.id,
                    type=active_alert["alert_type"],
                    severity=active_alert["severity"],
                    message=active_alert["message"],
                    resolved=False
                )
                db.add(db_alert)
                db.commit()

        return active_alert

    @classmethod
    def _check_rapid_growth(cls, db: Session, zone_id: str, current_people: int) -> Optional[Dict[str, Any]]:
        window_start = datetime.utcnow() - timedelta(minutes=cls.TIME_WINDOW_MINUTES)
        past_measurement = db.query(CrowdMeasurement).filter(
            CrowdMeasurement.zone_id == zone_id,
            CrowdMeasurement.timestamp >= window_start
        ).order_by(CrowdMeasurement.timestamp.asc()).first()

        if past_measurement and past_measurement.people_count > 0:
            past_count = past_measurement.people_count
            increase = current_people - past_count
            increase_percent = (increase / past_count) * 100

            if increase_percent >= cls.GROWTH_THRESHOLD_PERCENT and increase >= 5:
                zone = db.query(Zone).filter(Zone.id == zone_id).first()
                zone_name = zone.name if zone else "Zone"
                return {
                    "id": f"alert-{uuid.uuid4().hex[:8]}",
                    "zone_id": zone_id,
                    "zone_name": zone_name,
                    "alert_type": "RAPID_GROWTH",
                    "severity": "warning",
                    "title": f"Rapid Crowd Growth in {zone_name}",
                    "message": f"Crowd increased by {int(increase_percent)}% (+{increase} people) over the past {cls.TIME_WINDOW_MINUTES} mins."
                }
        return None

alert_engine = AlertEngine()
