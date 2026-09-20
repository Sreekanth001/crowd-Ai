from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.database.models import Zone

class HeatmapService:
    @staticmethod
    def get_location_heatmap_data(db: Session, location_id: str, live_zone_analytics: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        zones = db.query(Zone).filter(Zone.location_id == location_id).all()
        heatmap_points = []

        intensity_weights = {
            "LOW": 0.25,
            "MODERATE": 0.55,
            "HIGH": 0.85,
            "CRITICAL": 1.0
        }

        for z in zones:
            live_data = (live_zone_analytics or {}).get(z.id, {})
            status = live_data.get("status", "LOW")
            occupancy = live_data.get("occupancy", 0.0)
            people = live_data.get("people_count", 0)

            weight = intensity_weights.get(status, 0.25)
            # Scale weight proportionally to occupancy percentage
            normalized_weight = round(min(1.0, max(0.1, occupancy / 100.0)), 2)

            heatmap_points.append({
                "zone_id": z.id,
                "zone_name": z.name,
                "latitude": z.latitude,
                "longitude": z.longitude,
                "weight": normalized_weight,
                "status": status,
                "people_count": people,
                "occupancy": occupancy,
                "capacity": z.capacity
            })

        return heatmap_points

heatmap_service = HeatmapService()
