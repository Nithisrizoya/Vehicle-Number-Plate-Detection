"""JSON/file persistence for the gate-tracking engine: events log, live
plate counter, progress, and snapshot images."""
import json
import uuid
from pathlib import Path

import cv2

PROJECT_ROOT  = Path(__file__).resolve().parent.parent
OUTPUT_DIR    = PROJECT_ROOT / "output"
EVENTS_PATH   = OUTPUT_DIR / "events.json"
LIVE_PATH     = OUTPUT_DIR / "live.json"
SNAPSHOTS_DIR = OUTPUT_DIR / "snapshots"
PREVIEW_PATH  = OUTPUT_DIR / "preview_frame.jpg"
PROGRESS_PATH = OUTPUT_DIR / "progress.json"


def ensure_dirs() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)


def load_events() -> list:
    try:
        return json.loads(EVENTS_PATH.read_text(encoding="utf-8")).get("events", [])
    except Exception:
        return []


def save_events(events: list) -> None:
    EVENTS_PATH.write_text(json.dumps({"events": events}, indent=2), encoding="utf-8")


def write_live(plates_seen: int) -> None:
    LIVE_PATH.write_text(json.dumps({"plates_seen": plates_seen}), encoding="utf-8")


def write_progress(pct: int, frame: int) -> None:
    PROGRESS_PATH.write_text(json.dumps({"pct": pct, "frame": frame}), encoding="utf-8")


def save_snapshot(frame) -> str:
    name = f"evt_{uuid.uuid4().hex}.jpg"
    cv2.imwrite(str(SNAPSHOTS_DIR / name), frame)
    return name
