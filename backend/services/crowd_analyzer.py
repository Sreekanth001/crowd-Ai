from typing import Dict, Any, Optional

class CrowdAnalyzer:
    def __init__(self, capacity: int = 50):
        self.capacity = capacity if capacity > 0 else 50

    def set_capacity(self, capacity: int) -> bool:
        if capacity <= 0:
            return False
        self.capacity = capacity
        return True

    def calculate_occupancy(self, people_count: int, capacity: Optional[int] = None) -> float:
        cap = capacity if (capacity is not None and capacity > 0) else self.capacity
        if cap <= 0:
            return 0.0
        people_count = max(0, people_count)
        return round((people_count / cap) * 100, 2)

    def classify_status(self, occupancy_percentage: float) -> str:
        if occupancy_percentage < 50.0:
            return "LOW"
        elif occupancy_percentage < 80.0:
            return "MODERATE"
        elif occupancy_percentage <= 100.0:
            return "HIGH"
        else:
            return "CRITICAL"

    def analyze(
        self,
        people_count: int,
        capacity: Optional[int] = None,
        zone_id: Optional[str] = None,
        zone_name: Optional[str] = None
    ) -> Dict[str, Any]:
        cap = capacity if (capacity is not None and capacity > 0) else self.capacity
        occupancy = self.calculate_occupancy(people_count, cap)
        status = self.classify_status(occupancy)
        alert = None

        target_label = f"'{zone_name}'" if zone_name else "monitored zone"

        if status == "HIGH":
            alert = {
                "alert_type": "HIGH",
                "title": "High Crowd Alert",
                "message": f"Crowd density in {target_label} is approaching maximum capacity."
            }
        elif status == "CRITICAL":
            alert = {
                "alert_type": "CRITICAL",
                "title": "Critical Alert",
                "message": f"Maximum capacity in {target_label} has been exceeded."
            }

        res = {
            "people_count": people_count,
            "capacity": cap,
            "occupancy": occupancy,
            "status": status,
            "alert": alert
        }
        if zone_id:
            res["zone_id"] = zone_id
        if zone_name:
            res["zone_name"] = zone_name
        return res

