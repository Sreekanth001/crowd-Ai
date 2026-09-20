import cv2
import numpy as np
import logging
from ultralytics import YOLO
from typing import Tuple, List, Dict, Any
from backend.utils.config import config

logger = logging.getLogger("yolo_detector")

class YOLODetector:
    def __init__(self, model_path: str = config.YOLO_MODEL_PATH):
        logger.info(f"Loading YOLO model from {model_path}...")
        self.model = YOLO(model_path)
        # Class index 0 in COCO model corresponds to 'person'
        self.target_class_id = 0

    def detect(self, frame: np.ndarray) -> Tuple[np.ndarray, int, List[Dict[str, Any]]]:
        """
        Runs YOLO inference on a single OpenCV BGR image frame.
        Filters for 'person' class (ID 0).
        Draws bounding boxes and labels onto a copy of the frame.
        Returns: (annotated_frame, people_count, list_of_detection_dicts)
        """
        if frame is None or frame.size == 0:
            return frame, 0, []

        annotated_frame = frame.copy()
        
        # Perform inference with conf threshold
        results = self.model(frame, verbose=False, conf=0.35)
        
        detections = []
        people_count = 0

        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())

                # Only target 'person' class (index 0)
                if cls_id == self.target_class_id:
                    people_count += 1
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

                    detections.append({
                        "bbox": [x1, y1, x2, y2],
                        "confidence": round(confidence, 2)
                    })

                    # Draw stylish bounding box
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 230, 118), 2)
                    
                    # Draw label badge
                    label = f"Person {int(confidence * 100)}%"
                    (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                    cv2.rectangle(annotated_frame, (x1, y1 - 20), (x1 + w + 8, y1), (0, 230, 118), -1)
                    cv2.putText(annotated_frame, label, (x1 + 4, y1 - 5),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (10, 15, 29), 1, cv2.LINE_AA)

        # Draw overlay header on top of frame
        overlay_text = f"People Detected: {people_count}"
        cv2.rectangle(annotated_frame, (10, 10), (250, 45), (15, 23, 42), -1)
        cv2.rectangle(annotated_frame, (10, 10), (250, 45), (59, 130, 246), 1)
        cv2.putText(annotated_frame, overlay_text, (20, 34),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)

        return annotated_frame, people_count, detections
