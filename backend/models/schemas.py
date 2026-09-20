from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class CapacityUpdateSchema(BaseModel):
    capacity: int = Field(..., gt=0, description="Maximum capacity must be greater than zero")

class CrowdAnalyticsSchema(BaseModel):
    people_count: int
    capacity: int
    occupancy: float
    status: str
    timestamp: str
    zone_id: Optional[str] = None
    zone_name: Optional[str] = None

class AlertSchema(BaseModel):
    id: Optional[str] = None
    zone_id: Optional[str] = None
    zone_name: Optional[str] = None
    title: str
    message: str
    alert_type: str # "HIGH_OCCUPANCY" | "CAPACITY_EXCEEDED" | "RAPID_GROWTH"
    severity: str = "warning" # "warning" | "critical"
    timestamp: Optional[str] = None
    resolved: bool = False

class LocationCreateSchema(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., min_length=2)
    latitude: float
    longitude: float

class LocationSchema(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    zone_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ZoneCreateSchema(BaseModel):
    id: Optional[str] = None
    location_id: Optional[str] = None
    name: str = Field(..., min_length=1)
    capacity: int = Field(..., gt=0)
    latitude: float
    longitude: float

class ZoneUpdateSchema(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = Field(None, gt=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ZoneSchema(BaseModel):
    id: str
    location_id: str
    name: str
    capacity: int
    latitude: float
    longitude: float
    people_count: int = 0
    occupancy: float = 0.0
    status: str = "LOW"
    alert: Optional[AlertSchema] = None

    class Config:
        from_attributes = True

class CameraSchema(BaseModel):
    id: str
    zone_id: str
    name: str
    type: str # "webcam" | "uploaded_video"
    status: str = "active"
    source_path: Optional[str] = None

    class Config:
        from_attributes = True

class HistoricalAnalyticsSchema(BaseModel):
    zone_id: str
    zone_name: str
    time_filter: str
    peak_people: int
    avg_people: float
    peak_occupancy: float
    avg_occupancy: float
    high_events_count: int
    critical_events_count: int
    datapoints: List[dict]

class LocationSummarySchema(BaseModel):
    location_id: str
    location_name: str
    total_people: int
    total_capacity: int
    overall_occupancy: float
    active_alerts_count: int
    zones: List[ZoneSchema]
