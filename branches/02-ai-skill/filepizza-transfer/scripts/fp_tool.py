#!/usr/bin/env python3
import argparse
import json
import os
import shutil
import signal
import subprocess
import sys
import time
from collections import deque
from pathlib import Path
from typing import Any, Dict, List, Optional


class ToolError(Exception):
    pass


def emit(payload: Dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload) + "\n")


def fail(message: str, details: Optional[str] = None) -> None:
    payload: Dict[str, Any] = {"ok": False, "error": message}
    if details:
        payload["details"] = details
    emit(payload)
    raise SystemExit(1)


def sessions_dir() -> Path:
    configured = os.environ.get("FILEPIZZA_SESSIONS_DIR")
    if configured:
        return Path(configured).expanduser().resolve()
    return (Path.home() / ".filepizza-cli" / "sessions").resolve()


def resolve_fp_binary() -> str:
    explicit = os.environ.get("FILEPIZZA_FP")
    if explicit:
        candidate = Path(explicit).expanduser().resolve()
        if candidate.exists():
            return str(candidate)
        raise ToolError(f"FILEPIZZA_FP points to missing file: {candidate}")

    discovered = shutil.which("fp")
    if discovered:
        return discovered

    raise ToolError(
        "fp command not found. Install runtime from branches/01-shell-installer first."
    )


def read_json_events_from_file(file_path: Path) -> List[Dict[str, Any]]:
    if not file_path.exists():
        return []
    text = file_path.read_text(encoding="utf-8", errors="replace")
    return parse_json_events(text)


def parse_json_events(text: str) -> List[Dict[str, Any]]:
    events: List[Dict[str, Any]] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line.startswith("{"):
            continue
        try:
            parsed = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            events.append(parsed)
    return events


def find_share_event(events: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    for event in events:
        if "short_url" in event and "long_url" in event:
            return event
    return None


def find_download_event(events: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    for event in reversed(events):
        if "saved_path" in event:
            return event
    return None


def read_tail(file_path: Path, max_lines: int = 40) -> str:
    if not file_path.exists():
        return ""
    lines: deque[str] = deque(maxlen=max_lines)
    with file_path.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            lines.append(line.rstrip("\n"))
    return "\n".join(lines)


def is_process_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    else:
        return True


def terminate_process(pid: int, timeout: float = 5.0) -> bool:
    if not is_process_running(pid):
        return True

    if os.name == "nt":
        command = ["taskkill", "/PID", str(pid), "/T", "/F"]
        completed = subprocess.run(command, capture_output=True, text=True)
        if completed.returncode not in (0, 128):
            raise ToolError(
                f"taskkill failed for pid {pid}: {completed.stderr.strip()}"
            )
        return not is_process_running(pid)

    os.kill(pid, signal.SIGTERM)
    deadline = time.time() + timeout
    while time.time() < deadline:
        if not is_process_running(pid):
            return True
        time.sleep(0.2)

    try:
        os.kill(pid, signal.SIGKILL)
    except ProcessLookupError:
        return True

    return not is_process_running(pid)


def normalize_session_name(value: Optional[str]) -> str:
    if value:
        sanitized = "".join(
            ch if ch.isalnum() or ch in ("-", "_") else "-" for ch in value
        ).strip("-_")
        if not sanitized:
            raise ToolError("session name must contain at least one valid character")
        return sanitized
    return f"upload-{int(time.time())}"


def load_session_state(session_name: str) -> Dict[str, Any]:
    state_path = sessions_dir() / f"{session_name}.json"
    if not state_path.exists():
        raise ToolError(f"session not found: {session_name}")
    try:
        return json.loads(state_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ToolError(f"invalid session state file: {error}") from error


def wait_for_share_url(
    stdout_log: Path, process: subprocess.Popen[str], timeout: int
) -> Dict[str, Any]:
    deadline = time.time() + timeout
    while time.time() < deadline:
        events = read_json_events_from_file(stdout_log)
        share_event = find_share_event(events)
        if share_event:
            return share_event

        if process.poll() is not None:
            raise ToolError(
                "upload process exited before share URL was emitted",
            )
        time.sleep(0.25)

    raise ToolError(
        "timed out waiting for share URL",
    )


def command_check(_: argparse.Namespace) -> None:
    fp_binary = resolve_fp_binary()
    completed = subprocess.run(
        [fp_binary, "--help"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    if completed.returncode != 0:
        raise ToolError(
            f"fp health check failed with exit code {completed.returncode}: {completed.stderr.strip()}"
        )
    emit({"ok": True, "fp": fp_binary})


def command_upload_start(args: argparse.Namespace) -> None:
    fp_binary = resolve_fp_binary()
    source_file = Path(args.file).expanduser().resolve()
    if not source_file.is_file():
        raise ToolError(f"file not found: {source_file}")

    session_name = normalize_session_name(args.session)
    root = sessions_dir()
    root.mkdir(parents=True, exist_ok=True)

    state_path = root / f"{session_name}.json"
    if state_path.exists() and not args.overwrite:
        raise ToolError(
            f"session already exists: {session_name}. Use --overwrite to replace."
        )

    stdout_log = root / f"{session_name}.stdout.log"
    stderr_log = root / f"{session_name}.stderr.log"

    command: List[str] = [fp_binary, "upload", str(source_file), "--json"]
    if args.password:
        command.extend(["--password", args.password])
    if args.keep_alive:
        command.append("--keep-alive")

    stdout_handle = stdout_log.open("w", encoding="utf-8")
    stderr_handle = stderr_log.open("w", encoding="utf-8")
    try:
        process = subprocess.Popen(
            command,
            stdout=stdout_handle,
            stderr=stderr_handle,
            text=True,
        )
    finally:
        stdout_handle.close()
        stderr_handle.close()

    share_event = wait_for_share_url(
        stdout_log=stdout_log,
        process=process,
        timeout=args.timeout,
    )

    state = {
        "session": session_name,
        "pid": process.pid,
        "started_at": int(time.time()),
        "command": command,
        "source_file": str(source_file),
        "stdout_log": str(stdout_log),
        "stderr_log": str(stderr_log),
        "keep_alive": bool(args.keep_alive),
    }
    state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

    emit(
        {
            "ok": True,
            "session": session_name,
            "pid": process.pid,
            "short_url": share_event.get("short_url"),
            "long_url": share_event.get("long_url"),
            "stdout_log": str(stdout_log),
            "stderr_log": str(stderr_log),
        }
    )


def command_upload_status(args: argparse.Namespace) -> None:
    state = load_session_state(args.session)
    stdout_log = Path(state["stdout_log"])
    stderr_log = Path(state["stderr_log"])
    events = read_json_events_from_file(stdout_log)
    share_event = find_share_event(events)
    completed = any(event.get("status") == "completed" for event in events)
    running = is_process_running(int(state["pid"]))

    emit(
        {
            "ok": True,
            "session": state["session"],
            "pid": state["pid"],
            "running": running,
            "completed": completed,
            "short_url": share_event.get("short_url") if share_event else None,
            "long_url": share_event.get("long_url") if share_event else None,
            "stderr_tail": read_tail(stderr_log, max_lines=20),
        }
    )


def command_upload_stop(args: argparse.Namespace) -> None:
    state = load_session_state(args.session)
    pid = int(state["pid"])
    running_before = is_process_running(pid)
    stopped = terminate_process(pid) if running_before else True
    running_after = is_process_running(pid)

    state_path = sessions_dir() / f"{state['session']}.json"
    if state_path.exists() and not args.keep_record:
        state_path.unlink()

    emit(
        {
            "ok": True,
            "session": state["session"],
            "pid": pid,
            "running_before": running_before,
            "stopped": stopped,
            "running_after": running_after,
            "state_removed": not args.keep_record,
        }
    )


def command_download(args: argparse.Namespace) -> None:
    fp_binary = resolve_fp_binary()
    command: List[str] = [fp_binary, "download", args.url, "--json"]
    if args.password:
        command.extend(["--password", args.password])
    if args.output:
        command.extend(["--output", args.output])

    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    events = parse_json_events(completed.stdout)
    result = find_download_event(events)

    if completed.returncode != 0:
        raise ToolError(
            f"download failed with exit code {completed.returncode}: {completed.stderr.strip()}"
        )

    if not result:
        raise ToolError(
            "download succeeded but no saved_path event was found in CLI output"
        )

    emit({"ok": True, **result})


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="AI wrapper around fp CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    check_parser = subparsers.add_parser("check", help="Verify fp runtime")
    check_parser.set_defaults(handler=command_check)

    upload_start_parser = subparsers.add_parser(
        "upload-start", help="Start uploader session and return share URL"
    )
    upload_start_parser.add_argument("--file", required=True, help="Source file path")
    upload_start_parser.add_argument("--password", default="", help="Upload password")
    upload_start_parser.add_argument(
        "--keep-alive",
        action="store_true",
        help="Keep uploader alive until manually stopped",
    )
    upload_start_parser.add_argument("--session", default="", help="Session name")
    upload_start_parser.add_argument(
        "--timeout",
        type=int,
        default=90,
        help="Seconds to wait for share URL",
    )
    upload_start_parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing session state",
    )
    upload_start_parser.set_defaults(handler=command_upload_start)

    upload_status_parser = subparsers.add_parser(
        "upload-status", help="Read uploader session status"
    )
    upload_status_parser.add_argument("--session", required=True, help="Session name")
    upload_status_parser.set_defaults(handler=command_upload_status)

    upload_stop_parser = subparsers.add_parser(
        "upload-stop", help="Stop uploader session"
    )
    upload_stop_parser.add_argument("--session", required=True, help="Session name")
    upload_stop_parser.add_argument(
        "--keep-record",
        action="store_true",
        help="Keep session state json after stopping",
    )
    upload_stop_parser.set_defaults(handler=command_upload_stop)

    download_parser = subparsers.add_parser("download", help="Download from file.pizza URL")
    download_parser.add_argument("--url", required=True, help="file.pizza share URL")
    download_parser.add_argument("--password", default="", help="Download password")
    download_parser.add_argument("--output", default="", help="Output path or directory")
    download_parser.set_defaults(handler=command_download)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    try:
        args.handler(args)
    except ToolError as error:
        fail(str(error))


if __name__ == "__main__":
    main()
