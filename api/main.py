import sys
from pathlib import Path
from datetime import datetime
from functools import lru_cache
from zoneinfo import ZoneInfo

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from graha_positions_reference import (
    calculate_graha_positions_for_local_dt,
    DEFAULT_LOCATION,
)

import swisseph as swe

app = FastAPI(title="Vedic Zodiac API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

_PHYSICAL_SWE = {
    "Surya": swe.SUN, "Chandra": swe.MOON, "Mangala": swe.MARS,
    "Budha": swe.MERCURY, "Guru": swe.JUPITER, "Shukra": swe.VENUS,
    "Shani": swe.SATURN,
}

PLANET_ABBR = {
    "Surya": "Su", "Chandra": "Mo", "Mangala": "Ma",
    "Budha": "Me", "Guru": "Ju", "Shukra": "Ve",
    "Shani": "Sa", "Rahu": "Ra", "Ketu": "Ke",
}


@lru_cache(maxsize=256)
def _cached_positions(lat: float, lon: float, alt: float, tz: str, minute_bucket: str):
    loc = {"latitude": lat, "longitude": lon, "altitude": alt, "timezone": tz}
    now = datetime.now(ZoneInfo(tz))
    df = calculate_graha_positions_for_local_dt(now, loc)

    jd = float(df["julian_day"].iloc[0])
    ayanamsha = float(df["ayanamsha"].iloc[0])

    swe.set_sid_mode(swe.SIDM_LAHIRI)
    swe.set_topo(lon, lat, float(alt))
    _, ascmc = swe.houses(jd, lat, lon, b"P")
    lagna_tropical = ascmc[0] % 360.0
    lagna_sidereal = (lagna_tropical - ayanamsha) % 360.0
    lagna_rashi_idx = int(lagna_sidereal // 30)

    # One calc_ut call per physical graha — get speed (retrograde) + ecliptic latitude
    _graha_extra: dict[str, dict] = {}
    for graha, swe_id in _PHYSICAL_SWE.items():
        xx = swe.calc_ut(jd, swe_id, swe.FLG_TOPOCTR | swe.FLG_SPEED)[0]
        _graha_extra[graha] = {
            "is_retrograde": xx[3] < 0,
            "ecl_lat": round(float(xx[1]), 4),
        }

    grahas = []
    for _, row in df.iterrows():
        graha = row["graha"]
        extra = _graha_extra.get(graha, {"is_retrograde": False, "ecl_lat": 0.0})
        grahas.append({
            "name": graha,
            "abbr": PLANET_ABBR[graha],
            "sidereal_lon": round(float(row["sidereal_lon"]), 4),
            "ecl_lat": extra["ecl_lat"],
            "rashi_en": row["rashi_en"],
            "rashi_idx": int(row["rashi_index"]),
            "nakshatra_en": row["nakshatra_en"],
            "pada": int(row["pada"]),
            "is_retrograde": extra["is_retrograde"],
        })

    return {
        "timestamp": now.isoformat(),
        "ayanamsha": round(ayanamsha, 4),
        "lagna": {
            "sidereal_lon": round(lagna_sidereal, 4),
            "rashi_idx": lagna_rashi_idx,
        },
        "grahas": grahas,
    }


@app.get("/positions")
def positions(
    lat: float = Query(default=DEFAULT_LOCATION["latitude"], ge=-90, le=90),
    lon: float = Query(default=DEFAULT_LOCATION["longitude"], ge=-180, le=180),
    alt: float = Query(default=DEFAULT_LOCATION["altitude"], ge=0, le=8848),
    tz: str = Query(default=DEFAULT_LOCATION["timezone"]),
):
    try:
        ZoneInfo(tz)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid timezone: {tz}")

    now = datetime.now(ZoneInfo(tz))
    minute_bucket = now.strftime("%Y-%m-%dT%H:%M")

    try:
        return _cached_positions(
            round(lat, 4), round(lon, 4), round(alt, 1), tz, minute_bucket
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
