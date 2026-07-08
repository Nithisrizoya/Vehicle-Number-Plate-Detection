"""
Spawn and manage Python sub-processes for video and live detection.
"""
import platform
import signal
import subprocess
import sys
import threading
from pathlib import Path

from config import ENGINE_DIR, PROJECT_ROOT
from state import proc


# ── Python executable ────────────────────────────────────────────────────────
def get_python() -> str:
    # Windows venv
    win = PROJECT_ROOT / "venv" / "Scripts" / "python.exe"
    if win.exists():
        return str(win)
    # Linux/macOS venv
    nix = PROJECT_ROOT / "venv" / "bin" / "python"
    if nix.exists():
        return str(nix)
    # Docker / system install — always the same interpreter that's running now
    return sys.executable


# ── Kill ─────────────────────────────────────────────────────────────────────
def kill_child(child: subprocess.Popen) -> None:
    if child is None:
        return
    if platform.system() == "Windows":
        try:
            subprocess.run(
                f"taskkill /PID {child.pid} /T /F",
                shell=True, check=False,
            )
            return
        except Exception:
            pass
    try:
        child.send_signal(signal.SIGTERM)
    except Exception:
        try:
            child.kill()
        except Exception:
            pass


# ── Pipe stdout/stderr ───────────────────────────────────────────────────────
def _pipe(stream, state):
    for raw in iter(stream.readline, b""):
        line = raw.decode("utf-8", errors="replace").rstrip()
        if line:
            state.add_log(line)
    stream.close()


# ── Finish callbacks ─────────────────────────────────────────────────────────
def _on_video_finish(child: subprocess.Popen):
    child.wait()
    proc.running   = False
    proc.exit_code = child.returncode
    proc._child    = None
    if child.returncode != 0:
        proc.error = f"Exited with code {child.returncode}"
        proc.add_log(f"✘ Failed (exit {child.returncode})")
    else:
        proc.add_log("✔ Done")


def _on_live_finish(child: subprocess.Popen):
    child.wait()
    proc.running   = False
    proc.exit_code = child.returncode if child.returncode is not None else 0
    proc._child    = None
    code = proc.exit_code
    proc.add_log("✔ Stopped" if code == 0 else f"✘ Exited ({code})")


# ── Public spawn helpers ─────────────────────────────────────────────────────
def spawn_video(dest: Path) -> None:
    """Launch main.py for a recorded video file."""
    child = subprocess.Popen(
        [get_python(), str(ENGINE_DIR / "main.py"),
         str(dest), "--no-preview"],
        cwd=str(ENGINE_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    proc._child = child
    for s in (child.stdout, child.stderr):
        threading.Thread(target=_pipe, args=(s, proc), daemon=True).start()
    threading.Thread(target=_on_video_finish, args=(child,), daemon=True).start()


def spawn_live() -> None:
    """Launch main.py for webcam (source = 0)."""
    child = subprocess.Popen(
        [get_python(), str(ENGINE_DIR / "main.py"),
         "0", "--no-preview", "--no-save"],
        cwd=str(ENGINE_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    proc._child = child
    for s in (child.stdout, child.stderr):
        threading.Thread(target=_pipe, args=(s, proc), daemon=True).start()
    threading.Thread(target=_on_live_finish, args=(child,), daemon=True).start()
