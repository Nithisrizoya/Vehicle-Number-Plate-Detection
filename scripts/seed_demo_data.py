"""
Seed output/events.json with a realistic day of shop entry/exit activity, using
the 7 real plates already validated against images/ (see scripts/test_on_images.py).
Copies matching snapshots so "View" buttons in the UI show real photos.

Run from the project root:  python scripts/seed_demo_data.py
"""
import json
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import cv2

PROJECT_ROOT  = Path(__file__).resolve().parent.parent
IMAGES_DIR    = PROJECT_ROOT / "images"
OUTPUT_DIR    = PROJECT_ROOT / "output"
SNAPSHOTS_DIR = OUTPUT_DIR / "snapshots"
EVENTS_PATH   = OUTPUT_DIR / "events.json"

PLATE_IMAGES = {
    "TN09BY9726":     "Screenshot 2026-07-07 174718.png",
    "T1223GJ6607DZ":  "Screenshot 2026-07-07 174745.png",
    "KA05ND007":      "Screenshot 2026-07-07 174851.png",
    "SFJ3162TEXAS":   "Screenshot 2026-07-07 181111.png",
    "MH20DV2366":     "Screenshot 2026-07-07 181437.png",
    "35JF449":        "Screenshot 2026-07-07 181507.png",
    "T0322UP4229B":   "Screenshot 2026-07-07 181528.png",
}

# (minutes_ago, plate, event, confidence, visit_number)
TIMELINE = [
    (420, "TN09BY9726",    "IN",  0.91, 1),
    (410, "TN09BY9726",    "OUT", 0.88, 1),
    (380, "KA05ND007",     "IN",  0.95, 1),   # stays open -> currently inside
    (340, "SFJ3162TEXAS",  "IN",  0.93, 1),
    (310, "SFJ3162TEXAS",  "OUT", 0.90, 1),
    (270, "35JF449",       "IN",  0.97, 1),
    (255, "35JF449",       "OUT", 0.96, 1),
    (210, "MH20DV2366",    "IN",  0.62, 1),   # matches the real low-confidence test case
    (185, "MH20DV2366",    "OUT", 0.68, 1),
    (140, "TN09BY9726",    "IN",  0.89, 2),   # returning vehicle
    (125, "TN09BY9726",    "OUT", 0.92, 2),
    (100, "T1223GJ6607DZ", "IN",  0.85, 1),
    (70,  "T1223GJ6607DZ", "OUT", 0.81, 1),
    (50,  "T0322UP4229B",  "IN",  0.93, 1),   # stays open -> currently inside
    (20,  "MH20DV2366",    "IN",  0.70, 2),   # returning again, stays open -> currently inside
]


def make_snapshot(plate: str) -> str:
    src = IMAGES_DIR / PLATE_IMAGES[plate]
    img = cv2.imread(str(src))
    name = f"evt_{uuid.uuid4().hex}.jpg"
    cv2.imwrite(str(SNAPSHOTS_DIR / name), img)
    return name


def build_events() -> list:
    now = datetime.now(timezone.utc)
    open_in_timestamp: dict[str, str] = {}
    events = []

    for minutes_ago, plate, event, confidence, visit_number in TIMELINE:
        ts = now - timedelta(minutes=minutes_ago)
        duration_seconds = None
        if event == "OUT" and plate in open_in_timestamp:
            in_dt = datetime.fromisoformat(open_in_timestamp[plate])
            duration_seconds = int((ts - in_dt).total_seconds())
        if event == "IN":
            open_in_timestamp[plate] = ts.isoformat()

        events.append({
            "id": uuid.uuid4().hex,
            "plate": plate,
            "event": event,
            "time": ts.strftime("%I:%M:%S %p"),
            "timestamp": ts.isoformat().replace("+00:00", "Z"),
            "date": ts.strftime("%Y-%m-%d"),
            "confidence": confidence,
            "snapshot": make_snapshot(plate),
            "duration_seconds": duration_seconds,
            "visit_number": visit_number,
        })

    return events


def main():
    SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    events = build_events()
    EVENTS_PATH.write_text(json.dumps({"events": events}, indent=2), encoding="utf-8")
    print(f"Seeded {len(events)} events -> {EVENTS_PATH}")


if __name__ == "__main__":
    main()
