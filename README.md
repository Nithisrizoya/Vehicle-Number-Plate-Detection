# Plate Gate Monitor

AI-powered vehicle number plate detection and gate entry/exit tracking. Detects license plates from a webcam feed or uploaded video (YOLOv8 + EasyOCR), logs each car's entry/exit with a timestamped snapshot, and flags returning vehicles automatically.

## Features

- **Plate detection & OCR** — a fine-tuned YOLOv8 model locates the plate, then a 4-variant OCR pipeline (EasyOCR) reads it, picking whichever preprocessing gives the highest-confidence result.
- **Gate IN/OUT tracking** — the first time a plate is seen it's logged as an entry; the next time that same plate is seen, it's logged as an exit. Fuzzy text matching absorbs small OCR misreads across sightings.
- **Returning-vehicle detection** — every event is tagged with a visit number, so repeat visitors are flagged in the UI instead of looking like a fresh car each time.
- **Live webcam detection** — real-time detection against a live camera feed, with a live annotated preview and event log.
- **Video upload & analysis** — upload a recorded clip and get back an annotated video (H.264, plays directly in the browser) plus a table of every detected plate event.
- **Dashboard** — at-a-glance traffic stats (currently a static demo view, easy to re-wire to the real `/api/stats/dashboard` endpoint).

## Architecture

```
Vehicle-Plate-Detection/
├── requirements.txt        # Python deps for both the detection engine and the API server
├── models/best.pt          # fine-tuned YOLOv8 plate-detection weights
├── images/                 # sample plate photos used by scripts/test_on_images.py
├── plate_detector/         # shared detection + OCR library
│   ├── detector.py           - YOLO model load/inference wrapper
│   ├── ocr.py                 - 4-variant preprocessing + EasyOCR extraction
│   └── annotate.py            - draws bounding box + label on a frame
├── engine/                 # the process that actually watches a video/webcam
│   ├── main.py                - CLI entrypoint + capture loop (spawned by the server)
│   ├── gate.py                 - persistent IN/OUT visit tracking, fuzzy plate matching
│   ├── tracker.py              - frame-to-frame box tracking (throttles OCR calls)
│   └── storage.py              - events/live/progress/snapshot file I/O
├── server/                 # FastAPI backend
│   ├── app.py, config.py, state.py, process_manager.py
│   └── routes/                 - detection.py, events.py, media.py, stats.py
├── client/                 # React + TypeScript + Tailwind dashboard UI
│   └── src/
│       ├── features/           - dashboard/, live-detection/, video-detection/ (one folder per tab)
│       └── shared/             - types, UI primitives, layout, hooks
├── scripts/
│   ├── test_on_images.py      # quick sanity check: run detection over images/
│   └── seed_demo_data.py      # populate output/events.json with sample gate activity
└── output/                 # generated at runtime — events.json, snapshots, annotated videos (gitignored)
```

## How it works

1. A frame comes in (from a video file or webcam).
2. YOLOv8 (`models/best.pt`) detects the plate's bounding box.
3. The cropped plate region is OCR'd via `plate_detector/ocr.py` — up to 4 preprocessing variants (plain upscale, Otsu threshold, CLAHE contrast, sharpen+Otsu) are tried, with an early exit once a read is confident enough.
4. `engine/gate.py` matches the read text against currently "active" plates and plate history (fuzzy match tolerates minor OCR drift) to decide: first sighting → **IN**, matching an open visit → **OUT**.
5. A snapshot of the annotated frame is saved and the event is appended to `output/events.json`.
6. The React client polls the FastAPI server and renders live results.

## Prerequisites

- Python 3.10+ (tested on 3.14)
- Node.js 18+
- A webcam (only needed for the Live Detection tab)

## Setup

```bash
# 1. Create and activate a virtual environment (from the project root)
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# 2. Install Python dependencies (covers both the engine and the API server)
pip install -r requirements.txt

# 3. Install client dependencies
cd client
npm install
cd ..
```

## Running

Start the API server and the client in two separate terminals:

```bash
# Terminal 1 — backend (http://localhost:3001)
cd server
python app.py

# Terminal 2 — frontend (http://localhost:5173)
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

## Quick sanity check (no server needed)

To verify the model + OCR pipeline works against the sample images:

```bash
python scripts/test_on_images.py
```

Annotated output images are written to `output/`.

## Notes

- `output/` is regenerated at runtime and is gitignored — nothing there needs to be committed.
- The detection engine (`engine/main.py`) is spawned as a subprocess by the server whenever you start a live session or upload a video; you don't need to run it manually.
- Uploaded videos are re-encoded to H.264 on output (via `imageio`/`imageio-ffmpeg`) so the annotated result plays directly in the browser.
