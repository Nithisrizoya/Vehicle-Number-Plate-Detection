"""Drawing helpers for visualizing detections on a frame."""
import cv2


def draw_detection(frame, box_xyxy, det_conf: float, plate_text: str, ocr_conf: float):
    x1, y1, x2, y2 = map(int, box_xyxy)
    x1, y1 = max(0, x1), max(0, y1)
    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
    label = f"{plate_text} ({ocr_conf:.2f})" if plate_text else f"UNREADABLE (det={det_conf:.2f})"
    text_y = y1 - 10 if y1 - 10 > 10 else y1 + 20
    cv2.putText(frame, label, (x1, text_y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)
    return x1, y1, x2, y2
