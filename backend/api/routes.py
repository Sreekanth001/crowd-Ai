import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.database.database import get_db, init_db
from backend.database.models import Location, Zone, Camera, CrowdMeasurement, Alert
from backend.models.schemas import (
    CapacityUpdateSchema, LocationSchema, LocationCreateSchema,
    ZoneSchema, ZoneCreateSchema, ZoneUpdateSchema, CameraSchema,
    AlertSchema, HistoricalAnalyticsSchema, LocationSummarySchema
)
from backend.services.video_processor import video_processor
from backend.services.analytics_service import analytics_service
from backend.services.heatmap_service import heatmap_service
from backend.services.alert_engine import alert_engine
from backend.utils.config import config

router = APIRouter()
init_db()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ----------------------------
# Phase 1 Legacy Endpoints (Preserved)
# ----------------------------
@router.get("/health")
async def health_check():
    return {
        "status": "online",
        "project": config.PROJECT_NAME,
        "title": config.PROJECT_TITLE,
        "version": config.VERSION,
        "phase": 2
    }

@router.get("/analytics")
async def get_current_analytics():
    return video_processor.latest_analytics

@router.post("/capacity")
async def update_capacity(payload: CapacityUpdateSchema, db: Session = Depends(get_db)):
    success = video_processor.set_capacity(payload.capacity)
    if not success:
        raise HTTPException(status_code=400, detail="Capacity must be greater than zero.")
    
    first_zone = db.query(Zone).first()
    if first_zone:
        first_zone.capacity = payload.capacity
        db.commit()

    return {
        "message": "Capacity updated successfully",
        "capacity": payload.capacity,
        "analytics": video_processor.latest_analytics
    }

@router.post("/webcam/start")
async def start_webcam():
    success = video_processor.start_webcam(0)
    if not success:
        raise HTTPException(status_code=500, detail="Unable to access webcam. Please check camera permissions.")
    return {"message": "Webcam started successfully", "source": "webcam"}

@router.post("/webcam/stop")
async def stop_webcam():
    video_processor.stop()
    return {"message": "Video processing stopped", "source": "stopped"}

@router.post("/upload_video")
async def upload_video(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")
    
    allowed_extensions = {".mp4", ".avi", ".mov", ".mkv"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Allowed: mp4, avi, mov, mkv")

    file_path = os.path.join(UPLOAD_DIR, f"input_video{ext}")
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save video file: {str(e)}")

    success = video_processor.start_video_file(file_path)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to process uploaded video file.")

    return {"message": "Video uploaded and processing started", "source": "file", "filename": file.filename}

@router.websocket("/ws/analytics")
async def websocket_analytics(websocket: WebSocket):
    await video_processor.connect_websocket(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        video_processor.disconnect_websocket(websocket)
    except Exception:
        video_processor.disconnect_websocket(websocket)

def generate_video_stream():
    import time
    while True:
        if video_processor.latest_frame_bytes:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + video_processor.latest_frame_bytes + b'\r\n')
            time.sleep(0.04)
        else:
            time.sleep(0.1)

@router.get("/video_feed")
async def video_feed():
    return StreamingResponse(
        generate_video_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# ----------------------------
# Phase 2 Location APIs
# ----------------------------
@router.get("/locations", response_model=List[LocationSchema])
async def get_locations(db: Session = Depends(get_db)):
    locs = db.query(Location).all()
    results = []
    for loc in locs:
        z_count = db.query(Zone).filter(Zone.location_id == loc.id).count()
        results.append(LocationSchema(
            id=loc.id,
            name=loc.name,
            latitude=loc.latitude,
            longitude=loc.longitude,
            zone_count=z_count
        ))
    return results

@router.post("/locations", response_model=LocationSchema)
async def create_location(payload: LocationCreateSchema, db: Session = Depends(get_db)):
    loc_id = payload.id or f"loc-{uuid.uuid4().hex[:8]}"
    existing = db.query(Location).filter(Location.id == loc_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Location ID already exists.")
    
    loc = Location(
        id=loc_id,
        name=payload.name,
        latitude=payload.latitude,
        longitude=payload.longitude
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return LocationSchema(
        id=loc.id,
        name=loc.name,
        latitude=loc.latitude,
        longitude=loc.longitude,
        zone_count=0
    )

@router.get("/locations/{location_id}/summary", response_model=LocationSummarySchema)
async def get_location_summary(location_id: str, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")

    zones = db.query(Zone).filter(Zone.location_id == location_id).all()
    
    zone_schemas = []
    total_people = 0
    total_capacity = 0
    active_alerts_count = 0

    for idx, z in enumerate(zones):
        people = 0
        if video_processor.is_running and idx == 0:
            people = video_processor.latest_analytics.get("people_count", 0)
        
        cap = z.capacity
        occ = round((people / cap) * 100, 2) if cap > 0 else 0.0
        st = video_processor.analyzer.classify_status(occ) if (video_processor.is_running and idx == 0) else ("LOW" if occ < 50 else ("MODERATE" if occ < 80 else ("HIGH" if occ <= 100 else "CRITICAL")))

        # Evaluate alerts for zone
        alert_dict = alert_engine.evaluate_zone(db, z, people)
        if alert_dict:
            active_alerts_count += 1

        # Record measurement in DB
        analytics_service.record_measurement(db, z.id, people, cap, occ, st)

        total_people += people
        total_capacity += cap

        alert_schema = AlertSchema(**alert_dict) if alert_dict else None

        zone_schemas.append(ZoneSchema(
            id=z.id,
            location_id=z.location_id,
            name=z.name,
            capacity=z.capacity,
            latitude=z.latitude,
            longitude=z.longitude,
            people_count=people,
            occupancy=occ,
            status=st,
            alert=alert_schema
        ))

    overall_occupancy = round((total_people / total_capacity) * 100, 2) if total_capacity > 0 else 0.0

    return LocationSummarySchema(
        location_id=loc.id,
        location_name=loc.name,
        total_people=total_people,
        total_capacity=total_capacity,
        overall_occupancy=overall_occupancy,
        active_alerts_count=active_alerts_count,
        zones=zone_schemas
    )

# ----------------------------
# Phase 2 Monitoring Zone APIs
# ----------------------------
@router.get("/locations/{location_id}/zones", response_model=List[ZoneSchema])
async def get_location_zones(location_id: str, db: Session = Depends(get_db)):
    zones = db.query(Zone).filter(Zone.location_id == location_id).all()
    results = []
    for idx, z in enumerate(zones):
        people = video_processor.latest_analytics.get("people_count", 0) if video_processor.is_running and idx == 0 else 0
        occ = round((people / z.capacity) * 100, 2) if z.capacity > 0 else 0.0
        st = video_processor.analyzer.classify_status(occ)
        results.append(ZoneSchema(
            id=z.id,
            location_id=z.location_id,
            name=z.name,
            capacity=z.capacity,
            latitude=z.latitude,
            longitude=z.longitude,
            people_count=people,
            occupancy=occ,
            status=st
        ))
    return results

@router.post("/locations/{location_id}/zones", response_model=ZoneSchema)
async def create_zone(location_id: str, payload: ZoneCreateSchema, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    
    zone_id = payload.id or f"zone-{uuid.uuid4().hex[:8]}"
    new_zone = Zone(
        id=zone_id,
        location_id=location_id,
        name=payload.name,
        capacity=payload.capacity,
        latitude=payload.latitude,
        longitude=payload.longitude
    )
    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)

    return ZoneSchema(
        id=new_zone.id,
        location_id=new_zone.location_id,
        name=new_zone.name,
        capacity=new_zone.capacity,
        latitude=new_zone.latitude,
        longitude=new_zone.longitude,
        people_count=0,
        occupancy=0.0,
        status="LOW"
    )

@router.put("/zones/{zone_id}", response_model=ZoneSchema)
async def update_zone(zone_id: str, payload: ZoneUpdateSchema, db: Session = Depends(get_db)):
    z = db.query(Zone).filter(Zone.id == zone_id).first()
    if not z:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    if payload.name:
        z.name = payload.name
    if payload.capacity:
        z.capacity = payload.capacity
        video_processor.set_capacity(payload.capacity)
    if payload.latitude:
        z.latitude = payload.latitude
    if payload.longitude:
        z.longitude = payload.longitude

    db.commit()
    db.refresh(z)

    people = video_processor.latest_analytics.get("people_count", 0) if video_processor.is_running else 0
    occ = round((people / z.capacity) * 100, 2) if z.capacity > 0 else 0.0

    return ZoneSchema(
        id=z.id,
        location_id=z.location_id,
        name=z.name,
        capacity=z.capacity,
        latitude=z.latitude,
        longitude=z.longitude,
        people_count=people,
        occupancy=occ,
        status=video_processor.analyzer.classify_status(occ)
    )

@router.delete("/zones/{zone_id}")
async def delete_zone(zone_id: str, db: Session = Depends(get_db)):
    z = db.query(Zone).filter(Zone.id == zone_id).first()
    if not z:
        raise HTTPException(status_code=404, detail="Zone not found")
    db.delete(z)
    db.commit()
    return {"message": "Zone deleted successfully", "zone_id": zone_id}

# ----------------------------
# Phase 2 Heatmap & Analytics APIs
# ----------------------------
@router.get("/locations/{location_id}/heatmap")
async def get_heatmap(location_id: str, db: Session = Depends(get_db)):
    first_zone = db.query(Zone).filter(Zone.location_id == location_id).first()
    live_map = {}
    if first_zone:
        live_map[first_zone.id] = video_processor.latest_analytics
    return heatmap_service.get_location_heatmap_data(db, location_id, live_map)

@router.get("/zones/{zone_id}/history", response_model=HistoricalAnalyticsSchema)
async def get_zone_history(zone_id: str, time_filter: str = Query("today"), db: Session = Depends(get_db)):
    return analytics_service.get_zone_history(db, zone_id, time_filter)

# ----------------------------
# Phase 2 Smart Alerts APIs
# ----------------------------
@router.get("/alerts", response_model=List[AlertSchema])
async def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).filter(Alert.resolved == False).order_by(Alert.timestamp.desc()).all()
    results = []
    for a in alerts:
        z = db.query(Zone).filter(Zone.id == a.zone_id).first()
        results.append(AlertSchema(
            id=a.id,
            zone_id=a.zone_id,
            zone_name=z.name if z else "Unknown Zone",
            title=f"{a.type.replace('_', ' ').title()} in {z.name if z else 'Zone'}",
            message=a.message,
            alert_type=a.type,
            severity=a.severity,
            timestamp=a.timestamp.isoformat(),
            resolved=a.resolved
        ))
    return results

@router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, db: Session = Depends(get_db)):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    a.resolved = True
    db.commit()
    return {"message": "Alert resolved successfully", "alert_id": alert_id}
