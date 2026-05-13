import sys
from pathlib import Path
from datetime import datetime, timedelta
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
    "Surya": swe.SUN,
    "Chandra": swe.MOON,
    "Mangala": swe.MARS,
    "Budha": swe.MERCURY,
    "Guru": swe.JUPITER,
    "Shukra": swe.VENUS,
    "Shani": swe.SATURN,
}

PLANET_ABBR = {
    "Surya": "Su",
    "Chandra": "Mo",
    "Mangala": "Ma",
    "Budha": "Me",
    "Guru": "Ju",
    "Shukra": "Ve",
    "Shani": "Sa",
    "Rahu": "Ra",
    "Ketu": "Ke",
}


def _resolve_local_datetime(tz: str, dt_param: str | None) -> datetime:
    zone = ZoneInfo(tz)
    if not dt_param:
        return datetime.now(zone)

    normalized = dt_param.replace("Z", "+00:00")
    local_dt = datetime.fromisoformat(normalized)
    if local_dt.tzinfo is None:
        local_dt = local_dt.replace(tzinfo=zone)
    else:
        local_dt = local_dt.astimezone(zone)
    return local_dt


def _positions_payload(local_dt: datetime, loc: dict) -> dict:
    df = calculate_graha_positions_for_local_dt(local_dt, loc)

    jd = float(df["julian_day"].iloc[0])
    ayanamsha = float(df["ayanamsha"].iloc[0])

    swe.set_sid_mode(swe.SIDM_LAHIRI)
    swe.set_topo(loc["longitude"], loc["latitude"], float(loc.get("altitude", 0)))
    _, ascmc = swe.houses(jd, loc["latitude"], loc["longitude"], b"P")
    lagna_tropical = ascmc[0] % 360.0
    lagna_sidereal = (lagna_tropical - ayanamsha) % 360.0
    lagna_rashi_idx = int(lagna_sidereal // 30)

    extra = {}
    for graha, swe_id in _PHYSICAL_SWE.items():
        xx = swe.calc_ut(jd, swe_id, swe.FLG_TOPOCTR | swe.FLG_SPEED)[0]
        extra[graha] = {
            "is_retrograde": xx[3] < 0,
            "ecl_lat": round(float(xx[1]), 4),
            "speed": round(float(xx[3]), 6),
        }

    grahas = []
    for _, row in df.iterrows():
        graha = row["graha"]
        row_extra = extra.get(graha, {"is_retrograde": False, "ecl_lat": 0.0, "speed": 0.0})
        grahas.append({
            "name": graha,
            "abbr": PLANET_ABBR[graha],
            "sidereal_lon": round(float(row["sidereal_lon"]), 4),
            "ecl_lat": row_extra["ecl_lat"],
            "speed": row_extra["speed"],
            "rashi_en": row["rashi_en"],
            "rashi_idx": int(row["rashi_index"]),
            "nakshatra_en": row["nakshatra_en"],
            "pada": int(row["pada"]),
            "is_retrograde": row_extra["is_retrograde"],
        })

    return {
        "timestamp": local_dt.isoformat(),
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
    dt_param = request.args.get("dt")

    try:
        zone = ZoneInfo(tz)
    except Exception:
        return jsonify({"error": f"Invalid timezone: {tz}"}), 400

    try:
        local_dt = _resolve_local_datetime(tz, dt_param)
        minute_bucket = local_dt.replace(second=0, microsecond=0)
        loc = {"latitude": lat, "longitude": lon, "altitude": alt, "timezone": tz}
        result = _positions_payload(minute_bucket, loc)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/motion")
def motion():
    lat = request.args.get("lat", DEFAULT_LOCATION["latitude"], type=float)
    lon = request.args.get("lon", DEFAULT_LOCATION["longitude"], type=float)
    alt = request.args.get("alt", DEFAULT_LOCATION["altitude"], type=float)
    tz = request.args.get("tz", DEFAULT_LOCATION["timezone"])
    start_param = request.args.get("start")
    days = request.args.get("days", 7.0, type=float)
    step_hours = request.args.get("step_hours", 24.0, type=float)

    try:
        ZoneInfo(tz)
    except Exception:
        return jsonify({"error": f"Invalid timezone: {tz}"}), 400

    if days <= 0 or step_hours <= 0:
        return jsonify({"error": "days and step_hours must be positive"}), 400

    try:
        start_local = _resolve_local_datetime(tz, start_param)
        loc = {"latitude": lat, "longitude": lon, "altitude": alt, "timezone": tz}
        steps = int(days * 24 / step_hours)
        steps = max(1, steps)

        samples = []
        for i in range(steps + 1):
            sample_dt = start_local + timedelta(hours=i * step_hours)
            df = calculate_graha_positions_for_local_dt(sample_dt, loc)
            jd = float(df["julian_day"].iloc[0])
            swe.set_sid_mode(swe.SIDM_LAHIRI)
            swe.set_topo(lon, lat, float(alt))

            grahas = []
            for graha, swe_id in _PHYSICAL_SWE.items():
                row = df[df["graha"] == graha].iloc[0]
                xx = swe.calc_ut(jd, swe_id, swe.FLG_TOPOCTR | swe.FLG_SPEED)[0]
                grahas.append({
                    "name": graha,
                    "abbr": PLANET_ABBR[graha],
                    "sidereal_lon": round(float(row["sidereal_lon"]), 4),
                    "speed": round(float(xx[3]), 6),
                    "is_retrograde": xx[3] < 0,
                    "rashi_idx": int(row["rashi_index"]),
                    "nakshatra_en": row["nakshatra_en"],
                })

            samples.append({
                "timestamp": sample_dt.isoformat(),
                "grahas": grahas,
            })

        return jsonify({
            "start": start_local.isoformat(),
            "days": days,
            "step_hours": step_hours,
            "samples": samples,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
