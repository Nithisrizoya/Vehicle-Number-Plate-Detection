"""
Manufacturing gate verification: POST /api/verify-driver

Cross-checks a detected vehicle's plate + an uploaded driver-license photo
against the vehicle registry. EasyOCR reads the license first; an AI model
(via Domo) reads the photo itself and decides whether the driver ID/name
match the registry's expected record. Emails the supervisor with the outcome
either way.
"""
from fastapi import APIRouter, File, Form, UploadFile

import mailer
from driver_ai import verify_license
from license_ocr import read_license_text
from registry import find_by_plate

router = APIRouter()


@router.post("/api/verify-driver")
async def verify_driver(
    plate: str = Form(...),
    in_time: str = Form(""),
    license_photo: UploadFile = File(...),
):
    image_bytes = await license_photo.read()
    ocr_lines = read_license_text(image_bytes)

    record = find_by_plate(plate)
    if record is None:
        email_sent = mailer.send_suspicious_alert(plate, "", "", "Vehicle plate is not registered.", in_time)
        return {
            "match": False, "plateRegistered": False,
            "driverIdMatch": False, "driverNameMatch": False,
            "extractedDriverId": None, "extractedDriverName": None,
            "goods": None, "reason": "Vehicle plate is not registered.",
            "emailSent": email_sent,
        }

    expected_id   = record.get("driver_id", "")
    expected_name = record.get("driver_name", "")
    goods         = record.get("goods", "")

    verdict = verify_license(
        image_bytes, ocr_lines,
        {"driver_id": expected_id, "driver_name": expected_name},
    )

    if not verdict:
        email_sent = mailer.send_suspicious_alert(
            plate, "", "", "Could not verify the license photo (AI check failed).", in_time,
        )
        return {
            "match": False, "plateRegistered": True,
            "driverIdMatch": False, "driverNameMatch": False,
            "extractedDriverId": None, "extractedDriverName": None,
            "goods": goods, "reason": "Could not verify the license photo.",
            "emailSent": email_sent,
        }

    id_match       = bool(verdict.get("driver_id_match"))
    name_match     = bool(verdict.get("driver_name_match"))
    overall        = id_match and name_match
    extracted_id   = verdict.get("extracted_driver_id")
    extracted_name = verdict.get("extracted_driver_name")

    # Every response field below reflects what actually happened, including
    # emailSent — the UI must not claim "supervisor notified" when the SMTP
    # send silently failed (blocked outbound port, bad credentials, etc).
    if overall:
        email_sent = mailer.send_entry_confirmation(plate, expected_name, expected_id, goods, in_time)
        reason = ""
    else:
        reasons = []
        if not id_match:
            reasons.append(f"driver ID on license ({extracted_id or 'unreadable'}) does not match registered ID ({expected_id})")
        if not name_match:
            reasons.append(f"driver name on license ({extracted_name or 'unreadable'}) does not match registered name ({expected_name})")
        reason = "; ".join(reasons)
        email_sent = mailer.send_suspicious_alert(plate, extracted_name or "", extracted_id or "", reason, in_time)

    return {
        "match": overall,
        "plateRegistered": True,
        "driverIdMatch": id_match,
        "driverNameMatch": name_match,
        "extractedDriverId": extracted_id,
        "extractedDriverName": extracted_name,
        "driverName": expected_name,
        "driverId": expected_id,
        "goods": goods,
        "reason": reason,
        "emailSent": email_sent,
    }
