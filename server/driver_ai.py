"""
Driver-license verification via Domo's hosted AI vision endpoint
(/ai/v1/image/text).

EasyOCR reads the license photo first (license_ocr.py) and its raw text is
passed to the AI model as a hint alongside the photo itself — the model reads
the photo directly rather than trusting the OCR text blindly, then compares
what it reads to the vehicle registry's expected driver_id/driver_name.

Best-effort only — every failure path returns {} rather than raising, so a
slow/broken AI call never breaks the verification response the UI is
waiting on.
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
    "You are a document verification assistant checking a driver's license "
    "photo against an expected record for a factory gate entry system.\n\n"
    "You are given: (1) the license photo, (2) text an OCR pass already read "
    "off it as a hint — it may contain errors/noise, so verify against the "
    "actual photo rather than trusting it blindly, and (3) the expected "
    "driver_id and driver_name from our registry for this vehicle.\n\n"
    "Read the driver ID and driver name directly off the license photo, then "
    "compare them to the expected values. Minor formatting differences "
    "(dashes, spacing, letter case) still count as a match; a genuinely "
    "different ID or name does not.\n\n"
    "Respond with ONLY strict JSON, no markdown, no extra commentary, "
    'matching exactly this schema: {"extracted_driver_id": string|null, '
    '"extracted_driver_name": string|null, "driver_id_match": boolean, '
    '"driver_name_match": boolean}'
)


def _extract_text(payload: dict) -> str:
    """Domo's /ai/v1/image/text response wraps the model's text reply — check
    common envelope shapes defensively."""
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


def verify_license(image_bytes: bytes, ocr_lines: list, expected: dict) -> dict:
    """Asks the AI model to read the license photo and decide whether its
    driver ID and name match `expected` ({"driver_id", "driver_name"} from
    the registry). Returns {} if the key/endpoint isn't configured, the
    request fails, or the reply can't be parsed — caller should treat that
    as "could not verify"."""
    if not DOMO_API_KEY or not DOMO_BASE_URL or not image_bytes:
        return {}

    prompt = (
        f"An OCR pass read these text lines off the license: {json.dumps(ocr_lines)}\n"
        f"Expected record from our registry: {json.dumps(expected)}\n\n"
        "Read the license photo yourself, compare it to the expected record, "
        "and respond with only the JSON object."
    )
    payload = {
        "input": prompt,
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
        print(f"[DRIVER_AI] request failed: {exc}")
        return {}

    if not text:
        print("[DRIVER_AI] no recognizable text in response")
        return {}

    parsed = _parse_json_object(text)
    if not parsed:
        print(f"[DRIVER_AI] could not parse verdict from: {text[:200]!r}")
        return {}
    return parsed
