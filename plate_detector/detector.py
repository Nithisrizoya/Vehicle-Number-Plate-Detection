"""YOLOv8 plate-detection wrapper."""
from ultralytics import YOLO

DEFAULT_CONF_THRESHOLD = 0.4


def load_model(model_path):
    return YOLO(str(model_path))


def detect_plates(model, frame, conf: float = DEFAULT_CONF_THRESHOLD):
    """Run detection on a frame; returns the boxes above `conf`."""
    results = model.predict(source=frame, conf=conf, verbose=False)[0]
    return results.boxes
