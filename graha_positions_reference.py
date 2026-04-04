import swisseph as swe
import sys
import pandas as pd
from datetime import datetime
from zoneinfo import ZoneInfo

# ─────────────────────────────────────────
#  CONSTANTS
# ─────────────────────────────────────────

GRAHAS = ["Surya", "Chandra", "Mangala", "Budha", "Guru", "Shukra", "Shani", "Rahu", "Ketu"]

# Explicit swe planet ID mapping — NEVER use loop index as swe ID
GRAHA_SWE_IDS = {
    "Surya":   swe.SUN,        # 0
    "Chandra": swe.MOON,       # 1
    "Mangala": swe.MARS,       # 4
    "Budha":   swe.MERCURY,    # 2
    "Guru":    swe.JUPITER,    # 5
    "Shukra":  swe.VENUS,      # 3
    "Shani":   swe.SATURN,     # 6
    "Rahu":    swe.MEAN_NODE,  # 11
    "Ketu":    None,           # derived as Rahu + 180°
}

RASHIS = [
    {"sanskrit": "मेष",    "english": "Aries",       "lord": "Mangala", "element": "Fire"},
    {"sanskrit": "वृषभ",   "english": "Taurus",      "lord": "Shukra",  "element": "Earth"},
    {"sanskrit": "मिथुन",  "english": "Gemini",      "lord": "Budha",   "element": "Air"},
    {"sanskrit": "कर्क",   "english": "Cancer",      "lord": "Chandra", "element": "Water"},
    {"sanskrit": "सिंह",   "english": "Leo",         "lord": "Surya",   "element": "Fire"},
    {"sanskrit": "कन्या",  "english": "Virgo",       "lord": "Budha",   "element": "Earth"},
    {"sanskrit": "तुला",   "english": "Libra",       "lord": "Shukra",  "element": "Air"},
    {"sanskrit": "वृश्चिक","english": "Scorpio",     "lord": "Mangala", "element": "Water"},
    {"sanskrit": "धनु",    "english": "Sagittarius", "lord": "Guru",    "element": "Fire"},
    {"sanskrit": "मकर",    "english": "Capricorn",   "lord": "Shani",   "element": "Earth"},
    {"sanskrit": "कुंभ",   "english": "Aquarius",    "lord": "Shani",   "element": "Air"},
    {"sanskrit": "मीन",    "english": "Pisces",      "lord": "Guru",    "element": "Water"},
]

# ─────────────────────────────────────────
#  NAKSHATRAS  (27 × 13°20′)
# ─────────────────────────────────────────

NAKSHATRA_SPAN = 360.0 / 27           # 13.3333...° per nakshatra
PADA_SPAN      = NAKSHATRA_SPAN / 4   #  3.3333...° per pada

# Lords follow the Vimshottari dasha sequence:
# Ketu, Shukra, Surya, Chandra, Mangala, Rahu, Guru, Shani, Budha (repeating)
NAKSHATRAS = [
    {"index": 0,  "sanskrit": "अश्विनी",       "english": "Ashwini",           "lord": "Ketu"},
    {"index": 1,  "sanskrit": "भरणी",          "english": "Bharani",           "lord": "Shukra"},
    {"index": 2,  "sanskrit": "कृत्तिका",      "english": "Krittika",          "lord": "Surya"},
    {"index": 3,  "sanskrit": "रोहिणी",        "english": "Rohini",            "lord": "Chandra"},
    {"index": 4,  "sanskrit": "मृगशिरा",       "english": "Mrigashira",        "lord": "Mangala"},
    {"index": 5,  "sanskrit": "आर्द्रा",       "english": "Ardra",             "lord": "Rahu"},
    {"index": 6,  "sanskrit": "पुनर्वसु",      "english": "Punarvasu",         "lord": "Guru"},
    {"index": 7,  "sanskrit": "पुष्य",         "english": "Pushya",            "lord": "Shani"},
    {"index": 8,  "sanskrit": "आश्लेषा",       "english": "Ashlesha",          "lord": "Budha"},
    {"index": 9,  "sanskrit": "मघा",           "english": "Magha",             "lord": "Ketu"},
    {"index": 10, "sanskrit": "पूर्व फाल्गुनी","english": "Purva Phalguni",    "lord": "Shukra"},
    {"index": 11, "sanskrit": "उत्तर फाल्गुनी","english": "Uttara Phalguni",   "lord": "Surya"},
    {"index": 12, "sanskrit": "हस्त",          "english": "Hasta",             "lord": "Chandra"},
    {"index": 13, "sanskrit": "चित्रा",        "english": "Chitra",            "lord": "Mangala"},
    {"index": 14, "sanskrit": "स्वाती",        "english": "Swati",             "lord": "Rahu"},
    {"index": 15, "sanskrit": "विशाखा",        "english": "Vishakha",          "lord": "Guru"},
    {"index": 16, "sanskrit": "अनुराधा",       "english": "Anuradha",          "lord": "Shani"},
    {"index": 17, "sanskrit": "ज्येष्ठा",      "english": "Jyeshtha",          "lord": "Budha"},
    {"index": 18, "sanskrit": "मूल",           "english": "Mula",              "lord": "Ketu"},
    {"index": 19, "sanskrit": "पूर्वाषाढ़",    "english": "Purva Ashadha",     "lord": "Shukra"},
    {"index": 20, "sanskrit": "उत्तराषाढ़",    "english": "Uttara Ashadha",    "lord": "Surya"},
    {"index": 21, "sanskrit": "श्रवण",         "english": "Shravana",          "lord": "Chandra"},
    {"index": 22, "sanskrit": "धनिष्ठा",      "english": "Dhanishtha",        "lord": "Mangala"},
    {"index": 23, "sanskrit": "शतभिषा",       "english": "Shatabhisha",       "lord": "Rahu"},
    {"index": 24, "sanskrit": "पूर्व भाद्रपद", "english": "Purva Bhadrapada",  "lord": "Guru"},
    {"index": 25, "sanskrit": "उत्तर भाद्रपद", "english": "Uttara Bhadrapada", "lord": "Shani"},
    {"index": 26, "sanskrit": "रेवती",         "english": "Revati",            "lord": "Budha"},
]

# Reference/default observer location: Ujjain, India
DEFAULT_LOCATION = {
    "latitude":  23.1828,   # N
    "longitude": 75.7772,   # E
    "altitude":  500,       # meters
    "timezone":  "Asia/Kolkata",
}




# ─────────────────────────────────────────
#  TEST CASES
# ─────────────────────────────────────────

GRAHA_TESTS = [
    {
        "date": "2026-01-01",
        "time": "00:00:00",
        "location": {"latitude": 23.1828, "longitude": 75.7772, "altitude": 500, "timezone": "Asia/Kolkata"},
        "expected": {
            "Shani":   {"rashi": "Pisces",      "nakshatra": "Purva Bhadrapada"},
            "Guru":    {"rashi": "Gemini",       "nakshatra": "Punarvasu"},
            "Ketu":    {"rashi": "Leo",          "nakshatra": "Purva Phalguni"},
        },
    },
    {
        "date": "2000-01-01",
        "time": "12:00:00",
        "location": {"latitude": 23.1828, "longitude": 75.7772, "altitude": 500, "timezone": "Asia/Kolkata"},
        "expected": {
            "Surya":  {"rashi": "Sagittarius", "nakshatra": "Purva Ashadha"},
            "Chandra":{"rashi": "Libra",       "nakshatra": "Swati"},
            "Mangala":{"rashi": "Aquarius",    "nakshatra": "Dhanishtha"},
            "Budha":  {"rashi": "Sagittarius", "nakshatra": "Mula"},
            "Guru":   {"rashi": "Aries",       "nakshatra": "Ashwini"},
            "Shukra": {"rashi": "Scorpio",     "nakshatra": "Anuradha"},
            "Shani":  {"rashi": "Aries",       "nakshatra": "Bharani"},
            "Rahu":   {"rashi": "Cancer",      "nakshatra": "Pushya"},
            "Ketu":   {"rashi": "Capricorn",   "nakshatra": "Shravana"},
        },
    },
    {
        "date": "1990-12-23",
        "time": "21:57:00",
        "location": {"latitude": 23.1828, "longitude": 75.7772, "altitude": 500, "timezone": "Asia/Kolkata"},
        "expected": {
            "Shani":   {"rashi": "Capricorn",    "nakshatra": "Uttara Ashadha"},
            "Guru":    {"rashi": "Cancer",       "nakshatra": "Ashlesha"},
            "Mangala": {"rashi": "Taurus",       "nakshatra": "Krittika"},
            "Surya":   {"rashi": "Sagittarius",  "nakshatra": "Mula"},
        },
    },
]


def calculate_graha_positions_for_local_dt(local_dt: datetime, loc: dict):
    """
    Compute graha positions (including nakshatra) for a single localized datetime and observer location.
    `local_dt` must be timezone-aware. `loc` should include latitude, longitude, altitude.
    Returns a DataFrame (one row per graha).
    """
    swe.set_sid_mode(swe.SIDM_LAHIRI)

    # convert local_dt to UTC and compute Julian Day with fractional hours
    utc_dt = local_dt.astimezone(ZoneInfo("UTC"))
    ut_hours = utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0
    jd = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, ut_hours)

    # set topocentric observer
    swe.set_topo(loc["longitude"], loc["latitude"], loc.get("altitude", 0))

    ayanamsha = float(swe.get_ayanamsa_ut(jd))

    rahu_tropical = float(swe.calc_ut(jd, swe.MEAN_NODE, swe.FLG_TOPOCTR)[0][0]) % 360.0
    ketu_tropical = (rahu_tropical + 180.0) % 360.0

    rows = []
    for graha in GRAHAS:
        if graha == "Ketu":
            tropical_lon = ketu_tropical
        elif graha == "Rahu":
            tropical_lon = rahu_tropical
        else:
            tropical_lon = float(swe.calc_ut(jd, GRAHA_SWE_IDS[graha], swe.FLG_TOPOCTR)[0][0]) % 360.0

        sidereal_lon = (tropical_lon - ayanamsha) % 360.0

        rashi_index = int(sidereal_lon // 30)
        degree_in_rashi = sidereal_lon % 30
        rashi = RASHIS[rashi_index]

        nakshatra_index = int(sidereal_lon // NAKSHATRA_SPAN)
        degree_in_nakshatra = sidereal_lon % NAKSHATRA_SPAN
        pada = int(degree_in_nakshatra // PADA_SPAN) + 1
        nakshatra = NAKSHATRAS[nakshatra_index]

        rows.append({
            "date": local_dt,
            "julian_day": round(jd, 6),
            "ayanamsha": round(ayanamsha, 6),
            "graha": graha,
            "tropical_lon": round(tropical_lon, 6),
            "sidereal_lon": round(sidereal_lon, 6),
            "rashi_index": rashi_index,
            "rashi": rashi["sanskrit"],
            "rashi_en": rashi["english"],
            "degree_in_rashi": round(degree_in_rashi, 6),
            "rashi_lord": rashi["lord"],
            "element": rashi["element"],
            "nakshatra_index": nakshatra_index,
            "nakshatra": nakshatra["sanskrit"],
            "nakshatra_en": nakshatra["english"],
            "nakshatra_lord": nakshatra["lord"],
            "degree_in_nakshatra": round(degree_in_nakshatra, 6),
            "pada": pada,
        })

    return pd.DataFrame(rows)

def run_tests():
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    print("=" * 80)
    print("GRAHA POSITION TESTS  (rashi + nakshatra)")
    print("=" * 80)

    all_passed = True

    # Reference location: use module-level DEFAULT_LOCATION

    for test in GRAHA_TESTS:
        date = pd.Timestamp(test["date"])

        # allow per-test location override, otherwise use DEFAULT_LOCATION
        loc = test.get("location", DEFAULT_LOCATION)

        # compute Julian Day from local midnight at the provided timezone
        tz = ZoneInfo(loc.get("timezone", DEFAULT_LOCATION["timezone"]))
        local_dt = datetime(date.year, date.month, date.day, 0, 0, 0, tzinfo=tz)
        utc_dt = local_dt.astimezone(ZoneInfo("UTC"))
        ut_hours = utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0
        jd = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, ut_hours)

        # set topocentric observer location for calculations
        swe.set_topo(loc["longitude"], loc["latitude"], loc.get("altitude", 0))

        ayanamsha = float(swe.get_ayanamsa_ut(jd))

        # compute nodes/topocentric
        rahu_tropical = float(swe.calc_ut(jd, swe.MEAN_NODE, swe.FLG_TOPOCTR)[0][0]) % 360.0
        ketu_tropical = (rahu_tropical + 180.0) % 360.0

        print(f"\nDate: {test['date']}  |  JD: {jd:.2f}  |  Ayanamsha: {ayanamsha:.4f}°")
        print(f"  {'Graha':<10} {'Rashi':<15} {'Exp.Rashi':<15} {'Nakshatra':<22} {'Exp.Nakshatra':<22} {'Result'}")
        print(f"  {'-'*9} {'-'*14} {'-'*14} {'-'*21} {'-'*21} {'-'*6}")

        for graha, expected in test["expected"].items():
            if graha == "Ketu":
                tropical_lon = ketu_tropical
            elif graha == "Rahu":
                tropical_lon = rahu_tropical
            else:
                # compute topocentric positions for observer
                tropical_lon = float(swe.calc_ut(jd, GRAHA_SWE_IDS[graha], swe.FLG_TOPOCTR)[0][0]) % 360.0

            sidereal_lon = (tropical_lon - ayanamsha) % 360.0

            computed_rashi      = RASHIS[int(sidereal_lon // 30)]["english"]
            nakshatra_index     = int(sidereal_lon // NAKSHATRA_SPAN)
            computed_nakshatra  = NAKSHATRAS[nakshatra_index]["english"]

            rashi_ok     = computed_rashi     == expected["rashi"]
            nakshatra_ok = computed_nakshatra == expected["nakshatra"]
            passed = rashi_ok and nakshatra_ok

            if not passed:
                all_passed = False
            status = "✓" if passed else "✗"

            rashi_str     = computed_rashi     if rashi_ok     else f"✗{computed_rashi}"
            nakshatra_str = computed_nakshatra if nakshatra_ok else f"✗{computed_nakshatra}"

            print(f"  {graha:<10} {rashi_str:<15} {expected['rashi']:<15} "
                  f"{nakshatra_str:<22} {expected['nakshatra']:<22} {status}")

    print("\n" + "=" * 80)
    print("ALL TESTS PASSED ✓" if all_passed else "SOME TESTS FAILED ✗")
    print("=" * 80 + "\n")

    return all_passed


# ─────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────

def main():
    # Run the simple test harness only — no external data fetches or CSV output.
    passed = run_tests()

    for test in GRAHA_TESTS:
        date = test["date"]
        time_str = test.get("time", "00:00:00")
        tz = ZoneInfo(test.get("location", {}).get("timezone", DEFAULT_LOCATION["timezone"]))
        y, m, d = map(int, date.split("-"))
        h, minute, s = map(int, time_str.split(":"))
        local_dt = datetime(y, m, d, h, minute, s, tzinfo=tz)

        loc = test.get("location", DEFAULT_LOCATION)

        print(f"\n-- Graha rows for {date} {time_str} ({loc.get('timezone', DEFAULT_LOCATION['timezone'])}) --")
        df = calculate_graha_positions_for_local_dt(local_dt, loc)
        # show the single-datetime rows in a compact form
        print(df[['date','graha','rashi_en','nakshatra_en','pada']].sort_values(['graha']).to_string(index=False))
    # exit non-zero when tests fail to make this script CI-friendly
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
