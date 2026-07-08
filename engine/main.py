"""
Vehicle plate gate-tracking engine.

Run against a recorded video file or a webcam (source "0"). Detects plates with
the fine-tuned YOLOv8 model, OCRs them via the plate_detector package, and
maintains a persistent IN/OUT gate log via gate.GateTracker.

CLI:  main.py <video_path|0> --no-preview [--no-save]
"""
import argparse
import sys
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

                    draw_detection(frame, bbox, det_conf, plate_text, ocr_conf)

                    # A genuinely new/different-looking read still gets its own event + snapshot
                    # (so two distinct-looking reads of a hard-to-read plate both stay visible).
                    # But if a later read of the SAME already-active plate comes back with higher
                    # confidence, upgrade that event's stored confidence/snapshot in place instead
                    # of leaving it frozen on a weaker first read.
                    if plate_text and ocr_conf >= OCR_MIN_CONFIDENCE and len(plate_text) >= OCR_MIN_LENGTH:
                        result = tracker.observe(plate_text, ocr_conf, now)
                        if result and result["action"] == "new":
                            canonical, event_type = result["plate"], result["event_type"]
                            snapshot = save_snapshot(frame)
                            record = build_event(canonical, event_type, ocr_conf, snapshot, events, box_track["sighting_id"])
                            events.append(record)
                            tracker.finalize(canonical, record["id"])
                            save_events(events)
                            write_live(len(tracker.plates_seen))
                            print(f"[ENGINE] {event_type} {canonical} (conf={ocr_conf:.2f}, visit=#{record['visit_number']})")
                        elif result and result["action"] == "upgrade":
                            for e in reversed(events):
                                if e["id"] == result["event_id"]:
                                    e["confidence"] = round(ocr_conf, 2)
                                    e["snapshot"] = save_snapshot(frame)
                                    break
                            save_events(events)
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
