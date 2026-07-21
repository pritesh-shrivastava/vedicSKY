#!/usr/bin/env python3
"""Print a daily graha ephemeris table for Hermes cron delivery."""

from __future__ import annotations

import argparse
import os
import sys
from datetime import date, datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(REPO_ROOT / "scripts"))

from graha_positions_reference import (  # noqa: E402
    DEFAULT_LOCATION,
    GRAHAS,
    calculate_graha_positions_for_local_dt,
)


def env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    return default if raw is None or raw.strip() == "" else float(raw)


def env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    return default if raw is None or raw.strip() == "" else int(raw)


def env_str(name: str, default: str) -> str:
    raw = os.environ.get(name)
    return default if raw is None or raw.strip() == "" else raw.strip()


def parse_date(value: str | None, zone: ZoneInfo) -> date:
    if not value:
        return datetime.now(zone).date()
    return date.fromisoformat(value)


def parse_local_time(value: str) -> time:
    try:
        hour_raw, minute_raw = value.split(":", 1)
        return time(int(hour_raw), int(minute_raw))
    except ValueError as exc:
        raise argparse.ArgumentTypeError("time must be HH:MM") from exc


def format_degree(value: float) -> str:
    degrees = int(value)
    minutes = int(round((value - degrees) * 60.0))
    if minutes == 60:
        degrees += 1
        minutes = 0
    return f"{degrees:02d}d{minutes:02d}m"


def format_position(row) -> str:
    rashi = str(row["rashi_en"])[:3]
    degree = format_degree(float(row["degree_in_rashi"]))
    return f"{rashi} {degree}"


def table(headers: list[str], rows: list[list[str]]) -> str:
    widths = [
        max(len(str(row[index])) for row in [headers, *rows])
        for index in range(len(headers))
    ]
    rendered = []
    rendered.append("  ".join(headers[index].ljust(widths[index]) for index in range(len(headers))))
    rendered.append("  ".join("-" * widths[index] for index in range(len(headers))))
    for row in rows:
        rendered.append("  ".join(row[index].ljust(widths[index]) for index in range(len(row))))
    return "\n".join(rendered)


def format_ephemeris(start_day: date, local_time: time, days: int, loc: dict[str, float | str]) -> str:
    if days <= 0:
        raise ValueError("days must be positive")

    zone = ZoneInfo(str(loc["timezone"]))
    dates = [start_day + timedelta(days=offset) for offset in range(days)]
    positions_by_date: dict[date, dict[str, str]] = {}

    for day in dates:
        local_dt = datetime.combine(day, local_time, tzinfo=zone)
        df = calculate_graha_positions_for_local_dt(local_dt, loc)
        positions_by_date[day] = {
            str(row["graha"]): format_position(row)
            for _, row in df.iterrows()
        }

    headers = ["Graha", *[day.strftime("%d %b") for day in dates]]
    rows = [
        [graha, *[positions_by_date[day][graha] for day in dates]]
        for graha in GRAHAS
    ]

    start_dt = datetime.combine(start_day, local_time, tzinfo=zone)
    return "\n".join(
        [
            f"Daily Graha Ephemeris - {start_day.strftime('%d %b %Y')}",
            f"Location: {loc['latitude']:.4f}, {loc['longitude']:.4f} ({loc['timezone']})",
            f"Time: {start_dt.strftime('%H:%M %Z')} daily",
            "Positions: sidereal rashi degrees (Lahiri, topocentric)",
            "",
            table(headers, rows),
        ]
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Print a multi-day graha ephemeris table")
    parser.add_argument("--date", help="Start date as YYYY-MM-DD; defaults to today in the configured timezone")
    parser.add_argument("--days", type=int, default=env_int("EPHEMERIS_DAYS", 6), help="Number of dates to show")
    parser.add_argument("--time", type=parse_local_time, default=parse_local_time(env_str("EPHEMERIS_TIME", "09:00")))
    parser.add_argument("--lat", type=float, default=env_float("EPHEMERIS_LAT", DEFAULT_LOCATION["latitude"]))
    parser.add_argument("--lon", type=float, default=env_float("EPHEMERIS_LON", DEFAULT_LOCATION["longitude"]))
    parser.add_argument("--alt", type=float, default=env_float("EPHEMERIS_ALT", DEFAULT_LOCATION["altitude"]))
    parser.add_argument("--tz", default=env_str("EPHEMERIS_TZ", DEFAULT_LOCATION["timezone"]))
    args = parser.parse_args()

    loc = {"latitude": args.lat, "longitude": args.lon, "altitude": args.alt, "timezone": args.tz}
    start_day = parse_date(args.date, ZoneInfo(args.tz))
    print(format_ephemeris(start_day, args.time, args.days, loc))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
