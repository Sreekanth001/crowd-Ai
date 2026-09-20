import sys
import os
import json
import urllib.request

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def test_phase2_endpoints():
    base_url = "http://127.0.0.1:8000/api"
    print("Testing Phase 2 REST API Endpoints...")

    # 1. Health check
    res = urllib.request.urlopen(f"{base_url}/health").read().decode()
    health = json.loads(res)
    print("Health check response:", health)
    assert health["status"] == "online"
    assert health["phase"] == 2

    # 2. Locations endpoint
    res = urllib.request.urlopen(f"{base_url}/locations").read().decode()
    locations = json.loads(res)
    print(f"Locations count: {len(locations)}")
    assert len(locations) > 0
    loc_id = locations[0]["id"]

    # Create a test zone via API
    zone_payload = json.dumps({
        "name": "Map Clicked Test Zone",
        "capacity": 150,
        "latitude": 9.9252,
        "longitude": 78.1198
    }).encode("utf-8")
    req = urllib.request.Request(f"{base_url}/locations/{loc_id}/zones", data=zone_payload, headers={"Content-Type": "application/json"}, method="POST")
    res = urllib.request.urlopen(req).read().decode()
    created_zone = json.loads(res)
    print("Created test zone via API:", created_zone["name"])

    # 3. Location Summary endpoint
    res = urllib.request.urlopen(f"{base_url}/locations/{loc_id}/summary").read().decode()
    summary = json.loads(res)
    print(f"Location summary for '{summary['location_name']}':")
    print(f" - Total People: {summary['total_people']}")
    print(f" - Total Capacity: {summary['total_capacity']}")
    print(f" - Overall Occupancy: {summary['overall_occupancy']}%")
    print(f" - Zones count: {len(summary['zones'])}")
    assert len(summary["zones"]) >= 1

    # 4. Zones endpoint
    res = urllib.request.urlopen(f"{base_url}/locations/{loc_id}/zones").read().decode()
    zones = json.loads(res)
    assert len(zones) >= 1

    # 5. Zone History endpoint
    zone_id = zones[0]["id"]
    res = urllib.request.urlopen(f"{base_url}/zones/{zone_id}/history?time_filter=today").read().decode()
    history = json.loads(res)
    print(f"Zone history for '{history['zone_name']}': peak_people={history['peak_people']}")
    assert "datapoints" in history

    # 6. Location Heatmap endpoint
    res = urllib.request.urlopen(f"{base_url}/locations/{loc_id}/heatmap").read().decode()
    heatmap = json.loads(res)
    print(f"Heatmap points count: {len(heatmap)}")
    assert len(heatmap) >= 1

    # 7. Active Alerts endpoint
    res = urllib.request.urlopen(f"{base_url}/alerts").read().decode()
    alerts = json.loads(res)
    print(f"Active alerts count: {len(alerts)}")

    print("\nAll Phase 2 Backend REST API tests PASSED successfully!")

if __name__ == "__main__":
    import threading, time
    import uvicorn
    from backend.main import app

    server_thread = threading.Thread(
        target=lambda: uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning"),
        daemon=True
    )
    server_thread.start()
    time.sleep(2)
    test_phase2_endpoints()
