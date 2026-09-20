class Config:
    PROJECT_NAME: str = "CrowdVision AI"
    PROJECT_TITLE: str = "Real-Time Crowd Monitoring MVP"
    VERSION: str = "1.0.0"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEFAULT_CAPACITY: int = 50
    YOLO_MODEL_PATH: str = "yolov8n.pt"

config = Config()
