#!/usr/bin/env python3
"""
Export graha fixtures from `graha_positions_reference.py` to JSON.

Writes `tests/fixtures/graha_fixtures.json` containing per-test-case rows
from `calculate_graha_positions_for_local_dt` so Swift/XCTest can consume
the ground-truth values for M1 validation.

Usage:
  python scripts/export_fixtures.py [--out tests/fixtures/graha_fixtures.json]

This script requires the `swisseph` Python bindings to be installed.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Any

try:
    import swisseph  # noqa: F401
except Exception as exc:  # pragma: no cover - user environment dependent
    print("Error: swisseph bindings are required to export fixtures.")
    print("Install with: pip install swisseph")
    print(f"Import error: {exc}")
    sys.exit(2)

from graha_positions_reference import (
    GRAHA_TESTS,
    DEFAULT_LOCATION,
    calculate_graha_positions_for_local_dt,
)


def _make_local_dt(date_str: str, time_str: str, tzname: str) -> datetime:
    y, m, d = map(int, date_str.split("-"))
    h, mi, s = map(int, time_str.split(":"))
    return datetime(y, m, d, h, mi, s, tzinfo=ZoneInfo(tzname))


def serializable_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    # Ensure all values are JSON-serializable (datetimes -> ISO)
    out = []
    for r in rows:
        nr = r.copy()
        if isinstance(nr.get("date"), datetime):
            nr["date"] = nr["date"].isoformat()
        out.append(nr)
    return out


def main() -> int:
    out_path = Path("tests/fixtures/graha_fixtures.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    fixtures: list[dict[str, Any]] = []

    for tc in GRAHA_TESTS:
        loc = tc.get("location", DEFAULT_LOCATION)
        time_str = tc.get("time", "00:00:00")
        tz = loc.get("timezone", DEFAULT_LOCATION["timezone"])
        local_dt = _make_local_dt(tc["date"], time_str, tz)

        df = calculate_graha_positions_for_local_dt(local_dt, loc)
        rows = df.to_dict(orient="records")
        rows = serializable_rows(rows)

        fixtures.append({
            "case": {"date": tc["date"], "time": time_str, "location": loc},
            "rows": rows,
        })

    with out_path.open("w", encoding="utf-8") as f:
        json.dump(fixtures, f, ensure_ascii=False, indent=2)

    print(f"Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
