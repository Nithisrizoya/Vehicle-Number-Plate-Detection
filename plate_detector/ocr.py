"""
OCR pipeline for cropped plate regions.

Plate crops are tiny (often <60px tall), blurry, and lit unevenly, so no single
preprocessing works for every image. Try a few variants and keep whichever the
OCR reads with the highest confidence.
"""
import cv2

OCR_ALLOWLIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
MIN_UPSCALE_HEIGHT = 200
EARLY_EXIT_CONFIDENCE = 0.85  # a clear plate reads confidently on the first, cheapest variant —
                              # no need to burn time on the other 3 preprocessing attempts


def sharpen(gray, amount: float = 1.5):
    blurred = cv2.GaussianBlur(gray, (0, 0), 3)
    return cv2.addWeighted(gray, 1 + amount, blurred, -amount, 0)


def preprocess_variants(gray):
    h, w = gray.shape
    scale = max(1, MIN_UPSCALE_HEIGHT // h)
    up = cv2.resize(gray, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)
    otsu = cv2.threshold(up, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(up)

    scale2 = max(1, (MIN_UPSCALE_HEIGHT * 3 // 2) // h)
    up2 = cv2.resize(gray, (w * scale2, h * scale2), interpolation=cv2.INTER_CUBIC)
    sharp_otsu = cv2.threshold(sharpen(up2), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    return [up, otsu, clahe, sharp_otsu]


def extract_plate_text(reader, plate_crop):
    if plate_crop.size == 0:
        return "", 0.0

    gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
    best_text, best_conf = "", 0.0

    for candidate in preprocess_variants(gray):
        # EasyOCR's default canvas_size=2560 forces its internal detector to needlessly
        # upscale these already-small crops, which alone was costing ~1s/call. Our
        # variants top out around 300-450px, so a much smaller canvas is plenty.
        results = reader.readtext(candidate, allowlist=OCR_ALLOWLIST, canvas_size=640, mag_ratio=1.0)
        if not results:
            continue
        results.sort(key=lambda r: r[0][0][0])  # left-to-right by box x-position
        text = "".join(r[1] for r in results).strip().upper()
        avg_conf = sum(r[2] for r in results) / len(results)
        if avg_conf > best_conf:
            best_text, best_conf = text, avg_conf
        if best_conf >= EARLY_EXIT_CONFIDENCE:
            break

    return best_text, best_conf
