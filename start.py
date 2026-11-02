#!/usr/bin/env python3
"""One command to run the whole KOEL Marine portal (Django backend + Vite frontend).

    python start.py              # set up (first run only) and start both servers
    python start.py --skip-setup # just start both servers, no dependency / DB checks

First run, automatically:
  1. creates backend/.env from backend/.env.example (with a fresh SECRET_KEY)
  2. creates a Python virtualenv in backend/.venv and installs backend/requirements.txt
  3. runs `npm install` for the frontend
  4. creates the PostgreSQL database named in backend/.env, applies migrations and
     loads the sample data into the empty database
Then it starts Django and Vite together; press Ctrl+C to stop both.
"""
import argparse
import hashlib
import os
import re
import secrets
import shutil
import socket
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
ENV_FILE = BACKEND / ".env"
ENV_EXAMPLE = BACKEND / ".env.example"
VENV = BACKEND / ".venv"
IS_WINDOWS = os.name == "nt"
VENV_PY = VENV / ("Scripts/python.exe" if IS_WINDOWS else "bin/python")

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(errors="replace")


def say(msg):
    print(f"\n==> {msg}", flush=True)


def die(msg):
    print(f"\nERROR: {msg}", file=sys.stderr, flush=True)
    sys.exit(1)


def read_env():
    values = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                values[key.strip()] = val.strip().strip('"').strip("'")
    return values


def port_in_use(port):
    # Windows lets a second process bind a port that is already listening, so
    # probe with a connect() instead of trying to bind.
    for host in ("127.0.0.1", "::1"):
        try:
            with socket.create_connection((host, int(port)), timeout=0.5):
                return True
        except OSError:
            continue
    return False


def run(cmd, cwd=ROOT, env=None, check=True):
    result = subprocess.run([str(c) for c in cmd], cwd=cwd, env=env)
    if check and result.returncode != 0:
        die(f"Command failed ({result.returncode}): {' '.join(str(c) for c in cmd)}")
    return result.returncode


def ensure_env_file():
    if ENV_FILE.exists():
        return
    if not ENV_EXAMPLE.exists():
        die("backend/.env.example is missing.")
    text = ENV_EXAMPLE.read_text(encoding="utf-8")
    text = text.replace("change-me-to-a-long-random-string", secrets.token_urlsafe(50))
    ENV_FILE.write_text(text, encoding="utf-8")
    say("Created backend/.env from backend/.env.example")
    print("    Open backend/.env and set DB_USER / DB_PASSWORD for your PostgreSQL server,")
    print("    then run `python start.py` again.")
    sys.exit(0)


def file_digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ensure_backend_deps():
    if not VENV_PY.exists():
        say("Creating Python virtual environment (backend/.venv)")
        run([sys.executable, "-m", "venv", VENV])
    stamp = VENV / ".requirements.sha256"
    digest = file_digest(BACKEND / "requirements.txt")
    if stamp.exists() and stamp.read_text().strip() == digest:
        return
    say("Installing backend dependencies")
    run([VENV_PY, "-m", "pip", "install", "--disable-pip-version-check", "-r", BACKEND / "requirements.txt"])
    stamp.write_text(digest)


def ensure_frontend_deps():
    pkg = ROOT / "package.json"
    stamp = ROOT / "node_modules" / ".package.json.sha256"
    digest = file_digest(pkg)
    if stamp.exists() and stamp.read_text().strip() == digest:
        return
    npm = shutil.which("npm")
    if not npm:
        die("npm was not found. Install Node.js (https://nodejs.org) and try again.")
    say("Installing frontend dependencies (npm install)")
    run([npm, "install", "--no-audit", "--no-fund"])
    stamp.parent.mkdir(exist_ok=True)
    stamp.write_text(digest)


def manage(*args):
    return run([VENV_PY, "manage.py", *args], cwd=BACKEND, env=child_env())


def child_env(**extra):
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUNBUFFERED"] = "1"
    env.update(extra)
    return env


def prepare_database(seed):
    say("Preparing PostgreSQL database")
    manage("ensure_database")
    manage("migrate", "--noinput")
    if seed:
        manage("seed_sample_data")


def pump(proc, label):
    for line in iter(proc.stdout.readline, ""):
        print(f"[{label}] {line.rstrip()}", flush=True)


def spawn(cmd, cwd, env, label):
    kwargs = dict(cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                  encoding="utf-8", errors="replace", bufsize=1)
    if IS_WINDOWS:
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs["start_new_session"] = True
    proc = subprocess.Popen([str(c) for c in cmd], **kwargs)
    threading.Thread(target=pump, args=(proc, label), daemon=True).start()
    return proc


def stop(proc):
    if proc.poll() is not None:
        return
    try:
        if IS_WINDOWS:
            # kills the whole tree (Django's autoreloader and Vite spawn children)
            subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
    except Exception:
        proc.terminate()


def main():
    parser = argparse.ArgumentParser(description="Run the KOEL Marine portal (backend + frontend).")
    parser.add_argument("--skip-setup", action="store_true", help="skip dependency install and database setup")
    args = parser.parse_args()

    if sys.version_info < (3, 10):
        die("Python 3.10 or newer is required.")
    node = shutil.which("node")
    if not node:
        die("Node.js was not found. Install it from https://nodejs.org and try again.")

    ensure_env_file()
    if not args.skip_setup:
        ensure_backend_deps()
        ensure_frontend_deps()
    elif not VENV_PY.exists():
        die("backend/.venv does not exist yet - run `python start.py` once without --skip-setup.")

    cfg = read_env()
    backend_port = cfg.get("BACKEND_PORT", "8000")
    frontend_port = cfg.get("FRONTEND_PORT", "3000")
    for name, val in (("BACKEND_PORT", backend_port), ("FRONTEND_PORT", frontend_port)):
        if not re.fullmatch(r"\d{2,5}", val):
            die(f"{name} in backend/.env must be a port number.")

    for name, val in (("BACKEND_PORT", backend_port), ("FRONTEND_PORT", frontend_port)):
        if port_in_use(val):
            die(f"Port {val} is already in use by another program. "
                f"Stop it or change {name} in backend/.env.")

    if not args.skip_setup:
        prepare_database(cfg.get("SEED_SAMPLE_DATA", "True").lower() in ("1", "true", "yes", "on"))

    say(f"Starting backend on http://127.0.0.1:{backend_port} and frontend on http://localhost:{frontend_port}")
    # Vite is launched through node directly: the .bin shims break when the project
    # path contains characters such as '&' (as this one does) on Windows.
    vite_js = ROOT / "node_modules" / "vite" / "bin" / "vite.js"
    if not vite_js.exists():
        die("Frontend dependencies are missing - run `python start.py` without --skip-setup.")

    procs = {
        "backend": spawn([VENV_PY, "manage.py", "runserver", f"127.0.0.1:{backend_port}"], BACKEND,
                         child_env(), "backend"),
        "frontend": spawn([node, vite_js, f"--port={frontend_port}", "--host=0.0.0.0", "--strictPort"], ROOT,
                          child_env(BACKEND_PORT=backend_port), "frontend"),
    }
    print(f"\n   Portal:  http://localhost:{frontend_port}\n   API:     http://127.0.0.1:{backend_port}/api/"
          f"\n   Admin:   http://127.0.0.1:{backend_port}/admin/   (Ctrl+C stops everything)\n", flush=True)

    code = 0
    try:
        while True:
            for name, proc in procs.items():
                rc = proc.poll()
                if rc is not None:
                    print(f"\n[{name}] exited with code {rc}; shutting down.", flush=True)
                    code = rc or 1
                    raise SystemExit
            time.sleep(0.5)
    except (KeyboardInterrupt, SystemExit):
        pass
    finally:
        for proc in procs.values():
            stop(proc)
    sys.exit(code)


if __name__ == "__main__":
    main()
