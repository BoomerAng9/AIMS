#!/usr/bin/env python3
"""
A.I.M.S. Heartbeat — Autonomous Service Health Monitor

Continuously pings all core + Gridiron services. If a service goes down:
  1. Logs the failure
  2. Sends a Telegram alert to Commander
  3. Retries with exponential backoff

Runs as a persistent daemon on Hostinger VPS.

Usage:
  python3 heartbeat.py                       # Run with defaults
  HEARTBEAT_INTERVAL=30 python3 heartbeat.py # Custom interval
  nohup python3 heartbeat.py &               # Daemonize

Required env:
  TELEGRAM_BOT_TOKEN   — Telegram bot token
  TELEGRAM_CHAT_ID     — Commander's chat ID for alerts

Optional env:
  HEARTBEAT_INTERVAL   — Seconds between checks (default: 60)
  FRONTEND_URL         — Frontend base URL
  UEF_URL              — UEF Gateway base URL
  WAR_ROOM_URL         — War Room base URL
  SCOUT_HUB_URL        — Scout Hub base URL
  FILM_ROOM_URL        — Film Room base URL
  ACHEEVY_URL          — ACHEEVY service base URL
  HOA_URL              — House of Ang base URL
  N8N_URL              — n8n base URL
"""

import os
import sys
import time
import json
import signal
import logging
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from urllib.parse import urlencode

# ─── Configuration ────────────────────────────────────────────────────────

INTERVAL = int(os.getenv("HEARTBEAT_INTERVAL", "60"))
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

SERVICES = [
    # Core Stack
    {"name": "Frontend", "url": os.getenv("FRONTEND_URL", "http://localhost:3000"), "critical": True},
    {"name": "UEF Gateway", "url": os.getenv("UEF_URL", "http://localhost:3001") + "/health", "critical": True},
    {"name": "House of Ang", "url": os.getenv("HOA_URL", "http://localhost:3002") + "/health", "critical": False},
    {"name": "ACHEEVY", "url": os.getenv("ACHEEVY_URL", "http://localhost:3003") + "/health", "critical": True},
    # Gridiron Stack
    {"name": "Scout Hub", "url": os.getenv("SCOUT_HUB_URL", "http://localhost:5001") + "/health", "critical": False},
    {"name": "Film Room", "url": os.getenv("FILM_ROOM_URL", "http://localhost:5002") + "/health", "critical": False},
    {"name": "War Room", "url": os.getenv("WAR_ROOM_URL", "http://localhost:5003") + "/health", "critical": False},
    # Infrastructure
    {"name": "n8n", "url": os.getenv("N8N_URL", "http://localhost:5678") + "/healthz", "critical": False},
    {"name": "Redis", "url": os.getenv("REDIS_HEALTH_URL", ""), "critical": False},
]

# Filter out services with empty URLs
SERVICES = [s for s in SERVICES if s["url"]]

# ─── State ────────────────────────────────────────────────────────────────

service_state: dict[str, dict] = {}
startup_time = datetime.now(timezone.utc)
total_checks = 0
total_alerts = 0
running = True

# ─── Logging ──────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [HEARTBEAT] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("heartbeat")

# ─── Telegram Alerting ────────────────────────────────────────────────────

def send_telegram(message: str) -> bool:
    """Send a Telegram message to Commander."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = json.dumps({
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "Markdown",
    }).encode("utf-8")

    req = Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except Exception as e:
        log.warning(f"Telegram alert failed: {e}")
        return False


# ─── Health Check ─────────────────────────────────────────────────────────

def check_service(service: dict) -> dict:
    """Ping a service and return status."""
    name = service["name"]
    url = service["url"]
    start = time.monotonic()

    try:
        req = Request(url, method="GET")
        with urlopen(req, timeout=8) as resp:
            latency_ms = round((time.monotonic() - start) * 1000)
            body = resp.read().decode("utf-8", errors="replace")

            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                data = {}

            return {
                "name": name,
                "status": "UP",
                "code": resp.status,
                "latency_ms": latency_ms,
                "data": data,
                "checked_at": datetime.now(timezone.utc).isoformat(),
            }

    except HTTPError as e:
        latency_ms = round((time.monotonic() - start) * 1000)
        return {
            "name": name,
            "status": "DOWN",
            "code": e.code,
            "latency_ms": latency_ms,
            "error": str(e.reason),
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }

    except (URLError, OSError, TimeoutError) as e:
        latency_ms = round((time.monotonic() - start) * 1000)
        return {
            "name": name,
            "status": "DOWN",
            "code": 0,
            "latency_ms": latency_ms,
            "error": str(e),
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }


def process_result(service: dict, result: dict) -> None:
    """Track state transitions and alert on changes."""
    global total_alerts
    name = result["name"]
    prev = service_state.get(name, {})
    prev_status = prev.get("status", "UNKNOWN")
    curr_status = result["status"]

    service_state[name] = result

    # State transition: UP → DOWN
    if prev_status != "DOWN" and curr_status == "DOWN":
        total_alerts += 1
        critical_tag = " *[CRITICAL]*" if service.get("critical") else ""
        msg = (
            f"🔴 *SERVICE DOWN*{critical_tag}\n\n"
            f"*{name}* is unreachable.\n"
            f"URL: `{service['url']}`\n"
            f"Error: {result.get('error', 'No response')}\n"
            f"Time: {result['checked_at']}"
        )
        log.error(f"{name} DOWN — {result.get('error', 'No response')}")
        send_telegram(msg)

    # State transition: DOWN → UP (recovery)
    elif prev_status == "DOWN" and curr_status == "UP":
        down_since = prev.get("checked_at", "unknown")
        msg = (
            f"🟢 *SERVICE RECOVERED*\n\n"
            f"*{name}* is back online.\n"
            f"Latency: {result['latency_ms']}ms\n"
            f"Was down since: {down_since}\n"
            f"Recovered: {result['checked_at']}"
        )
        log.info(f"{name} RECOVERED — {result['latency_ms']}ms")
        send_telegram(msg)

    # Normal UP
    elif curr_status == "UP":
        log.debug(f"{name} UP ({result['latency_ms']}ms)")

    # Still DOWN (suppress duplicate alerts, log only)
    elif curr_status == "DOWN":
        log.warning(f"{name} still DOWN — {result.get('error', 'No response')}")


# ─── Main Loop ────────────────────────────────────────────────────────────

def run_cycle() -> None:
    """Run one full health check cycle."""
    global total_checks
    total_checks += 1
    up_count = 0
    down_count = 0

    for service in SERVICES:
        result = check_service(service)
        process_result(service, result)
        if result["status"] == "UP":
            up_count += 1
        else:
            down_count += 1

    log.info(f"Cycle #{total_checks}: {up_count} UP, {down_count} DOWN ({len(SERVICES)} services)")


def signal_handler(sig, frame):
    """Graceful shutdown."""
    global running
    log.info("Shutdown signal received. Stopping heartbeat.")
    running = False


def main():
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    log.info("=" * 50)
    log.info("A.I.M.S. Heartbeat Monitor v1.0")
    log.info(f"Monitoring {len(SERVICES)} services every {INTERVAL}s")
    log.info(f"Telegram alerts: {'ENABLED' if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID else 'DISABLED'}")
    log.info("=" * 50)

    # Startup announcement
    service_list = "\n".join(f"  • {s['name']}" for s in SERVICES)
    send_telegram(
        f"🫀 *Heartbeat Started*\n\n"
        f"Monitoring {len(SERVICES)} services every {INTERVAL}s:\n{service_list}"
    )

    while running:
        try:
            run_cycle()
        except Exception as e:
            log.error(f"Cycle error: {e}")

        # Sleep in small increments so we can respond to signals
        for _ in range(INTERVAL):
            if not running:
                break
            time.sleep(1)

    # Shutdown announcement
    send_telegram(
        f"💀 *Heartbeat Stopped*\n\n"
        f"Ran for {total_checks} cycles, sent {total_alerts} alerts.\n"
        f"Uptime: {datetime.now(timezone.utc) - startup_time}"
    )
    log.info(f"Stopped. {total_checks} cycles, {total_alerts} alerts.")


if __name__ == "__main__":
    main()
