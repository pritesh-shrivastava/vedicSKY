#!/usr/bin/env python3
"""Print a daily panchang summary for Hermes cron delivery.

The calculation is sunrise-based for the configured observer location. The
output is intentionally plain text because Hermes delivers stdout directly.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import date, datetime, time, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import swisseph as swe

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(REPO_ROOT / "scripts"))

from graha_positions_reference import DEFAULT_LOCATION, NAKSHATRAS, RASHIS  # noqa: E402

TITHIS = [
    "Shukla Pratipada",
    "Shukla Dwitiya",
    "Shukla Tritiya",
    "Shukla Chaturthi",
    "Shukla Panchami",
    "Shukla Shashthi",
    "Shukla Saptami",
    "Shukla Ashtami",
    "Shukla Navami",
    "Shukla Dashami",
    "Shukla Ekadashi",
    "Shukla Dwadashi",
    "Shukla Trayodashi",
    "Shukla Chaturdashi",
    "Purnima",
    "Krishna Pratipada",
    "Krishna Dwitiya",
    "Krishna Tritiya",
    "Krishna Chaturthi",
    "Krishna Panchami",
    "Krishna Shashthi",
    "Krishna Saptami",
    "Krishna Ashtami",
    "Krishna Navami",
    "Krishna Dashami",
    "Krishna Ekadashi",
    "Krishna Dwadashi",
    "Krishna Trayodashi",
    "Krishna Chaturdashi",
    "Amavasya",
]

KARANAS = [
    "Bava",
    "Balava",
    "Kaulava",
    "Taitila",
    "Gara",
    "Vanija",
    "Vishti",
]

YOGAS = [
    "Vishkambha",
    "Priti",
    "Ayushman",
    "Saubhagya",
    "Shobhana",
    "Atiganda",
    "Sukarma",
    "Dhriti",
    "Shula",
    "Ganda",
    "Vriddhi",
    "Dhruva",
    "Vyaghata",
    "Harshana",
    "Vajra",
    "Siddhi",
    "Vyatipata",
    "Variyana",
    "Parigha",
    "Shiva",
    "Siddha",
    "Sadhya",
    "Shubha",
    "Shukla",
    "Brahma",
    "Indra",
    "Vaidhriti",
]

VARAS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
NAKSHATRA_SPAN = 360.0 / 27.0
TITHI_SPAN = 12.0
YOGA_SPAN = 360.0 / 27.0
KARANA_SPAN = 6.0


def env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    return default if raw is None or raw.strip() == "" else float(raw)


def env_str(name: str, default: str) -> str:
    raw = os.environ.get(name)
    return default if raw is None or raw.strip() == "" else raw.strip()


def parse_date(value: str | None, zone: ZoneInfo) -> date:
    if not value:
        return datetime.now(zone).date()
    return date.fromisoformat(value)


def julian_day(dt: datetime) -> float:
    utc_dt = dt.astimezone(timezone.utc)
    hours = utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0
    return swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, hours)


def local_from_jd(jd: float, zone: ZoneInfo) -> datetime:
    year, month, day, hour = swe.revjul(jd, swe.GREG_CAL)
    hour_int = int(hour)
    minute_float = (hour - hour_int) * 60.0
    minute = int(minute_float)
    second = int(round((minute_float - minute) * 60.0))
    if second == 60:
        minute += 1
        second = 0
    if minute == 60:
        hour_int += 1
        minute = 0
    return datetime(year, month, day, hour_int, minute, second, tzinfo=timezone.utc).astimezone(zone)


def sidereal_lon(jd: float, body: int) -> float:
    tropical = float(swe.calc_ut(jd, body, swe.FLG_TOPOCTR)[0][0]) % 360.0
    return (tropical - float(swe.get_ayanamsa_ut(jd))) % 360.0


def rise_set_for(day: date, zone: ZoneInfo, loc: dict[str, float | str], body: int, event: int) -> datetime | None:
    local_midnight = datetime.combine(day, time.min, tzinfo=zone)
    jd = julian_day(local_midnight)
    geopos = (float(loc["longitude"]), float(loc["latitude"]), float(loc["altitude"]))
    try:
        result, tret = swe.rise_trans(jd, body, event, geopos, flags=swe.FLG_SWIEPH)
    except swe.Error:
        return None
    if result < 0:
        return None
    return local_from_jd(float(tret[0]), zone)


def format_event_time(value: datetime | None) -> str:
    if value is None:
        return "not found"
    return value.strftime("%H:%M %Z")


def karana_name(elongation: float) -> str:
    index = int(elongation // KARANA_SPAN)
    if index == 0:
        return "Kimstughna"
    if index == 57:
        return "Shakuni"
    if index == 58:
        return "Chatushpada"
    if index == 59:
        return "Naga"
    return KARANAS[(index - 1) % len(KARANAS)]


def format_panchang(day: date, loc: dict[str, float | str]) -> str:
    zone = ZoneInfo(str(loc["timezone"]))
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    swe.set_topo(float(loc["longitude"]), float(loc["latitude"]), float(loc["altitude"]))

    sunrise = rise_set_for(day, zone, loc, swe.SUN, swe.CALC_RISE)
    if sunrise is None:
        raise RuntimeError(f"Sunrise not found for {day.isoformat()} at {loc}")

    sunset = rise_set_for(day, zone, loc, swe.SUN, swe.CALC_SET)
    moonrise = rise_set_for(day, zone, loc, swe.MOON, swe.CALC_RISE)
    moonset = rise_set_for(day, zone, loc, swe.MOON, swe.CALC_SET)

    jd = julian_day(sunrise)
    sun = sidereal_lon(jd, swe.SUN)
    moon = sidereal_lon(jd, swe.MOON)

    elongation = (moon - sun) % 360.0
    tithi = TITHIS[int(elongation // TITHI_SPAN)]
    nakshatra = NAKSHATRAS[int(moon // NAKSHATRA_SPAN)]["english"]
    moon_rashi = RASHIS[int(moon // 30.0)]["english"]
    yoga = YOGAS[int(((sun + moon) % 360.0) // YOGA_SPAN)]
    karana = karana_name(elongation)
    vara = VARAS[sunrise.weekday()]

    return "\n".join(
        [
            f"Daily Panchang - {sunrise.strftime('%A, %d %b %Y')}",
            f"Location: {loc['latitude']:.4f}, {loc['longitude']:.4f} ({loc['timezone']})",
            f"Sunrise: {format_event_time(sunrise)}",
            f"Sunset: {format_event_time(sunset)}",
            f"Moonrise: {format_event_time(moonrise)}",
            f"Moonset: {format_event_time(moonset)}",
            "",
            f"Vara: {vara}",
            f"Tithi: {tithi}",
            f"Nakshatra: {nakshatra}",
            f"Yoga: {yoga}",
            f"Karana: {karana}",
            f"Moon Rashi: {moon_rashi}",
            "",
            "Method: Lahiri ayanamsha, topocentric, values at local sunrise.",
        ]
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Print today's panchang for Telegram/Hermes delivery")
    parser.add_argument("--date", help="Local date as YYYY-MM-DD; defaults to today in the configured timezone")
    parser.add_argument("--lat", type=float, default=env_float("PANCHANG_LAT", DEFAULT_LOCATION["latitude"]))
    parser.add_argument("--lon", type=float, default=env_float("PANCHANG_LON", DEFAULT_LOCATION["longitude"]))
    parser.add_argument("--alt", type=float, default=env_float("PANCHANG_ALT", DEFAULT_LOCATION["altitude"]))
    parser.add_argument("--tz", default=env_str("PANCHANG_TZ", DEFAULT_LOCATION["timezone"]))
    args = parser.parse_args()

    loc = {"latitude": args.lat, "longitude": args.lon, "altitude": args.alt, "timezone": args.tz}
    day = parse_date(args.date, ZoneInfo(args.tz))
    print(format_panchang(day, loc))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
