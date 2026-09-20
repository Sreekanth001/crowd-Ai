import cv2
import time
import asyncio
import logging
from typing import Set, Optional, Dict, Any
from datetime import datetime
from fastapi import WebSocket

from backend.services.yolo_detector import YOLODetector
from backend.services.crowd_analyzer import CrowdAnalyzer
from backend.utils.config import config

logger = logging.getLogger("video_processor")

class VideoProcessor:
    def __init__(self):
        self.yolo = YOLODetector()
        self.analyzer = CrowdAnalyzer(capacity=config.DEFAULT_CAPACITY)
        
        self.cap: Optional[cv2.VideoCapture] = None
        self.source_type: str = "stopped"  # "webcam", "file", "stopped"
        self.source_path: Optional[str] = None
        
        self.active_websockets: Set[WebSocket] = set()
        self.latest_frame_bytes: Optional[bytes] = None
        self.latest_analytics: Dict[str, Any] = self.analyzer.analyze(0)
        self.is_running: bool = False
        self._task: Optional[asyncio.Task] = None

    async def connect_websocket(self, websocket: WebSocket):
        await websocket.accept()
        self.active_websockets.add(websocket)
        # Send initial analytics payload immediately upon connect
        try:
            payload = {
                **self.latest_analytics,
                "timestamp": datetime.now().isoformat(),
                "source": self.source_type
            }
            await websocket.send_json(payload)
        except Exception as e:
            logger.error(f"Error sending initial WS payload: {e}")

    def disconnect_websocket(self, websocket: WebSocket):
        self.active_websockets.discard(websocket)

    async def broadcast_analytics(self, analytics: Dict[str, Any]):
        if not self.active_websockets:
            return
        
        payload = {
            **analytics,
            "timestamp": datetime.now().isoformat(),
            "source": self.source_type
        }
        
        disconnected = set()
        for ws in self.active_websockets:
            try:
                await ws.send_json(payload)
            except Exception:
                disconnected.add(ws)

        for ws in disconnected:
            self.disconnect_websocket(ws)

    def start_webcam(self, device_index: int = 0) -> bool:
        self.stop()
        self.cap = cv2.VideoCapture(device_index)
        if not self.cap.isOpened():
            logger.error("Failed to open webcam.")
            self.source_type = "stopped"
            return False
        
        self.source_type = "webcam"
        self.is_running = True
        self._task = asyncio.create_task(self._process_loop())
        return True

    def start_video_file(self, file_path: str) -> bool:
        self.stop()
        self.cap = cv2.VideoCapture(file_path)
        if not self.cap.isOpened():
            logger.error(f"Failed to open video file: {file_path}")
            self.source_type = "stopped"
            return False

        self.source_type = "file"
        self.source_path = file_path
        self.is_running = True
        self._task = asyncio.create_task(self._process_loop())
        return True

    def stop(self):
        self.is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
        if self.cap:
            self.cap.release()
            self.cap = None
        self.source_type = "stopped"
        self.latest_frame_bytes = None

    def set_capacity(self, new_capacity: int) -> bool:
        success = self.analyzer.set_capacity(new_capacity)
        if success:
            # Re-evaluate latest analytics
            self.latest_analytics = self.analyzer.analyze(self.latest_analytics.get("people_count", 0))
        return success

    async def _process_loop(self):
        logger.info(f"Starting video process loop for source: {self.source_type}")
        while self.is_running and self.cap and self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret:
                # If loop video file
                if self.source_type == "file" and self.source_path:
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                else:
                    logger.info("Video stream ended or frame unreadable.")
                    break

            # Resize frame to max width 640 for real-time performance
            h, w = frame.shape[:2]
            if w > 640:
                scale = 640 / w
                frame = cv2.resize(frame, (640, int(h * scale)))

            # Run YOLO person detection
            annotated_frame, count, _ = self.yolo.detect(frame)

            # Analyze crowd metrics
            analytics = self.analyzer.analyze(count)
            self.latest_analytics = analytics

            # Encode annotated frame to JPEG for MJPEG endpoint
            _, jpeg_buffer = cv2.imencode('.jpg', annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            self.latest_frame_bytes = jpeg_buffer.tobytes()

            # Broadcast WebSocket analytics
            await self.broadcast_analytics(analytics)

            # Frame rate control (~15 to 20 FPS)
            await asyncio.sleep(0.05)

        self.stop()

# Global singleton video processor instance
video_processor = VideoProcessor()
