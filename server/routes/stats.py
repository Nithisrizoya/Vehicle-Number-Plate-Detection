"""
Dashboard aggregation: GET /api/stats/dashboard
"""
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter

from config import EVENTS_PATH, read_json

router = APIRouter()


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _hour_label(time_str: str) -> str:
    # time_str is formatted like "07:32:14 PM"
    try:
        return datetime.strptime(time_str, "%I:%M:%S %p").strftime("%H:00")
    except Exception:
        return "00:00"


def _best_per_sighting(events: list) -> list:
    """The engine can log more than one OCR read for the same physical car
    (tagged with a shared sighting_id) as its confidence refines. Keep only
    the highest-confidence read per sighting so aggregates aren't inflated by
    re-reads of the same vehicle."""
    best_by_sighting: dict[str, dict] = {}
    ungrouped = []
    for e in events:
        sighting_id = e.get("sighting_id")
        if not sighting_id:
            ungrouped.append(e)
            continue
        existing = best_by_sighting.get(sighting_id)
        if not existing or (e.get("confidence") or 0) > (existing.get("confidence") or 0):
            best_by_sighting[sighting_id] = e
    return list(best_by_sighting.values()) + ungrouped


@router.get("/api/stats/dashboard")
async def dashboard_stats():
    events = _best_per_sighting(read_json(EVENTS_PATH, {"events": []}).get("events", []))
    today = _today()

    cars_today = sum(1 for e in events if e.get("event") == "IN" and e.get("date") == today)

    latest_status: dict[str, str] = {}
    visit_counts: dict[str, int] = defaultdict(int)
    last_seen: dict[str, str] = {}
    for e in events:
        plate = e.get("plate")
        if not plate:
            continue
        latest_status[plate] = e.get("event", "OUT")
        if e.get("event") == "IN":
            visit_counts[plate] += 1
        last_seen[plate] = e.get("time", "")
    currently_inside = sum(1 for status in latest_status.values() if status == "IN")

    today_out = [e for e in events if e.get("event") == "OUT" and e.get("date") == today and e.get("duration_seconds")]
    avg_dwell_time_minutes = (
        round(sum(e["duration_seconds"] for e in today_out) / len(today_out) / 60, 1)
        if today_out else 0.0
    )

    hourly = defaultdict(lambda: {"in": 0, "out": 0})
    for e in events:
        if e.get("date") != today:
            continue
        hour = _hour_label(e.get("time", ""))
        if e.get("event") == "IN":
            hourly[hour]["in"] += 1
        elif e.get("event") == "OUT":
            hourly[hour]["out"] += 1

    hourly_trend = [
        {"hour": hour, "in": v["in"], "out": v["out"]}
        for hour, v in sorted(hourly.items())
    ]

    # Repeat vehicles: plates that have visited more than once, ranked by visit count.
    repeat_vehicles = [
        {"plate": plate, "visits": count, "lastSeen": last_seen.get(plate, "")}
        for plate, count in visit_counts.items()
        if count > 1
    ]
    repeat_vehicles.sort(key=lambda r: -r["visits"])
    repeat_vehicles = repeat_vehicles[:6]

    recent_activity = [
        {
            "id": e.get("id"), "time": e.get("time"), "plate": e.get("plate"),
            "event": e.get("event"), "visitNumber": e.get("visit_number"),
            "snapshot": e.get("snapshot"), "sightingId": e.get("sighting_id"),
            "confidence": e.get("confidence"),
        }
        for e in list(reversed(events))[:8]
    ]

    return {
        "cars_today": cars_today,
        "currently_inside": currently_inside,
        "avg_dwell_time_minutes": avg_dwell_time_minutes,
        "total_unique_vehicles": len(visit_counts),
        "hourly_trend": hourly_trend,
        "repeat_vehicles": repeat_vehicles,
        "recent_activity": recent_activity,
    }
