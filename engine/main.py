"""
Vehicle plate gate-tracking engine.

Run against a recorded video file or a webcam (source "0"). Detects plates with
the fine-tuned YOLOv8 model, OCRs them via the plate_detector package, and
maintains a persistent IN/OUT gate log via gate.GateTracker.

CLI:  main.py <video_path|0> --no-preview [--no-save]
"""
import argparse
import sys
import threading
import time
from pathlib import Path

import cv2
import easyocr
import imageio

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
from plate_detector import load_model, detect_plates, extract_plate_text, draw_detection

from gate import GateTracker, build_event
from tracker import BoxTracker
from vehicle_ai import classify_vehicle
from storage import (
    ensure_dirs, load_events, save_events, write_live, write_progress,
    save_snapshot, OUTPUT_DIR, PREVIEW_PATH,
)

sys.stdout.reconfigure(line_buffering=True)

MODEL_PATH = PROJECT_ROOT / "models" / "best.pt"
DET_CONF_THRESHOLD = 0.4   # YOLO box confidence
OCR_MIN_CONFIDENCE = 0.6   # below detect_plates.py's validated floor of 0.62 for a real read, above garbage OCR
OCR_MIN_LENGTH     = 6
PREVIEW_INTERVAL   = 0.25
PROGRESS_INTERVAL  = 0.5

# A plate box is present in nearly every frame once a car is in view, and OCR (even
# throttled per-box) is the dominant cost. Only running detection+OCR on every Nth frame
# is what actually keeps a clip fast; a car stays in frame for well over a second, so
# this still samples it several times even at a wide stride.
DETECT_FRAME_STRIDE = 8

# Guards output/events.json against a torn write if a background vehicle-AI
# classification finishes and saves at the same moment the main loop does.
_events_lock = threading.Lock()

# How wide/tall a crop around the plate to send for brand classification, as a
# multiple of the plate's own size — wide and tall enough to reach the grille,
# badge, and headlights, but no wider (a plate is roughly a quarter of a car's
# front-end width, and the badge sits only a few plate-heights above it).
VEHICLE_CROP_WIDTH_RATIO = 4.0
VEHICLE_CROP_UP_RATIO    = 4.5
VEHICLE_CROP_DOWN_RATIO  = 1.2

# The badge itself only occupies a small fraction of even this crop, so
# upscaling before sending gives the vision model more effective resolution
# to work with on that specific region instead of the badge being a handful
# of blurry pixels in a normal-sized frame.
VEHICLE_CROP_UPSCALE = 2.5


def _save_events(events: list) -> None:
    with _events_lock:
        save_events(events)


def _vehicle_crop_jpeg(frame, bbox) -> bytes:
    """JPEG-encodes a close-up crop centered on the plate but wide/tall enough
    to include the grille, badge, and headlights. Must be captured before
    draw_detection() burns annotations onto `frame` — a legible badge is what
    keeps the AI's brand guess honest instead of hallucinated from a tiny,
    distant, or badge-less view of the whole scene."""
    x1, y1, x2, y2 = bbox
    plate_w, plate_h = x2 - x1, y2 - y1
    if plate_w <= 0 or plate_h <= 0:
        return b""
    frame_h, frame_w = frame.shape[:2]
    cx = (x1 + x2) / 2
    half_w = plate_w * VEHICLE_CROP_WIDTH_RATIO / 2
    cx1, cx2 = max(0, int(cx - half_w)), min(frame_w, int(cx + half_w))
    cy1 = max(0, int(y1 - plate_h * VEHICLE_CROP_UP_RATIO))
    cy2 = min(frame_h, int(y2 + plate_h * VEHICLE_CROP_DOWN_RATIO))
    crop = frame[cy1:cy2, cx1:cx2]
    if crop.size == 0:
        return b""
    crop_h, crop_w = crop.shape[:2]
    crop = cv2.resize(
        crop, (int(crop_w * VEHICLE_CROP_UPSCALE), int(crop_h * VEHICLE_CROP_UPSCALE)),
        interpolation=cv2.INTER_CUBIC,
    )
    ok, buf = cv2.imencode(".jpg", crop, [cv2.IMWRITE_JPEG_QUALITY, 95])
    return buf.tobytes() if ok else b""


def _classify_and_store(event_id: str, image_bytes: bytes, events: list) -> None:
    """Runs on a background thread so the (potentially multi-second) Domo AI
    call never stalls frame processing. Mutates the same event dict the main
    loop already holds a reference to, then persists it."""
    result = classify_vehicle(image_bytes)
    if not result:
        return
    for e in reversed(events):
        if e["id"] == event_id:
            e["brand"], e["colour"] = result["brand"], result["colour"]
            break
    _save_events(events)
    print(f"[VEHICLE_AI] {result.get('brand') or '?'} / {result.get('colour') or '?'} -> event {event_id}")


def run(source: str, save_video: bool) -> int:
    ensure_dirs()

    print(f"[ENGINE] Loading model from {MODEL_PATH}")
    model = load_model(MODEL_PATH)
    reader = easyocr.Reader(["en"], gpu=False)

    events = load_events()
    tracker = GateTracker(events)
    box_tracker = BoxTracker()
    print(f"[ENGINE] Loaded {len(events)} historical events ({tracker.currently_inside()} currently inside)")

    is_webcam = source == "0"
    cap = cv2.VideoCapture(0 if is_webcam else source)
    if not cap.isOpened():
        print(f"[ENGINE] ERROR: could not open source: {source}")
        return 1

    writer = None
    total_frames = 0
    if save_video:
        fps = cap.get(cv2.CAP_PROP_FPS) or 25
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        out_path = OUTPUT_DIR / f"{Path(source).stem}_annotated.mp4"
        # cv2.VideoWriter's mp4v/FMP4 codec isn't decodable by any browser's <video> tag —
        # the file "works" but silently fails in the UI. imageio's bundled ffmpeg (via
        # imageio-ffmpeg) encodes real H.264/yuv420p, which every browser can play.
        writer = imageio.get_writer(
            str(out_path), fps=fps, codec="libx264", quality=8,
            pixelformat="yuv420p", macro_block_size=1,
        )
        print(f"[ENGINE] Writing annotated output to {out_path}")

    frame_idx = 0
    last_preview_write = 0.0
    last_progress_write = 0.0

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frame_idx += 1
            now = time.time()

            if frame_idx % DETECT_FRAME_STRIDE == 1:
                boxes = detect_plates(model, frame, conf=DET_CONF_THRESHOLD)

                for box in boxes:
                    det_conf = float(box.conf[0])
                    bbox = tuple(box.xyxy[0].tolist())
                    x1, y1, x2, y2 = bbox

                    cached, box_track = box_tracker.lookup(bbox, det_conf, now)
                    if cached is not None:
                        plate_text, ocr_conf = cached
                    else:
                        crop = frame[max(0, int(y1)):int(y2), max(0, int(x1)):int(x2)]
                        plate_text, ocr_conf = extract_plate_text(reader, crop)
                        box_tracker.record_ocr(box_track, plate_text, ocr_conf, now)

                    vehicle_crop_jpeg = _vehicle_crop_jpeg(frame, bbox)  # before annotations are drawn
                    draw_detection(frame, bbox, det_conf, plate_text, ocr_conf)

                    # Identity for gate/visit tracking comes from the box-track (one physical
                    # car = one sighting_id), not from fuzzy-matching OCR text. A car sitting in
                    # frame gets re-OCR'd every OCR_REFRESH_SEC, and those re-reads can look quite
                    # different from each other (glare, angle, motion blur) — matching them by
                    # string similarity alone let a single car log two "IN" events. Instead: the
                    # box-track's first qualifying read opens the event; every later read from
                    # that SAME track only ever refreshes it (plate text, confidence, snapshot)
                    # when it's a higher-confidence read, so one car never produces more than one
                    # record.
                    if plate_text and ocr_conf >= OCR_MIN_CONFIDENCE and len(plate_text) >= OCR_MIN_LENGTH:
                        if box_track["event_id"] is not None:
                            if ocr_conf > box_track["event_conf"]:
                                tracker.rename(box_track["event_plate"], plate_text)
                                for e in reversed(events):
                                    if e["id"] == box_track["event_id"]:
                                        e["plate"] = plate_text
                                        e["confidence"] = round(ocr_conf, 2)
                                        e["snapshot"] = save_snapshot(frame)
                                        break
                                box_track["event_plate"] = plate_text
                                box_track["event_conf"] = ocr_conf
                                _save_events(events)
                                print(f"[ENGINE] upgraded {plate_text} snapshot (conf={ocr_conf:.2f})")
                        else:
                            result = tracker.observe(plate_text, ocr_conf, now)
                            if result and result["action"] == "new":
                                canonical, event_type = result["plate"], result["event_type"]
                                snapshot = save_snapshot(frame)
                                record = build_event(canonical, event_type, ocr_conf, snapshot, events, box_track["sighting_id"])
                                events.append(record)
                                tracker.finalize(canonical, record["id"])
                                box_track["event_id"] = record["id"]
                                box_track["event_plate"] = canonical
                                box_track["event_conf"] = ocr_conf

                                # An OUT closing a visit is the same physical car as its IN — reuse
                                # that classification instead of spending a second AI call on it.
                                paired_in = None
                                if event_type == "OUT":
                                    paired_in = next(
                                        (e for e in reversed(events)
                                         if e.get("plate") == canonical and e.get("event") == "IN"
                                         and e.get("visit_number") == record["visit_number"]),
                                        None,
                                    )
                                if paired_in and (paired_in.get("brand") or paired_in.get("colour")):
                                    record["brand"]  = paired_in.get("brand")
                                    record["colour"] = paired_in.get("colour")
                                else:
                                    threading.Thread(
                                        target=_classify_and_store,
                                        args=(record["id"], vehicle_crop_jpeg, events),
                                        daemon=True,
                                    ).start()

                                _save_events(events)
                                write_live(len(tracker.plates_seen))
                                print(f"[ENGINE] {event_type} {canonical} (conf={ocr_conf:.2f}, visit=#{record['visit_number']})")
                            elif result and result["action"] == "upgrade":
                                for e in reversed(events):
                                    if e["id"] == result["event_id"]:
                                        e["confidence"] = round(ocr_conf, 2)
                                        e["snapshot"] = save_snapshot(frame)
                                        break
                                _save_events(events)
                                print(f"[ENGINE] upgraded {result['plate']} snapshot (conf={ocr_conf:.2f})")

                tracker.sweep(now)
                box_tracker.sweep(now)
            else:
                # Skipped frame: redraw the last known boxes so the annotated video doesn't flicker.
                for bbox, det_conf, plate_text, ocr_conf in box_tracker.active_tracks():
                    draw_detection(frame, bbox, det_conf, plate_text, ocr_conf)

            if writer is not None:
                writer.append_data(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                if total_frames and now - last_progress_write > PROGRESS_INTERVAL:
                    pct = min(100, int(frame_idx / total_frames * 100))
                    write_progress(pct, frame_idx)
                    last_progress_write = now
            elif now - last_preview_write > PREVIEW_INTERVAL:
                cv2.imwrite(str(PREVIEW_PATH), frame)
                last_preview_write = now
    finally:
        cap.release()
        if writer is not None:
            writer.close()
            write_progress(100, frame_idx)

    print(f"[ENGINE] Finished - {frame_idx} frames processed, {len(tracker.plates_seen)} distinct plate(s) seen")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", help='Video file path, or "0" for webcam')
    parser.add_argument("--no-preview", action="store_true", help="headless - never opens a debug window")
    parser.add_argument("--no-save", action="store_true", help="skip writing an annotated output video (live mode)")
    args = parser.parse_args()

    sys.exit(run(args.source, save_video=not args.no_save))


if __name__ == "__main__":
    main()
