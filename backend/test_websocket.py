import asyncio
import json
import urllib.request
import websockets
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

async def test_ws_and_api():
    print("Testing capacity API endpoint...")
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/capacity",
        data=json.dumps({"capacity": 75}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req).read().decode()
    print("Capacity update response:", res)

    print("Connecting to WebSocket ws://127.0.0.1:8000/api/ws/analytics ...")
    async with websockets.connect("ws://127.0.0.1:8000/api/ws/analytics") as ws:
        msg = await ws.recv()
        data = json.loads(msg)
        print("Received WebSocket payload:", data)
        assert "people_count" in data
        assert "capacity" in data
        assert data["capacity"] == 75
        assert "occupancy" in data
        assert "status" in data
        assert "timestamp" in data
        print("WebSocket payload verification PASSED!")

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
    asyncio.run(test_ws_and_api())
