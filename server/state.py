"""
Global processing state — one instance shared across all modules.
"""
import subprocess
import threading
from datetime import datetime, timezone
from typing import Optional

from config import LIVE_PATH, read_json


class ProcState:
    def __init__(self):
        self.running      = False
        self.filename     = None
        self.output_video = None
        self.started_at   = None
        self.exit_code    = None
        self.error        = None
        self.mode         = None   # "video" | "live"
        self._child: Optional[subprocess.Popen] = None
        self._logs: list[str] = []
        self._lock = threading.Lock()

    # ── Mutation ─────────────────────────────────────────────────────────────
    def start(self, *, filename: str, output_video: Optional[str] = None, mode: Optional[str] = None):
        with self._lock:
            self.running      = True
            self.filename     = filename
            self.output_video = output_video
            self.started_at   = datetime.now(timezone.utc).isoformat()
            self.exit_code    = None
            self.error        = None
            self.mode         = mode
            self._logs        = []
            self._child       = None

    def add_log(self, line: str):
        with self._lock:
            self._logs.append(line)
            if len(self._logs) > 300:
                self._logs.pop(0)

    # ── Serialisation ────────────────────────────────────────────────────────
    def to_dict(self) -> dict:
        live = read_json(LIVE_PATH, {})
        return {
            "running":            self.running,
            "filename":           self.filename,
            "outputVideo":        self.output_video,
            "startedAt":          self.started_at,
            "exitCode":           self.exit_code,
            "error":              self.error,
            "mode":               self.mode,
            "plates_seen":        live.get("plates_seen", 0),
        }


# Single instance imported everywhere
proc = ProcState()
