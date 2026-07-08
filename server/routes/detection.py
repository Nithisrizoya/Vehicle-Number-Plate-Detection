"""
Detection routes: /api/upload, /api/start-live, /api/stop, /api/processing
"""
import json
import re
import shutil
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from config import (
    ALLOWED_EXTENSIONS, EVENTS_PATH, LIVE_PATH, PREVIEW_PATH,
    PROGRESS_PATH, SNAPSHOTS_DIR, UPLOADS_DIR,
)
from process_manager import kill_child, spawn_live, spawn_video
from state import proc


def _clear_preview():
    try:
        if PREVIEW_PATH.exists():
            PREVIEW_PATH.unlink()
    except Exception:
        pass


def _reset_for_new_run():
    """A fresh upload starts clean: no stale 100% from the last run's progress
    bar, and no carried-over plate history from previous videos."""
    try:
        PROGRESS_PATH.write_text(json.dumps({"pct": 0, "frame": 0}), encoding="utf-8")
        LIVE_PATH.write_text(json.dumps({"plates_seen": 0}), encoding="utf-8")
        EVENTS_PATH.write_text(json.dumps({"events": []}, indent=2), encoding="utf-8")
        for snap in SNAPSHOTS_DIR.glob("*.jpg"):
            snap.unlink()
    except Exception:
        pass

router = APIRouter()


# ── POST /api/upload ─────────────────────────────────────────────────────────
@router.post("/api/upload")
async def upload(video: UploadFile = File(...)):
    if proc.running:
        raise HTTPException(status_code=409, detail="Already processing.")
    if not video.filename:
        raise HTTPException(status_code=400, detail="No filename.")
    if Path(video.filename).suffix.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid video format.")

    safe = re.sub(r"[^\w.\-]", "_", video.filename)
    dest = UPLOADS_DIR / safe

    with open(dest, "wb") as f:
        shutil.copyfileobj(video.file, f)

    _reset_for_new_run()
    proc.start(filename=safe, output_video=f"{dest.stem}_annotated.mp4", mode="video")
    spawn_video(dest)

    return {"ok": True, "filename": safe, "outputVideo": proc.output_video}


# ── POST /api/start-live ──────────────────────────────────────────────────────
@router.post("/api/start-live")
async def start_live():
    if proc.running:
        raise HTTPException(status_code=409, detail="Already processing.")
    _clear_preview()   # remove any stale frame before the new session writes its first frame
    proc.start(filename="Live Camera", mode="live")
    spawn_live()
    return {"ok": True}


# ── POST /api/stop ────────────────────────────────────────────────────────────
@router.post("/api/stop")
async def stop():
    if not proc.running:
        return {"ok": True, "msg": "Not running"}
    try:
        kill_child(proc._child)
        proc.running   = False
        proc.exit_code = 0
        proc._child    = None
        proc.add_log("⏹ Stopped by user")
        # taskkill /F on Windows kills the process before Python's finally block runs,
        # leaving the stale preview JPEG on disk. Delete it here so the next start
        # shows the "Starting detection…" spinner instead of the old frame.
        _clear_preview()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"ok": True}


# ── GET /api/processing ───────────────────────────────────────────────────────
@router.get("/api/processing")
async def processing():
    return proc.to_dict()
