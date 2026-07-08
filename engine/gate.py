"""
Persistent IN/OUT gate-visit tracking with fuzzy plate matching.

OCR readings of the same physical plate can flicker by a character or two
between frames (compression noise, glare, motion blur). Matching by fuzzy
similarity instead of exact string equality keeps that flicker from spawning
phantom plate identities.
"""
import difflib
import uuid
from datetime import datetime, timezone

FUZZY_MATCH_RATIO = 0.7
GRACE_PERIOD_SEC = 7  # a plate absent this long is eligible to fire a new event on its next sighting


def best_match(candidates, text: str, threshold: float = FUZZY_MATCH_RATIO):
    best, best_score = None, 0.0
    for candidate in candidates:
        score = difflib.SequenceMatcher(None, candidate, text).ratio()
        if score > best_score:
            best, best_score = candidate, score
    return best if best_score >= threshold else None


def build_event(plate: str, event_type: str, confidence: float, snapshot: str, events: list, sighting_id: str = "") -> dict:
    now = datetime.now(timezone.utc)
    duration_seconds = None
    if event_type == "OUT":
        for e in reversed(events):
            if e.get("plate") == plate and e.get("event") == "IN":
                try:
                    in_dt = datetime.fromisoformat(e["timestamp"].replace("Z", "+00:00"))
                    duration_seconds = int((now - in_dt).total_seconds())
                except Exception:
                    duration_seconds = None
                break

    # visit_number: which visit this is for this plate (1st time in, 2nd time in, ...) —
    # this is what lets the UI flag a plate as a "returning vehicle".
    prior_visits = sum(1 for e in events if e.get("plate") == plate and e.get("event") == "IN")
    visit_number = prior_visits + 1 if event_type == "IN" else prior_visits

    return {
        "id": uuid.uuid4().hex,
        "plate": plate,
        "event": event_type,
        "time": now.strftime("%I:%M:%S %p"),
        "timestamp": now.isoformat().replace("+00:00", "Z"),
        "date": now.strftime("%Y-%m-%d"),
        "confidence": round(confidence, 2),
        "snapshot": snapshot,
        "duration_seconds": duration_seconds,
        "visit_number": visit_number,
        "sighting_id": sighting_id,
    }


class GateTracker:
    """Tracks which plates are currently visible (debounce) and their IN/OUT
    status against the persistent event log."""

    def __init__(self, events: list):
        self.plate_status: dict[str, str] = {}
        for e in events:
            if e.get("plate"):
                self.plate_status[e["plate"]] = e.get("event", "OUT")
        self.active_plates: dict[str, dict] = {}  # plate -> {last_seen, best_conf, event_id}
        self.plates_seen: set[str] = set()

    def currently_inside(self) -> int:
        return sum(1 for s in self.plate_status.values() if s == "IN")

    def observe(self, plate_text: str, ocr_conf: float, now: float):
        """Register a sighting. Returns one of:
        - {"action": "new", "plate": canonical, "event_type": "IN"|"OUT"} — open/close a visit;
          caller must create the event and then call finalize() with its id.
        - {"action": "upgrade", "plate": canonical, "event_id": id} — a continuing sighting read
          with higher confidence than what's on file; caller should refresh that event's
          confidence/snapshot in place.
        - None — a continuing sighting that isn't an improvement; nothing to do.
        """
        matched_active = plate_text if plate_text in self.active_plates else best_match(self.active_plates, plate_text)
        if matched_active:
            entry = self.active_plates[matched_active]
            entry["last_seen"] = now
            if ocr_conf > entry["best_conf"]:
                entry["best_conf"] = ocr_conf
                return {"action": "upgrade", "plate": matched_active, "event_id": entry["event_id"]}
            return None

        canonical = plate_text if plate_text in self.plate_status else (best_match(self.plate_status, plate_text) or plate_text)
        self.plates_seen.add(canonical)
        prev_status = self.plate_status.get(canonical, "OUT")
        event_type = "OUT" if prev_status == "IN" else "IN"
        self.plate_status[canonical] = event_type
        self.active_plates[canonical] = {"last_seen": now, "best_conf": ocr_conf, "event_id": None}
        return {"action": "new", "plate": canonical, "event_type": event_type}

    def finalize(self, canonical: str, event_id: str) -> None:
        """Record which event a freshly-opened sighting created, so a later
        higher-confidence re-read of the same plate knows what to upgrade."""
        if canonical in self.active_plates:
            self.active_plates[canonical]["event_id"] = event_id

    def sweep(self, now: float, grace_period: float = GRACE_PERIOD_SEC) -> None:
        """Evict plates absent longer than the grace period so they're
        eligible to fire a fresh event next time they're seen."""
        stale = [p for p, entry in self.active_plates.items() if now - entry["last_seen"] > grace_period]
        for p in stale:
            del self.active_plates[p]
