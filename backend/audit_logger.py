"""Audit logger — writes structured entries to logs/audit_log.json."""

import json
import os
import asyncio
from datetime import datetime
from pathlib import Path

LOG_DIR = Path("logs")
LOG_FILE = LOG_DIR / "audit_log.json"

_lock = asyncio.Lock()


def _ensure_log_file():
    LOG_DIR.mkdir(exist_ok=True)
    if not LOG_FILE.exists():
        LOG_FILE.write_text("[]")


async def append_audit_entry(entry: dict):
    """Append a single audit entry to the JSON log file (async-safe)."""
    _ensure_log_file()
    entry["logged_at"] = datetime.now().isoformat()

    async with _lock:
        try:
            existing = json.loads(LOG_FILE.read_text())
        except (json.JSONDecodeError, FileNotFoundError):
            existing = []
        existing.append(entry)
        LOG_FILE.write_text(json.dumps(existing, indent=2))


async def log_ticket_run(
    ticket_id: str,
    subject: str,
    user_email: str,
    reasoning_steps: list,
    tool_calls: list,
    final_action: str,
    confidence_score: float,
    errors: list,
    status: str,
):
    entry = {
        "ticket_id": ticket_id,
        "subject": subject,
        "user_email": user_email,
        "status": status,
        "final_decision": final_action,
        "confidence_score": confidence_score,
        "reasoning": [s["thought"] for s in reasoning_steps],
        "tool_calls": [
            {
                "tool": tc["tool_name"],
                "args": tc.get("arguments", {}),
                "status": tc.get("status"),
                "attempt": tc.get("attempt", 1),
            }
            for tc in tool_calls
        ],
        "errors": errors,
    }
    await append_audit_entry(entry)


def read_audit_log(limit: int = 200) -> list:
    """Read the audit log synchronously (for API endpoints)."""
    _ensure_log_file()
    try:
        entries = json.loads(LOG_FILE.read_text())
        return entries[-limit:]
    except Exception:
        return []
