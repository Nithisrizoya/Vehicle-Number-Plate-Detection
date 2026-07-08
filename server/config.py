"""
Paths, environment variables, and shared helpers.
"""
import json
from pathlib import Path

# ── Directory layout ────────────────────────────────────────────────────────
HERE          = Path(__file__).parent.resolve()
PROJECT_ROOT  = HERE.parent                 # d:\Vehicle-Plate-Detection
ENGINE_DIR    = PROJECT_ROOT / "engine"
OUTPUT_DIR    = PROJECT_ROOT / "output"
EVENTS_PATH   = OUTPUT_DIR / "events.json"
LIVE_PATH     = OUTPUT_DIR / "live.json"
SNAPSHOTS_DIR = OUTPUT_DIR / "snapshots"
UPLOADS_DIR   = OUTPUT_DIR / "uploads"
PREVIEW_PATH  = OUTPUT_DIR / "preview_frame.jpg"
PROGRESS_PATH = OUTPUT_DIR / "progress.json"

for _d in (SNAPSHOTS_DIR, UPLOADS_DIR):
    _d.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}

# ── Helpers ──────────────────────────────────────────────────────────────────
def read_json(path: Path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback
