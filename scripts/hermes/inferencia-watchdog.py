#!/usr/bin/env python3
"""Hermes inferencia watchdog — read-only. Does not break Inferencia.

SAFE (this script):
  - GET Inferencia /health only (never /v1/chat/completions)
  - GET portfolio /api/health?shallow=1 (no cascade probe to Inferencia)
  - Report-only: exit 0, print one line on failure

UNSAFE (old watchdog — remove from Hermes crons):
  - POST /api/chat (loads models, burns rate limits)
  - docker restart / Coolify recovery loops (causes 502 storms)
  - SSH + container churn every 5 minutes

Env:
  INFERENCIA_HEALTH_URL  default https://llm.menezmethod.com/health
  SITE_URL               default https://gimenez.dev
  WATCHDOG_TIMEOUT       default 8 (seconds)
  WATCHDOG_ENABLE_RECOVERY  must stay unset/false in production
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

INFERENCIA_HEALTH = os.getenv("INFERENCIA_HEALTH_URL", "https://llm.menezmethod.com/health")
SITE_URL = os.getenv("SITE_URL", "https://gimenez.dev").rstrip("/")
TIMEOUT = float(os.getenv("WATCHDOG_TIMEOUT", "8"))
RECOVERY_ENABLED = os.getenv("WATCHDOG_ENABLE_RECOVERY", "").lower() in ("1", "true", "yes")
USER_AGENT = "hermes-inferencia-watchdog/2"


def fetch_json(url: str, headers: dict[str, str] | None = None) -> tuple[int, dict | None]:
    merged = {"User-Agent": USER_AGENT, **(headers or {})}
    req = urllib.request.Request(url, headers=merged, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        try:
            raw = exc.read().decode("utf-8", errors="replace")
            data = json.loads(raw) if raw else None
        except Exception:
            data = None
        return exc.code, data
    except Exception:
        return 0, None


def main() -> int:
    errors: list[str] = []

    code, data = fetch_json(INFERENCIA_HEALTH)
    if code != 200 or (data or {}).get("status") != "healthy":
        errors.append(f"Inferencia /health failed (HTTP {code or 'error'})")

    code, data = fetch_json(
        f"{SITE_URL}/api/health?shallow=1",
        headers={"X-Hermes-Watchdog": "1"},
    )
    if code != 200 or (data or {}).get("status") not in ("healthy", "degraded"):
        errors.append(f"portfolio /api/health shallow failed (HTTP {code or 'error'})")

    if errors:
        print("inferencia-watchdog: " + "; ".join(errors))
        if RECOVERY_ENABLED:
            print(
                "inferencia-watchdog: auto-recovery is disabled — "
                "unset WATCHDOG_ENABLE_RECOVERY and fix manually"
            )

    return 0


if __name__ == "__main__":
    sys.exit(main())
