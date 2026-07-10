"""
Vehicle/driver master registry — the source of truth an incoming plate and
driver-license OCR read gets checked against for the manufacturing gate
verification flow.
"""
import csv
import difflib
from pathlib import Path
from typing import Optional

PROJECT_ROOT   = Path(__file__).resolve().parent.parent
REGISTRY_PATH  = PROJECT_ROOT / "data" / "vehicle_registry.csv"

# Same tolerance as the gate tracker's plate matching — a registered plate
# should still be found despite the odd OCR-noise character.
PLATE_MATCH_RATIO = 0.75


def load_registry() -> list[dict]:
    if not REGISTRY_PATH.exists():
        return []
    with REGISTRY_PATH.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def _similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, a.strip().upper(), b.strip().upper()).ratio()


def find_by_plate(plate: str) -> Optional[dict]:
    """Fuzzy-matches a detected plate against the registry. Returns the
    registry row (plate, driver_id, driver_name, goods) or None if no row
    is a close enough match — an unregistered vehicle."""
    best, best_score = None, 0.0
    for row in load_registry():
        score = _similarity(row.get("plate", ""), plate)
        if score > best_score:
            best, best_score = row, score
    return best if best_score >= PLATE_MATCH_RATIO else None
