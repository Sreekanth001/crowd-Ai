import cv2
import numpy as np
import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.yolo_detector import YOLODetector

def run_test():
    print("Initializing YOLO Detector test...")
    detector = YOLODetector()
    
    # Create a synthetic image (640x480) with a dark background
    test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    test_frame[:] = (40, 40, 40)
    
    # Run YOLO detection on test frame
    annotated_frame, count, detections = detector.detect(test_frame)
    
    print(f"Detection Test Completed Successfully!")
    print(f"Frame shape: {annotated_frame.shape}")
    print(f"People count detected: {count}")
    print(f"Detections list: {detections}")

if __name__ == "__main__":
    run_test()
