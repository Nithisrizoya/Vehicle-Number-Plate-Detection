"""
Vehicle Plate Gate Dashboard — FastAPI server
Run :  python app.py
Port:  3001  (Vite proxy unchanged — no frontend edits needed)
"""
import sys
from pathlib import Path

# Put server/ on sys.path so all local modules resolve
sys.path.insert(0, str(Path(__file__).parent))

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from config import OUTPUT_DIR, SNAPSHOTS_DIR
from routes.detection     import router as detection_router
from routes.events        import router as events_router
from routes.media         import router as media_router
from routes.stats         import router as stats_router
from routes.verification  import router as verification_router

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="Vehicle Plate Gate Dashboard API", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routes ────────────────────────────────────────────────────────────────
app.include_router(detection_router)
app.include_router(events_router)
app.include_router(media_router)
app.include_router(stats_router)
app.include_router(verification_router)

# ── Static directories ────────────────────────────────────────────────────────
app.mount("/snapshots", StaticFiles(directory=str(SNAPSHOTS_DIR)), name="snapshots")
app.mount("/output",    StaticFiles(directory=str(OUTPUT_DIR)),    name="output")

# ── React SPA fallback (production build only) ────────────────────────────────
CLIENT_BUILD = Path(__file__).parent.parent / "client" / "dist"

if CLIENT_BUILD.exists():
    @app.get("/{full_path:path}")
    async def spa(full_path: str):
        target = CLIENT_BUILD / full_path
        if full_path and target.exists() and target.is_file():
            return FileResponse(str(target))
        return FileResponse(str(CLIENT_BUILD / "index.html"))

# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    PORT = int(os.environ.get("PORT", 3001))
    print(f"\n  Vehicle Plate Gate Dashboard API  ->  http://localhost:{PORT}\n")
    uvicorn.run("app:app", host="0.0.0.0", port=PORT, reload=False)
