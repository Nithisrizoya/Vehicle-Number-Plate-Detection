"""
Media routes: /api/preview, /api/progress, /api/video/<filename>
Static mounts (/snapshots, /output) and SPA fallback are registered in app.py.
"""
import re
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, Response, StreamingResponse

from config import OUTPUT_DIR, PREVIEW_PATH, PROGRESS_PATH, read_json

router = APIRouter()


# ── GET /api/preview — no-cache JPEG ────────────────────────────────────────
@router.get("/api/preview")
async def preview():
    if not PREVIEW_PATH.exists():
        raise HTTPException(status_code=404, detail="No preview yet")
    data = PREVIEW_PATH.read_bytes()
    return Response(
        content=data,
        media_type="image/jpeg",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma":        "no-cache",
            "Expires":       "0",
        },
    )


# ── GET /api/progress ────────────────────────────────────────────────────────
@router.get("/api/progress")
async def progress():
    return read_json(PROGRESS_PATH, {"pct": 0, "frame": 0, "violations": 0})


# ── GET /api/video/<filename> — Range-request video streaming ────────────────
@router.get("/api/video/{filename:path}")
async def video(filename: str, request: Request):
    safe     = Path(filename).name          # prevent path traversal
    filepath = OUTPUT_DIR / safe
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Video not found")

    file_size  = filepath.stat().st_size
    range_hdr  = request.headers.get("range")

    if range_hdr:
        m = re.match(r"bytes=(\d+)-(\d*)", range_hdr)
        if not m:
            raise HTTPException(status_code=416, detail="Invalid Range header")

        start  = int(m.group(1))
        end    = int(m.group(2)) if m.group(2) else file_size - 1
        end    = min(end, file_size - 1)
        length = end - start + 1

        def _stream_partial():
            with open(filepath, "rb") as fh:
                fh.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = fh.read(min(65536, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        return StreamingResponse(
            _stream_partial(),
            status_code=206,
            media_type="video/mp4",
            headers={
                "Content-Range":  f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges":  "bytes",
                "Content-Length": str(length),
            },
        )

    def _stream_full():
        with open(filepath, "rb") as fh:
            while chunk := fh.read(65536):
                yield chunk

    return StreamingResponse(
        _stream_full(),
        media_type="video/mp4",
        headers={
            "Content-Length": str(file_size),
            "Accept-Ranges":  "bytes",
        },
    )
