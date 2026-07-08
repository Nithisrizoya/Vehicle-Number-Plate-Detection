"""
Lightweight per-frame box tracker that throttles expensive OCR calls.

Re-running the full 4-variant OCR pipeline on every frame a plate is visible
is the single biggest cost in the detection loop — a plate visible for a few
seconds at 25-30fps means dozens of redundant OCR calls for what is really one
continuous sighting. This tracks detected boxes across frames by proximity
(box-center distance, tolerant of motion — a car crossing the frame moves its
box every frame, so a strict area-overlap/IoU match would miss it and defeat
the whole point) and only re-runs OCR periodically per tracked box, reusing
the cached reading on frames in between.
"""

import uuid

MAX_MOVE_RATIO = 1.2   # a box may move up to ~1.2x its own diagonal between frames and still match
OCR_REFRESH_SEC = 1.5
STALE_SEC = 3.0        # tolerate a few consecutive missed/low-confidence detections without losing the track


def _center(box):
    x1, y1, x2, y2 = box
    return (x1 + x2) / 2, (y1 + y2) / 2


def _diagonal(box):
    x1, y1, x2, y2 = box
    return ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5


def _same_object(box_a, box_b) -> bool:
    ax, ay = _center(box_a)
    bx, by = _center(box_b)
    dist = ((ax - bx) ** 2 + (ay - by) ** 2) ** 0.5
    max_dist = MAX_MOVE_RATIO * max(_diagonal(box_a), _diagonal(box_b))
    return dist <= max_dist


class BoxTracker:
    def __init__(self):
        self._tracked: list[dict] = []  # [{bbox, plate_text, ocr_conf, last_ocr, last_seen}]

    def lookup(self, bbox, det_conf: float, now: float):
        """For a newly detected box, find the closest recently-seen box.
        Returns (cached_result_or_None, track_dict)."""
        best, best_dist = None, None
        for t in self._tracked:
            if not _same_object(bbox, t["bbox"]):
                continue
            ax, ay = _center(bbox)
            bx, by = _center(t["bbox"])
            dist = ((ax - bx) ** 2 + (ay - by) ** 2) ** 0.5
            if best_dist is None or dist < best_dist:
                best, best_dist = t, dist

        if best is not None:
            best["bbox"] = bbox
            best["det_conf"] = det_conf
            best["last_seen"] = now
            if best["plate_text"] and now - best["last_ocr"] < OCR_REFRESH_SEC:
                return (best["plate_text"], best["ocr_conf"]), best
            return None, best

        track = {
            "bbox": bbox, "det_conf": det_conf, "plate_text": "", "ocr_conf": 0.0,
            "last_ocr": 0.0, "last_seen": now, "sighting_id": uuid.uuid4().hex,
        }
        self._tracked.append(track)
        return None, track

    def record_ocr(self, track: dict, plate_text: str, ocr_conf: float, now: float) -> None:
        track["plate_text"] = plate_text
        track["ocr_conf"] = ocr_conf
        track["last_ocr"] = now

    def active_tracks(self):
        """Currently-tracked boxes, for redrawing on frames where detection was skipped."""
        return [(t["bbox"], t["det_conf"], t["plate_text"], t["ocr_conf"]) for t in self._tracked]

    def sweep(self, now: float) -> None:
        self._tracked = [t for t in self._tracked if now - t["last_seen"] <= STALE_SEC]
