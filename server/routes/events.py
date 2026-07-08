"""
Events routes: /api/events/run, /api/events
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query

from config import EVENTS_PATH, read_json
from state import proc

router = APIRouter()


def _ts_ms(s: str) -> int:
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return int(dt.timestamp() * 1000)
    except Exception:
        return 0


# ── GET /api/events/run ───────────────────────────────────────────────────────
@router.get("/api/events/run")
async def events_run():
    all_ev       = read_json(EVENTS_PATH, {"events": []}).get("events", [])
    run_start_ms = _ts_ms(proc.started_at) if proc.started_at else 0
    filtered     = [e for e in all_ev if _ts_ms(e.get("timestamp", "")) >= run_start_ms]
    return {"events": list(reversed(filtered))}


# ── GET /api/events ───────────────────────────────────────────────────────────
@router.get("/api/events")
async def events(
    date:  Optional[str] = Query(None),
    limit: int           = Query(200),
):
    all_ev = read_json(EVENTS_PATH, {"events": []}).get("events", [])
    if date:
        all_ev = [e for e in all_ev if e.get("date") == date]
    return {"events": list(reversed(all_ev[-limit:]))}
