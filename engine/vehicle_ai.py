"""
Vehicle brand/model/colour classification via Domo's hosted Gemini vision
endpoint (domo.google.gemini-2.5-pro through /ai/v1/image/text).

Best-effort enrichment only — every failure path returns {} rather than
raising, so a slow/broken AI call never breaks plate detection itself.
"""
import base64
import json
import os
import re
from pathlib import Path

import requests
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / "server" / ".env")

DOMO_BASE_URL = os.environ.get("DOMO_BASE_URL", "").rstrip("/")
DOMO_API_KEY  = os.environ.get("DOMO_API_KEY", "")
DOMO_MODEL    = "domo.google.gemini-2.5-pro"
REQUEST_TIMEOUT_SEC = 25

_SYSTEM_PROMPT = (
    "You are a vehicle recognition assistant analyzing a close-up photo of one "
    "vehicle's front end. First look carefully at the front badge/emblem and "
    "describe any letters or the emblem's shape that you actually see. Then, "
    "based on that description, identify the manufacturer/brand that badge "
    "belongs to, and the vehicle's exterior colour.\n\n"
    "Respond with ONLY strict JSON, no markdown, no extra commentary, matching "
    'exactly this schema: {"badge_text": string|null, "brand": string|null, '
    '"colour": string|null}.\n'
    "- badge_text: whatever letters, words, or emblem shape you can actually "
    "see on the badge — describe the real pixels, not what you'd expect a "
    "badge to look like. null if nothing on the front is legible enough to "
    "describe.\n"
    "- brand: the manufacturer that badge_text/shape identifies. null only if "
    "you truly cannot tell — a null is far more useful than a wrong guess.\n"
    "- colour: the visible exterior paint colour in one common word (e.g. "
    "black, white, silver, red, blue)."
)
_PROMPT = "Look at this vehicle's front badge and colour, then respond with only the JSON object."


def _extract_text(payload: dict) -> str:
    """Domo's /ai/v1/image/text response wraps the model's text reply — the
    exact envelope key isn't confirmed yet, so check common shapes defensively."""
    candidates = (
        ("output",), ("text",), ("response",), ("result",), ("message",),
        ("data", "output"), ("data", "text"),
        ("choices", 0, "message", "content"), ("choices", 0, "text"),
    )
    for path in candidates:
        node = payload
        try:
            for key in path:
                node = node[key]
            if isinstance(node, str) and node.strip():
                return node
        except (KeyError, IndexError, TypeError):
            continue
    return ""


def _parse_json_object(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return {}
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return {}


def classify_vehicle(image_bytes: bytes) -> dict:
    """Classify a vehicle crop's brand/colour. `image_bytes` should be a JPEG-
    encoded close-up of just the vehicle (not the full annotated scene) — a
    tighter, badge-legible crop is what keeps brand guesses honest instead of
    hallucinated from a tiny/distant view. Returns {"brand", "colour"} (values
    may be None) on success, or {} if the key/endpoint isn't configured, the
    request fails, or the reply can't be parsed."""
    if not DOMO_API_KEY or not DOMO_BASE_URL:
        return {}
    if not image_bytes:
        return {}

    payload = {
        "input": _PROMPT,
        "image": {
            "data": base64.b64encode(image_bytes).decode("utf-8"),
            "type": "base64",
            "mediaType": "image/jpeg",
        },
        "model": DOMO_MODEL,
        "system": _SYSTEM_PROMPT,
    }
    headers = {
        "X-DOMO-Developer-Token": DOMO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        resp = requests.post(
            f"{DOMO_BASE_URL}/ai/v1/image/text",
            json=payload, headers=headers, timeout=REQUEST_TIMEOUT_SEC,
        )
        resp.raise_for_status()
        text = _extract_text(resp.json())
    except (requests.RequestException, ValueError) as exc:
        print(f"[VEHICLE_AI] request failed: {exc}")
        return {}

    if not text:
        print("[VEHICLE_AI] no recognizable text in response")
        return {}

    parsed = _parse_json_object(text)
    badge_text = parsed.get("badge_text") or None
    brand      = parsed.get("brand")  or None
    colour     = parsed.get("colour") or None
    if not (brand or colour):
        print(f"[VEHICLE_AI] could not parse brand/colour from: {text[:200]!r}")
        return {}
    print(f"[VEHICLE_AI] badge seen: {badge_text!r} -> brand={brand!r}")
    return {"brand": brand, "colour": colour}
