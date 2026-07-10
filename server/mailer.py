"""
Supervisor email notifications for the manufacturing gate verification flow.
Best-effort only — a failed send is logged, never raised, so a broken mail
server never blocks the verification response the UI is waiting on.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / "server" / ".env")

SMTP_HOST       = "smtp.gmail.com"
SMTP_PORT       = 587
SMTP_USER       = os.environ.get("SMTP_USER", "")
SMTP_PASS       = os.environ.get("SMTP_PASS", "")
RECIPIENT_EMAIL = os.environ.get("RECIPIENT_EMAIL", "")


def _send(subject: str, body: str) -> bool:
    if not (SMTP_USER and SMTP_PASS and RECIPIENT_EMAIL):
        print("[MAILER] SMTP not configured — skipping email")
        return False
    msg = MIMEText(body)
    msg["Subject"]    = subject
    msg["From"]       = f"Gate Verification System <{SMTP_USER}>"
    msg["To"]         = RECIPIENT_EMAIL
    # Gmail (and most spam filters) treat a message missing Date/Message-ID as
    # a strong spam signal — smtplib doesn't set these on its own, so a plain
    # MIMEText sent this way can silently land in Spam instead of the inbox.
    msg["Date"]       = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain=SMTP_USER.split("@")[-1])
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, [RECIPIENT_EMAIL], msg.as_string())
        print(f"[MAILER] sent: {subject}")
        return True
    except Exception as exc:
        print(f"[MAILER] send failed: {exc}")
        return False


def send_entry_confirmation(plate: str, driver_name: str, driver_id: str, goods: str, in_time: str) -> bool:
    subject = f"Vehicle Entry Confirmed - {plate}"
    body = (
        "Dear Supervisor,\n\n"
        "A vehicle has been verified at the gate and has entered the facility.\n\n"
        f"Vehicle Number Plate : {plate}\n"
        f"Driver Name          : {driver_name}\n"
        f"Driver ID            : {driver_id}\n"
        f"Goods                : {goods}\n"
        f"Entry Time           : {in_time or 'N/A'}\n\n"
        "The vehicle number plate, driver ID, and driver name all matched our "
        "records. Please proceed with the standard receiving process for the "
        "above goods.\n\n"
        "Regards,\n"
        "Automated Gate Verification System"
    )
    return _send(subject, body)


def send_suspicious_alert(plate: str, driver_name: str, driver_id: str, reason: str, in_time: str) -> bool:
    subject = f"Vehicle Entry Alert - {plate} - Please Verify"
    body = (
        "Dear Supervisor,\n\n"
        "A vehicle attempting entry could not be fully verified against our "
        "records and requires manual review.\n\n"
        f"Vehicle Number Plate : {plate}\n"
        f"Driver Name (from license) : {driver_name or 'Not readable'}\n"
        f"Driver ID (from license)   : {driver_id or 'Not readable'}\n"
        f"Time                 : {in_time or 'N/A'}\n"
        f"Reason               : {reason}\n\n"
        "This entry looks suspicious - please check it in person before "
        "allowing the vehicle to proceed.\n\n"
        "Regards,\n"
        "Automated Gate Verification System"
    )
    return _send(subject, body)
