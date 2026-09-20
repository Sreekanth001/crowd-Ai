from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False, default=9.9252)
    longitude = Column(Float, nullable=False, default=78.1198)
    created_at = Column(DateTime, default=datetime.utcnow)

    zones = relationship("Zone", back_populates="location", cascade="all, delete-orphan")

class Zone(Base):
    __tablename__ = "zones"

    id = Column(String, primary_key=True, index=True)
    location_id = Column(String, ForeignKey("locations.id"), nullable=False)
    name = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False, default=50)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location", back_populates="zones")
    cameras = relationship("Camera", back_populates="zone", cascade="all, delete-orphan")
    measurements = relationship("CrowdMeasurement", back_populates="zone", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="zone", cascade="all, delete-orphan")

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String, primary_key=True, index=True)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False, default="webcam") # "webcam" | "uploaded_video"
    status = Column(String, default="active")
    source_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("Zone", back_populates="cameras")

class CrowdMeasurement(Base):
    __tablename__ = "crowd_measurements"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    people_count = Column(Integer, nullable=False, default=0)
    capacity = Column(Integer, nullable=False, default=50)
    occupancy = Column(Float, nullable=False, default=0.0)
    status = Column(String, nullable=False, default="LOW")

    zone = relationship("Zone", back_populates="measurements")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False)
    type = Column(String, nullable=False)  # "HIGH_OCCUPANCY" | "CAPACITY_EXCEEDED" | "RAPID_GROWTH"
    severity = Column(String, nullable=False, default="warning") # "warning" | "critical"
    message = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    resolved = Column(Boolean, default=False)

    zone = relationship("Zone", back_populates="alerts")
