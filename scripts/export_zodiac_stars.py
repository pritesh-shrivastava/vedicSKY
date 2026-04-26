"""
export_zodiac_stars.py
----------------------
Uses Swiss Ephemeris to fetch sidereal ecliptic positions (Lahiri ayanamsha)
for the 27 nakshatra yoga taras and supporting constellation stars for all
12 rashis. Outputs web/src/constants/stars_data.json.

Run from repo root:
    python scripts/export_zodiac_stars.py
"""

import json
import sys
from pathlib import Path

import swisseph as swe

EPHE_PATH = str(Path(__file__).parent.parent / "iOS/NavgrahaClock/Resources/ephemeris")
swe.set_ephe_path(EPHE_PATH)
swe.set_sid_mode(swe.SIDM_LAHIRI)

# J2000.0 — positions are essentially fixed for our purposes
JD = 2451545.0
FLAGS = swe.FLG_SIDEREAL | swe.FLG_SPEED


def get_star(name: str):
    """Return (sidereal_lon, ecl_lat) or None if not found."""
    try:
        xx, _, err = swe.fixstar2(name, JD, FLAGS)
        if err:
            print(f"  WARN {name}: {err}", file=sys.stderr)
        return round(float(xx[0]), 2), round(float(xx[1]), 2)
    except Exception as e:
        print(f"  FAIL {name}: {e}", file=sys.stderr)
        return None


# ── 27 Nakshatra yoga taras ──────────────────────────────────────────────────
# (nakshatra_en, nakshatra_dev, sefstars_name, bayer_label)
YOGA_TARAS = [
    ("Ashwini",           "अश्विनी",     "Sheratan",         "β Ari"),
    ("Bharani",           "भरणी",        "Bharani",          "41 Ari"),    # ζ Ari in some traditions
    ("Krittika",          "कृत्तिका",    "Alcyone",          "η Tau"),
    ("Rohini",            "रोहिणी",      "Aldebaran",        "α Tau"),
    ("Mrigashira",        "मृगशिरा",     "Meissa",           "λ Ori"),
    ("Ardra",             "आर्द्रा",     "Betelgeuse",       "α Ori"),
    ("Punarvasu",         "पुनर्वसु",    "Pollux",           "β Gem"),
    ("Pushya",            "पुष्य",       "Asellus Australis","δ Cnc"),
    ("Ashlesha",          "आश्लेषा",     "Ashlesha",         "ε Hya"),
    ("Magha",             "मघा",         "Regulus",          "α Leo"),
    ("Purva Phalguni",    "पूर्व फाल्गुनी","Zosma",          "δ Leo"),
    ("Uttara Phalguni",   "उत्तर फाल्गुनी","Denebola",       "β Leo"),
    ("Hasta",             "हस्त",        "Algorab",          "δ Crv"),
    ("Chitra",            "चित्रा",      "Spica",            "α Vir"),
    ("Svati",             "स्वाति",      "Arcturus",         "α Boo"),
    ("Vishakha",          "विशाखा",      "Zubenelgenubi",    "α Lib"),
    ("Anuradha",          "अनुराधा",     "Dschubba",         "δ Sco"),
    ("Jyeshtha",          "ज्येष्ठा",    "Antares",          "α Sco"),
    ("Mula",              "मूल",         "Shaula",           "λ Sco"),
    ("Purva Ashadha",     "पूर्वाषाढ़ा", "Kaus Australis",   "ε Sgr"),
    ("Uttara Ashadha",    "उत्तराषाढ़ा", "Nunki",            "σ Sgr"),
    ("Shravana",          "श्रवण",       "Altair",           "α Aql"),
    ("Dhanishtha",        "धनिष्ठा",     "Rotanev",          "β Del"),
    ("Shatabhisha",       "शतभिषा",      "Hydor",            "λ Aqr"),
    ("Purva Bhadrapada",  "पूर्व भाद्रपद","Markab",          "α Peg"),
    ("Uttara Bhadrapada", "उत्तर भाद्रपद","Alpheratz",       "α And"),
    ("Revati",            "रेवती",       "Revati",           "ζ Psc"),
]

# ── 12 Rashi constellation stars ─────────────────────────────────────────────
# (sefstars_name, bayer_label)  — listed in ecliptic-longitude order roughly
# lines = list of [i, j] index pairs connecting the stick figure
RASHI_CONSTELLATIONS = [
    {
        "rashi": "Mesha", "rashi_dev": "मेष",
        "stars": [
            ("Mesarthim",  "γ Ari"),
            ("Sheratan",   "β Ari"),
            ("Hamal",      "α Ari"),
            ("Bharani",    "41 Ari"),   # ζ Ari
        ],
        "lines": [[0,1],[1,2],[1,3]],
    },
    {
        "rashi": "Vrishabha", "rashi_dev": "वृषभ",
        "stars": [
            ("Alcyone",    "η Tau"),    # Pleiades
            ("Aldebaran",  "α Tau"),
            ("Ain",        "ε Tau"),
            ("Elnath",     "β Tau"),
        ],
        "lines": [[0,1],[1,2],[1,3]],
    },
    {
        "rashi": "Mithuna", "rashi_dev": "मिथुन",
        "stars": [
            ("Alhena",     "γ Gem"),
            ("Mebsuta",    "ε Gem"),
            ("Castor",     "α Gem"),
            ("Pollux",     "β Gem"),
            ("Wasat",      "δ Gem"),
        ],
        "lines": [[0,1],[1,2],[2,3],[1,4],[4,0]],
    },
    {
        "rashi": "Karka", "rashi_dev": "कर्क",
        "stars": [
            ("Asellus Borealis",  "γ Cnc"),
            ("Asellus Australis", "δ Cnc"),
            ("Acubens",           "α Cnc"),
            ("Al Tarf",           "β Cnc"),
        ],
        "lines": [[0,1],[0,2],[1,3]],
    },
    {
        "rashi": "Simha", "rashi_dev": "सिंह",
        "stars": [
            ("Regulus",    "α Leo"),
            ("Al Jabhah",  "η Leo"),
            ("Algieba",    "γ Leo"),
            ("Zosma",      "δ Leo"),
            ("Denebola",   "β Leo"),
            ("Adhafera",   "ζ Leo"),
        ],
        "lines": [[0,1],[1,2],[2,5],[5,0],[2,3],[3,4]],
    },
    {
        "rashi": "Kanya", "rashi_dev": "कन्या",
        "stars": [
            ("Vindemiatrix", "ε Vir"),
            ("Porrima",      "γ Vir"),
            ("Zaniah",       "η Vir"),
            ("Spica",        "α Vir"),
            ("Heze",         "ζ Vir"),
        ],
        "lines": [[0,1],[1,2],[1,3],[3,4]],
    },
    {
        "rashi": "Tula", "rashi_dev": "तुला",
        "stars": [
            ("Zubenelgenubi",  "α Lib"),
            ("Zubeneshamali",  "β Lib"),
            ("Zubenelakrab",   "γ Lib"),
        ],
        "lines": [[0,1],[1,2],[2,0]],
    },
    {
        "rashi": "Vrischika", "rashi_dev": "वृश्चिक",
        "stars": [
            ("Dschubba",   "δ Sco"),
            ("Graffias",   "β Sco"),
            ("Antares",    "α Sco"),
            ("Sargas",     "θ Sco"),
            ("Shaula",     "λ Sco"),
            ("Lesath",     "υ Sco"),
        ],
        "lines": [[0,1],[0,2],[2,3],[3,4],[4,5]],
    },
    {
        "rashi": "Dhanu", "rashi_dev": "धनु",
        "stars": [
            ("Kaus Borealis",   "λ Sgr"),
            ("Kaus Media",      "δ Sgr"),
            ("Kaus Australis",  "ε Sgr"),
            ("Nunki",           "σ Sgr"),
            ("Ascella",         "ζ Sgr"),
        ],
        "lines": [[0,1],[1,2],[0,3],[3,4],[1,3]],
    },
    {
        "rashi": "Makara", "rashi_dev": "मकर",
        "stars": [
            ("Algedi",       "α Cap"),
            ("Dabih",        "β Cap"),
            ("Nashira",      "γ Cap"),
            ("Deneb Algedi", "δ Cap"),
        ],
        "lines": [[0,1],[1,2],[2,3],[3,0]],
    },
    {
        "rashi": "Kumbha", "rashi_dev": "कुंभ",
        "stars": [
            ("Sadalsuud",    "β Aqr"),
            ("Sadalachbia",  "γ Aqr"),
            ("Sadalmelik",   "α Aqr"),
            ("Hydor",        "λ Aqr"),
        ],
        "lines": [[0,1],[0,2],[1,3]],
    },
    {
        "rashi": "Meena", "rashi_dev": "मीन",
        "stars": [
            ("Revati",      "ζ Psc"),
            ("Alrescha",    "α Psc"),
            ("Al Pherg",   "η Psc"),
            ("Fumalsamakah","β Psc"),
        ],
        "lines": [[0,1],[1,2],[2,3],[3,1]],
    },
]


def main():
    print("Fetching yoga tara positions from Swiss Ephemeris (Lahiri sidereal)...")
    print(f"Ephemeris path: {EPHE_PATH}\n")

    # ── Yoga taras ────────────────────────────────────────────────────────
    yoga_taras_out = []
    for nak_en, nak_dev, star_name, bayer in YOGA_TARAS:
        pos = get_star(star_name)
        if pos is None:
            print(f"  [{nak_en}] {star_name} not found — keeping as None")
        else:
            print(f"  {nak_en:22s} {star_name:20s} lon={pos[0]:7.2f}° lat={pos[1]:+.2f}°")
        yoga_taras_out.append({
            "nakshatra_en":  nak_en,
            "nakshatra_dev": nak_dev,
            "star_name":     star_name,
            "bayer":         bayer,
            "lon":           pos[0] if pos else None,
            "lat":           pos[1] if pos else None,
        })

    print()

    # ── Rashi constellations ──────────────────────────────────────────────
    constellations_out = []
    for rashi_def in RASHI_CONSTELLATIONS:
        rashi_stars = []
        print(f"{rashi_def['rashi']}:")
        for star_name, bayer in rashi_def["stars"]:
            pos = get_star(star_name)
            if pos:
                print(f"  {star_name:20s} ({bayer:7s}) lon={pos[0]:7.2f}° lat={pos[1]:+.2f}°")
            else:
                print(f"  {star_name:20s} ({bayer:7s}) NOT FOUND")
            rashi_stars.append({
                "star": star_name,
                "bayer": bayer,
                "lon": pos[0] if pos else None,
                "lat": pos[1] if pos else None,
            })

        constellations_out.append({
            "rashi":     rashi_def["rashi"],
            "rashi_dev": rashi_def["rashi_dev"],
            "stars":     rashi_stars,
            "lines":     rashi_def["lines"],
        })
        print()

    # ── Write output ──────────────────────────────────────────────────────
    out = {
        "note": "Sidereal ecliptic positions, Lahiri ayanamsha, J2000.0",
        "yoga_taras": yoga_taras_out,
        "constellations": constellations_out,
    }

    out_path = Path(__file__).parent.parent / "web/src/constants/stars_data.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(f"Written to {out_path}")

    # Summary
    failed_yt = [y for y in yoga_taras_out if y["lon"] is None]
    failed_c  = [
        f"{c['rashi']}/{s['star']}"
        for c in constellations_out
        for s in c["stars"] if s["lon"] is None
    ]
    if failed_yt or failed_c:
        print(f"\nFAILED yoga taras: {[y['nakshatra_en'] for y in failed_yt]}")
        print(f"FAILED constellation stars: {failed_c}")
    else:
        print("\nAll stars found successfully.")


if __name__ == "__main__":
    main()
