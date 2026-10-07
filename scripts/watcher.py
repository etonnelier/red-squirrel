#!/usr/bin/env python3
"""
Red Squirrel file observer.

Watches guidance files (CLAUDE.md, rules/*.md) and
triggers API calls to refresh harness metrics when they change.

Architecture:
- Parent process that owns the Next.js dev server as a subprocess.
- Uses watchdog for cross-platform file system events
  (Linux inotify / macOS FSEvents / Windows ReadDirectoryChangesW).
- Catches SIGINT/SIGTERM and cleanly terminates the Next.js subprocess.
- All subprocess stdout is forwarded to this process's stdout with a [next]
  prefix so the Next.js dev banner and "Ready in" message stay visible.
"""

import argparse
import os
import signal
import subprocess
import sys
import time
from pathlib import Path
from threading import Thread
from typing import Iterable

try:
    from watchdog.events import FileSystemEventHandler
    from watchdog.observers import Observer
except ImportError:
    print(
        "WARNING: 'watchdog' package required.\n"
        "Install with: pip install -r scripts/requirements.txt",
        file=sys.stderr,
    )
    sys.exit(1)

try:
    import requests  # type: ignore
except ImportError:
    requests = None  # type: ignore


# Debounce window for repeated file events (seconds). Prevents API hammering
# when editors write the same file in multiple flushes.
DEBOUNCE_SECONDS = 0.5

# Default Next.js port; matches startup.sh and README.
DEFAULT_API_BASE = "http://localhost:4115"


# Files we care about for harness metric updates.
GUIDANCE_FILE_NAMES = {"CLAUDE.md"}
RULES_DIR_NAMES = {"rules"}
RULES_SUFFIX = ".md"

# Subprocess startup timeout.
SUBPROCESS_STARTUP_GRACE = 30


def _is_guidance_file(path: str) -> bool:
    """True if `path` is a guidance file the harness cares about."""
    p = Path(path)
    if p.name in GUIDANCE_FILE_NAMES:
        return True
    if p.suffix == RULES_SUFFIX and any(part in RULES_DIR_NAMES for part in p.parts):
        return True
    return False


def _harness_for(path: str) -> str:
    """Map a guidance file path to the harness name that should refresh."""
    p = Path(path)
    if p.name == "CLAUDE.md":
        return "anti-dilution"
    if p.suffix == RULES_SUFFIX and any(part in RULES_DIR_NAMES for part in p.parts):
        return "rule-coverage"
    return "general"


def _expand(path: str) -> Path:
    """Expand ~ and resolve to absolute Path."""
    return Path(os.path.expanduser(path)).resolve()


def _collect_watch_paths(project_root: Path) -> list[str]:
    """Return directories and files to watch for guidance changes."""
    candidates: list[Path] = []

    home = Path.home()
    candidates.append(home / ".claude" / "CLAUDE.md")
    candidates.append(home / ".claude" / "rules")

    candidates.append(project_root / "CLAUDE.md")
    candidates.append(project_root / ".claude" / "rules")

    # Sub-project CLAUDE.md files anywhere in the project tree.
    for sub in project_root.rglob("CLAUDE.md"):
        if sub != project_root / "CLAUDE.md":
            candidates.append(sub.parent)

    seen: set[str] = set()
    out: list[str] = []
    for c in candidates:
        if not c.exists():
            continue
        key = str(c)
        if key in seen:
            continue
        seen.add(key)
        out.append(key)
    return out


class GuidanceEventHandler(FileSystemEventHandler):
    """Emits debounced log lines and API refresh calls for guidance files."""

    def __init__(self, api_base: str) -> None:
        super().__init__()
        self._api_base = api_base
        self._last_seen: dict[str, float] = {}

    def _should_emit(self, path: str) -> bool:
        now = time.monotonic()
        last = self._last_seen.get(path, 0.0)
        if now - last < DEBOUNCE_SECONDS:
            return False
        self._last_seen[path] = now
        return True

    def _notify(self, event: str, path: str) -> None:
        if not _is_guidance_file(path):
            return
        if not self._should_emit(path):
            return
        harness = _harness_for(path)
        print(f"[watcher] {event}: {path} (harness: {harness})", flush=True)
        self._post_refresh(harness, path)

    def _post_refresh(self, harness: str, path: str) -> None:
        if requests is None:
            return
        url = f"{self._api_base}/api/harnesses/{harness}/refresh"
        try:
            requests.post(url, json={"source": path}, timeout=2)
        except Exception as e:
            print(f"[watcher] API refresh failed: {e}", file=sys.stderr)

    def on_modified(self, event) -> None:  # type: ignore[override]
        if event.is_directory:
            return
        self._notify("modified", event.src_path)

    def on_created(self, event) -> None:  # type: ignore[override]
        if event.is_directory:
            return
        self._notify("created", event.src_path)

    def on_deleted(self, event) -> None:  # type: ignore[override]
        if event.is_directory:
            return
        self._notify("deleted", event.src_path)

    def on_moved(self, event) -> None:  # type: ignore[override]
        if event.is_directory:
            return
        self._notify("moved", event.dest_path)


def _stream_output(process: subprocess.Popen) -> None:
    """Forward subprocess stdout line-by-line with a [next] prefix."""
    assert process.stdout is not None
    for raw in iter(process.stdout.readline, b""):
        try:
            line = raw.decode("utf-8", errors="replace").rstrip()
        except Exception:
            line = repr(raw)
        print(f"[next] {line}", flush=True)


def _start_nextjs(install_dir: Path) -> subprocess.Popen:
    """Launch Next.js dev server from the red-squirrel install directory.

    `install_dir` is the path passed via --install-dir (the directory that
    contains package.json, startup.sh, and scripts/watcher.py). The Next.js
    subprocess must run from there because that is where its dependencies
    and scripts live — even though watcher.py itself runs from the user's
    CWD so it can watch the user's project.
    """
    # Use `npm run dev` so Node's PATH (including `next` from node_modules/.bin)
    # is set up the way startup.sh expects. Calling startup.sh directly bypasses
    # that PATH setup and `next` resolves as missing.
    package_json = install_dir / "package.json"
    cmd = ["npm", "run", "dev"]
    return subprocess.Popen(
        cmd,
        cwd=str(install_dir),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        bufsize=1,
    )


def _parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        prog="watcher.py",
        description="Red Squirrel file observer for guidance files.",
    )
    p.add_argument(
        "--install-dir",
        type=Path,
        required=True,
        help="Path to the red-squirrel install directory (contains package.json).",
    )
    return p.parse_args(argv)


def main(argv: list[str]) -> int:
    args = _parse_args(argv)
    install_dir: Path = args.install_dir.resolve()
    project_root: Path = Path.cwd()
    api_base = os.environ.get("SQUIRREL_API_BASE", DEFAULT_API_BASE)

    print("=" * 50)
    print("Red Squirrel Watcher")
    print("=" * 50)
    print(f"[watcher] Project root (user CWD): {project_root}")
    print(f"[watcher] Install dir (Next.js):    {install_dir}")

    paths = _collect_watch_paths(project_root)
    print(f"[watcher] Watching {len(paths)} path(s):")
    for p in paths:
        print(f"[watcher]   {p}")
    print(f"[watcher] API base: {api_base}")

    handler = GuidanceEventHandler(api_base=api_base)
    observer = Observer()
    for p in paths:
        # Watch the parent directory so events on files inside are seen.
        target = p if os.path.isdir(p) else str(Path(p).parent)
        observer.schedule(handler, target, recursive=True)
    observer.start()

    print("[watcher] Starting Next.js dev server...")
    next_process = _start_nextjs(install_dir)
    output_thread = Thread(target=_stream_output,
                           args=(next_process,), daemon=True)
    output_thread.start()

    def _shutdown(reason: str) -> None:
        print(f"\n[watcher] {reason}; shutting down...", flush=True)
        observer.stop()
        if next_process.poll() is None:
            next_process.terminate()
            try:
                next_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                next_process.kill()
                next_process.wait()

    def _handle_signal(signum: int, _frame) -> None:
        _shutdown(f"Received signal {signum}")
        sys.exit(0)

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    try:
        return next_process.wait()
    except KeyboardInterrupt:
        _shutdown("Interrupted")
        return 0
    finally:
        observer.stop()
        observer.join()


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
