"""
Driver's-license OCR: extracts raw text lines from an uploaded license photo
so the verification route can fuzzy-match a driver ID and name against the
vehicle registry.

The EasyOCR reader is loaded once per server process (its model load is
multi-second) and reused for every upload.
"""
import cv2
import easyocr
import numpy as np

_reader = None


def _get_reader():
    global _reader
    if _reader is None:
        print("[LICENSE_OCR] loading EasyOCR reader…")
        _reader = easyocr.Reader(["en"], gpu=False)
    return _reader


def read_license_text(image_bytes: bytes) -> list[str]:
    """Returns every text line EasyOCR can read off the license photo, in
    detection order. Returns [] if the image can't be decoded."""
    if not image_bytes:
        return []
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return []
    results = _get_reader().readtext(img)
    return [text.strip() for (_box, text, _conf) in results if text.strip()]
