import sys
from pathlib import Path
from datetime import datetime
from functools import lru_cache
from zoneinfo import ZoneInfo

from flask import Flask, request, jsonify
from flask_cors import CORS

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from graha_positions_reference import (
    calculate_graha_positions_for_local_dt,
    DEFAULT_LOCATION,
)

import swisseph as swe
swe.set_ephe_path('/home/pritesh2312/ephemeris')

app = Flask(__name__)
CORS(app)

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
def _cached_positions(lat, lon, alt, tz, minute_bucket):
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

    _graha_extra = {}
    for graha, swe_id in _PHYSICAL_SWE.items():
        xx = swe.calc_ut(jd, swe_id, swe.FLG_TOPOCTR | swe.FLG_SPEED)[0]
        _graha_extra[graha] = {"is_retrograde": xx[3] < 0, "ecl_lat": round(float(xx[1]), 4)}

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
        "lagna": {"sidereal_lon": round(lagna_sidereal, 4), "rashi_idx": lagna_rashi_idx},
        "grahas": grahas,
    }


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/positions")
def positions():
    lat = request.args.get("lat", DEFAULT_LOCATION["latitude"], type=float)
    lon = request.args.get("lon", DEFAULT_LOCATION["longitude"], type=float)
    alt = request.args.get("alt", DEFAULT_LOCATION["altitude"], type=float)
    tz = request.args.get("tz", DEFAULT_LOCATION["timezone"])

    try:
        ZoneInfo(tz)
    except Exception:
        return jsonify({"error": f"Invalid timezone: {tz}"}), 400

    now = datetime.now(ZoneInfo(tz))
    minute_bucket = now.strftime("%Y-%m-%dT%H:%M")

    try:
        result = _cached_positions(round(lat, 4), round(lon, 4), round(alt, 1), tz, minute_bucket)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
