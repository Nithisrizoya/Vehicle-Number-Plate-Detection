"""
Sanity check for the fine-tuned YOLOv8 plate detector: runs it over images/,
crops each detected plate, OCRs the crop, and writes annotated images
(box + extracted text) to output/.

Run from the project root:  python scripts/test_on_images.py
"""
import os
import sys
from pathlib import Path

import cv2
import easyocr

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
from plate_detector import load_model, detect_plates, extract_plate_text, draw_detection

MODEL_PATH = PROJECT_ROOT / "models" / "best.pt"
IMAGES_DIR = PROJECT_ROOT / "images"
OUTPUT_DIR = PROJECT_ROOT / "output"
CONF_THRESHOLD = 0.4
IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".bmp")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    model = load_model(MODEL_PATH)
    reader = easyocr.Reader(["en"], gpu=False)

    image_files = sorted(
        f for f in os.listdir(IMAGES_DIR) if f.lower().endswith(IMAGE_EXTENSIONS)
    )
    if not image_files:
        print(f"No images found in '{IMAGES_DIR}'.")
        return

    for image_name in image_files:
        image_path = IMAGES_DIR / image_name
        image = cv2.imread(str(image_path))
        if image is None:
            print(f"Could not read '{image_path}', skipping.")
            continue

        boxes = detect_plates(model, image, conf=CONF_THRESHOLD)
        if len(boxes) == 0:
            print(f"{image_name}: no plate detected")

        for box in boxes:
            det_conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            x1, y1 = max(0, x1), max(0, y1)
            plate_crop = image[y1:y2, x1:x2]
            plate_text, ocr_conf = extract_plate_text(reader, plate_crop)
            draw_detection(image, box.xyxy[0], det_conf, plate_text, ocr_conf)
            print(f"{image_name}: detected plate -> '{plate_text}' (det_conf={det_conf:.2f}, ocr_conf={ocr_conf:.2f})")

        out_path = OUTPUT_DIR / image_name
        cv2.imwrite(str(out_path), image)
        print(f"Saved: {out_path}")


if __name__ == "__main__":
    main()
