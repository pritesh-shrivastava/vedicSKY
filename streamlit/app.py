import sys
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo

import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import plotly.graph_objects as go
from streamlit_autorefresh import st_autorefresh
import swisseph as swe

# ── import calculation engine from scripts/ ──────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from graha_positions_reference import (
    calculate_graha_positions_for_local_dt,
    DEFAULT_LOCATION,
    RASHIS,
)

# ── page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Navgraha Clock",
    page_icon="🪐",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── auto-refresh every 60 seconds ────────────────────────────────────────────
st_autorefresh(interval=60_000, key="planet_refresh")

# ── planet display config ─────────────────────────────────────────────────────
PLANET_ABBR = {
    "Surya":   "Su", "Chandra": "Mo", "Mangala": "Ma",
    "Budha":   "Me", "Guru":    "Ju", "Shukra":  "Ve",
    "Shani":   "Sa", "Rahu":    "Ra", "Ketu":    "Ke",
}
PLANET_COLOR = {
    "Surya":   "#FFA500", "Chandra": "#C8C8FF", "Mangala": "#FF4444",
    "Budha":   "#44FF44", "Guru":    "#FFFF44", "Shukra":  "#F5F0E8",
    "Shani":   "#8888AA", "Rahu":    "#888888", "Ketu":    "#AA8844",
    "Lagna":   "#FF88FF",
}
RASHI_SHORT = [
    "Ar", "Ta", "Ge", "Ca", "Le", "Vi",
    "Li", "Sc", "Sa", "Cp", "Aq", "Pi",
]
RASHI_COLORS = [
    "#FF6B6B", "#FFB347", "#FFD700", "#98FB98",
    "#87CEEB", "#DDA0DD", "#FF69B4", "#CD853F",
    "#9370DB", "#708090", "#4169E1", "#20B2AA",
]

# Constellation stick figures — (frac, ecl_lat_deg) per star, frac ∈ [0,1] within the 30° sector
# Positions are stylised to sit within each rashi's sector while preserving the constellation shape.
RASHI_OUTLINES = [
    # 0 Mesha (Aries) — γ-β-α-41Ari short chain
    dict(stars=[(0.12, 8.0),(0.14, 8.5),(0.26, 9.9),(0.35, 10.6)],
         lines=[(0,1),(1,2),(2,3)]),
    # 1 Vrishabha (Taurus) — Pleiades + Hyades V + two horns
    dict(stars=[(0.15, 4.0),(0.37,-1.4),(0.45,-2.3),(0.54,-2.1),(0.65,-5.5),(0.28, 5.2),(0.90, 2.4)],
         lines=[(0,1),(1,2),(2,3),(3,4),(2,5),(3,6)]),
    # 2 Mithuna (Gemini) — twin chains (Castor + Pollux sides)
    dict(stars=[(0.14,-7.0),(0.27, 1.0),(0.47, 7.3),(0.77, 9.9),(0.80, 6.7),(0.60, 2.5)],
         lines=[(0,1),(1,2),(2,3),(3,4),(4,5),(1,5)]),
    # 3 Karka (Cancer) — faint Y-shape
    dict(stars=[(0.20, 5.0),(0.53, 3.1),(0.60, 0.1),(0.83,-5.7),(0.95,-5.0)],
         lines=[(0,1),(1,2),(2,3),(2,4)]),
    # 4 Simha (Leo) — sickle (ε-μ-ζ-γ-η-Regulus) + tail to Denebola
    dict(stars=[(0.05, 7.5),(0.08, 6.0),(0.23,10.0),(0.30, 9.7),(0.28, 8.0),(0.55, 0.5),(0.75,13.0),(0.87,14.0),(0.95,14.0)],
         lines=[(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(6,7),(7,8)]),
    # 5 Kanya (Virgo) — Y-body with Vindemiatrix arm + Spica at tip
    dict(stars=[(0.03, 0.4),(0.10,-0.7),(0.32, 3.1),(0.28,16.0),(0.65, 8.5),(0.57, 5.0),(0.80,-2.1)],
         lines=[(0,1),(1,2),(2,3),(2,4),(4,5),(5,6)]),
    # 6 Tula (Libra) — balance beam + two pans
    dict(stars=[(0.37, 0.8),(0.60,-7.0),(0.75, 8.7),(0.80, 0.5)],
         lines=[(0,2),(2,3),(3,0),(0,1)]),
    # 7 Vrishchika (Scorpio) — long fishhook with curled stinger
    dict(stars=[(0.05, 1.2),(0.10,-1.6),(0.32,-4.6),(0.47,-8.0),(0.58,-11.0),(0.67,-14.0),(0.80,-13.8),(0.88,-12.0)],
         lines=[(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(6,7)]),
    # 8 Dhanu (Sagittarius) — teapot asterism
    dict(stars=[(0.23,-3.0),(0.30,-8.0),(0.37, 3.0),(0.43,-2.0),(0.57,-6.5),(0.58,-3.5),(0.65,-5.0),(0.80,-5.0)],
         lines=[(0,2),(0,3),(3,2),(3,4),(4,5),(4,6),(6,7)]),
    # 9 Makara (Capricorn) — arrowhead wedge (α-β-γ-δ)
    dict(stars=[(0.02,-5.5),(0.03,-7.5),(0.25,-4.0),(0.47,-2.3)],
         lines=[(0,1),(0,2),(2,3)]),
    # 10 Kumbha (Aquarius) — zig-zag water stream
    dict(stars=[(0.02,-8.0),(0.10,-11.0),(0.25,-14.0),(0.43,-15.0),(0.35,-11.0),(0.62,-13.0),(0.80,-10.0)],
         lines=[(0,1),(1,2),(2,3),(3,4),(4,5),(5,6)]),
    # 11 Meena (Pisces) — two fish joined by cord
    dict(stars=[(0.30, 0.0),(0.47, 5.0),(0.62, 8.0),(0.77, 5.0),(0.90,-5.0),(0.95,-2.0)],
         lines=[(0,1),(1,2),(2,3),(3,4),(4,5)]),
]

# ── sidebar: location input ───────────────────────────────────────────────────
with st.sidebar:
    st.header("📍 Observer Location")
    lat = st.number_input("Latitude",  value=DEFAULT_LOCATION["latitude"],  format="%.4f", min_value=-90.0, max_value=90.0)
    lon = st.number_input("Longitude", value=DEFAULT_LOCATION["longitude"], format="%.4f", min_value=-180.0, max_value=180.0)
    alt = st.number_input("Altitude (m)", value=int(DEFAULT_LOCATION["altitude"]), min_value=0, max_value=8848)
    tz  = st.text_input("Timezone", value=DEFAULT_LOCATION["timezone"])
    st.caption("Default: Ujjain, India — the prime meridian of Vedic astrology.")
    st.divider()
    st.caption("Positions update every 60 seconds.")

loc = {"latitude": lat, "longitude": lon, "altitude": alt, "timezone": tz}

# ── compute positions ─────────────────────────────────────────────────────────
try:
    now = datetime.now(ZoneInfo(tz))
except Exception:
    now = datetime.now(ZoneInfo("UTC"))

@st.cache_data(ttl=55)
def get_positions(lat, lon, alt, tz_str, minute_bucket):
    _loc = {"latitude": lat, "longitude": lon, "altitude": alt, "timezone": tz_str}
    _now = datetime.now(ZoneInfo(tz_str))
    return calculate_graha_positions_for_local_dt(_now, _loc)

minute_bucket = now.replace(second=0, microsecond=0)
df = get_positions(lat, lon, alt, tz, minute_bucket)

# ── compute Lagna (Ascendant) ─────────────────────────────────────────────────
jd       = float(df["julian_day"].iloc[0])
ayanamsha = float(df["ayanamsha"].iloc[0])
swe.set_sid_mode(swe.SIDM_LAHIRI)
_, ascmc = swe.houses(jd, lat, lon, b"P")
lagna_tropical  = ascmc[0] % 360.0
lagna_sidereal  = (lagna_tropical - ayanamsha) % 360.0
lagna_rashi_idx = int(lagna_sidereal // 30)

# ── retrograde flags for the 7 physical grahas ───────────────────────────────
_PHYSICAL_SWE = {
    "Surya": swe.SUN, "Chandra": swe.MOON, "Mangala": swe.MARS,
    "Budha": swe.MERCURY, "Guru": swe.JUPITER, "Shukra": swe.VENUS,
    "Shani": swe.SATURN,
}
swe.set_topo(lon, lat, float(alt))
retrograde_set = {
    graha for graha, swe_id in _PHYSICAL_SWE.items()
    if swe.calc_ut(jd, swe_id, swe.FLG_TOPOCTR | swe.FLG_SPEED)[0][3] < 0
}

# ── header ────────────────────────────────────────────────────────────────────
st.title("🪐 Navgraha Clock")
st.caption(f"Current positions as of {now.strftime('%Y-%m-%d %H:%M %Z')} · Lahiri ayanamsha · Sidereal (Vedic)")

# ── 2D zodiac wheel builder ───────────────────────────────────────────────────
def build_zodiac_2d(df, lagna_sidereal):
    NAK_SPAN = 360 / 27
    PADA_SPAN = 360 / 108
    NAK_NAMES = [
        "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
        "Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
        "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
        "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha",
        "Purva Bhadrapada","Uttara Bhadrapada","Revati",
    ]

    def nak_info(lon):
        idx = int(lon / NAK_SPAN) % 27
        pada = int((lon % NAK_SPAN) / PADA_SPAN) + 1
        return NAK_NAMES[idx], pada

    R_STAR = 0.83
    LAT_SCALE = 0.005
    traces = []

    # Sector dividers — 12 radial spokes
    for i in range(12):
        traces.append(go.Scatterpolar(
            r=[0, 1.0], theta=[i * 30, i * 30],
            mode="lines",
            line=dict(color="rgba(255,255,255,0.25)", width=0.5),
            showlegend=False, hoverinfo="none",
        ))

    # Constellation outlines per rashi
    for i, outline in enumerate(RASHI_OUTLINES):
        color = RASHI_COLORS[i]
        rashi_start = i * 30
        star_r, star_theta, star_hover = [], [], []
        for frac, lat in outline["stars"]:
            lon = rashi_start + frac * 30
            nak, pada = nak_info(lon)
            star_r.append(R_STAR + lat * LAT_SCALE)
            star_theta.append(lon)
            star_hover.append(f"<b>{nak}</b>")

        # Stick-figure lines (no hover)
        for si, sj in outline["lines"]:
            traces.append(go.Scatterpolar(
                r=[star_r[si], star_r[sj]],
                theta=[star_theta[si], star_theta[sj]],
                mode="lines",
                line=dict(color=color, width=1.0),
                showlegend=False, hoverinfo="none",
            ))

        # Star dots — nakshatra tooltip on hover / tap
        traces.append(go.Scatterpolar(
            r=star_r, theta=star_theta,
            mode="markers",
            marker=dict(size=7, color=color, opacity=0.9,
                        line=dict(color="white", width=0.4)),
            customdata=star_hover,
            hovertemplate="%{customdata}<extra></extra>",
            showlegend=False,
        ))

    # Rashi labels just outside ring
    for i in range(12):
        traces.append(go.Scatterpolar(
            r=[1.11], theta=[(i + 0.5) * 30],
            mode="text", text=[RASHI_SHORT[i]],
            textfont=dict(color=RASHI_COLORS[i], size=11),
            showlegend=False, hoverinfo="none",
        ))

    # Planet markers with hover
    for _, row in df.iterrows():
        graha = row["graha"]
        lon = float(row["sidereal_lon"])
        nak, pada = nak_info(lon)
        traces.append(go.Scatterpolar(
            r=[0.60], theta=[lon],
            mode="markers+text",
            marker=dict(size=10, color=PLANET_COLOR[graha],
                        line=dict(color="white", width=0.5)),
            text=[PLANET_ABBR[graha]],
            textposition="top center",
            textfont=dict(color=PLANET_COLOR[graha], size=10),
            name=graha,
            hovertemplate=(
                f"<b>{graha}</b><br>"
                f"{nak}  Pada {pada}<br>"
                f"{lon:.3f}°"
                "<extra></extra>"
            ),
        ))

    # Lagna radial line
    traces.append(go.Scatterpolar(
        r=[0, 1.0], theta=[lagna_sidereal, lagna_sidereal],
        mode="lines",
        line=dict(color=PLANET_COLOR["Lagna"], width=1.8),
        name="Ascendant",
        hoverinfo="none",
    ))
    traces.append(go.Scatterpolar(
        r=[1.11], theta=[lagna_sidereal],
        mode="text", text=["Asc"],
        textfont=dict(color=PLANET_COLOR["Lagna"], size=10),
        showlegend=False, hoverinfo="none",
    ))

    fig = go.Figure(data=traces)
    fig.update_layout(
        paper_bgcolor="#0D1117",
        polar=dict(
            bgcolor="#0D1117",
            angularaxis=dict(
                direction="clockwise",
                rotation=90,
                tickmode="array",
                tickvals=list(range(0, 360, 30)),
                ticktext=[f"{i * 30}°" for i in range(12)],
                tickfont=dict(color="rgba(255,255,255,0.35)", size=8),
                gridcolor="rgba(255,255,255,0.05)",
                linecolor="rgba(255,255,255,0.1)",
            ),
            radialaxis=dict(visible=False, range=[0, 1.2]),
        ),
        showlegend=True,
        legend=dict(font=dict(color="white"), bgcolor="rgba(0,0,0,0)"),
        margin=dict(l=60, r=60, t=60, b=60),
        height=650,
        title=dict(
            text="Hindu Zodiac 2D · Constellation Outlines · Sidereal (Lahiri)",
            font=dict(color="white", size=14),
            x=0.5,
        ),
    )
    return fig


# ── tabs ──────────────────────────────────────────────────────────────────────
tab1, tab2 = st.tabs(
    ["🔵 Hindu Zodiac 2D", "🔶 South Indian Rashi"]
)

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 1: HINDU ZODIAC 2D
# ═══════════════════════════════════════════════════════════════════════════════
with tab1:
    zodiac_fig = build_zodiac_2d(df, lagna_sidereal)
    st.plotly_chart(zodiac_fig, use_container_width=True)
    st.caption("Hover or tap any star dot to see its Nakshatra and Pada.")

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 2: SOUTH INDIAN KUNDALI
# ═══════════════════════════════════════════════════════════════════════════════
with tab2:
    # Fixed sign layout — signs are fixed, Lagna and planets placed by rashi
    # Row 3 (top): Pi(11), Ar(0), Ta(1), Ge(2)
    # Row 2:       Aq(10), [**], [**], Ca(3)
    # Row 1:       Cp(9),  [**], [**], Le(4)
    # Row 0 (bot): Sa(8),  Sc(7), Li(6), Vi(5)
    SOUTH_GRID = {
        # (col, row): rashi_index
        (0, 3): 11, (1, 3): 0,  (2, 3): 1,  (3, 3): 2,
        (0, 2): 10,                           (3, 2): 3,
        (0, 1): 9,                            (3, 1): 4,
        (0, 0): 8,  (1, 0): 7,  (2, 0): 6,  (3, 0): 5,
    }

    # Collect planets per rashi
    rashi_planets = {i: [] for i in range(12)}
    rashi_planets[lagna_rashi_idx].append("Asc")
    for _, row in df.iterrows():
        graha = row["graha"]
        abbr = PLANET_ABBR[graha]
        if graha in retrograde_set:
            abbr = f"({abbr})"
        rashi_planets[int(row["rashi_index"])].append(abbr)

    fig, ax = plt.subplots(figsize=(7, 7))
    fig.patch.set_facecolor("#0D1117")
    ax.set_facecolor("#0D1117")
    ax.set_xlim(0, 4)
    ax.set_ylim(0, 4)
    ax.set_aspect("equal")
    ax.axis("off")

    for (col, row_idx), rashi_i in SOUTH_GRID.items():
        is_lagna_cell = (rashi_i == lagna_rashi_idx)
        edge_color = PLANET_COLOR["Lagna"] if is_lagna_cell else "#555555"
        edge_width = 2.0 if is_lagna_cell else 1.2
        rect = mpatches.FancyBboxPatch(
            (col, row_idx), 1, 1,
            boxstyle="square,pad=0",
            linewidth=edge_width, edgecolor=edge_color,
            facecolor="#12182B",
        )
        ax.add_patch(rect)
        ax.text(col + 0.95, row_idx + 0.92, RASHI_SHORT[rashi_i],
                ha="right", va="top", fontsize=8, color="white", alpha=0.55)
        planets_str = "  ".join(rashi_planets[rashi_i])
        ax.text(col + 0.5, row_idx + 0.45, planets_str,
                ha="center", va="center", fontsize=10, color="white", fontweight="bold")

    # Center
    center_rect = mpatches.FancyBboxPatch(
        (1, 1), 2, 2,
        boxstyle="square,pad=0",
        linewidth=1.2, edgecolor="#555555",
        facecolor="#1A1A2E",
    )
    ax.add_patch(center_rect)
    lat_str = f"{abs(lat):.4f}°{'N' if lat >= 0 else 'S'}"
    lon_str = f"{abs(lon):.4f}°{'E' if lon >= 0 else 'W'}"
    ax.text(2, 2.3, f"{lat_str}, {lon_str}", ha="center", va="center", fontsize=9, color="#CCCCCC")
    ax.text(2, 1.9, now.strftime("%d %b %Y"), ha="center", va="center", fontsize=9, color="#AAAAAA")
    ax.text(2, 1.6, now.strftime("%H:%M %Z"), ha="center", va="center", fontsize=9, color="#AAAAAA")

    ax.set_title("South Indian Kundali", color="white", fontsize=13, pad=10)
    st.pyplot(fig)
    plt.close(fig)

# ── planet details table ──────────────────────────────────────────────────────
with st.expander("📋 Planet Details"):
    display_df = df[[
        "graha", "sidereal_lon", "rashi_en", "degree_in_rashi",
        "nakshatra_en", "pada",
    ]].copy()
    display_df.columns = ["Planet", "Sidereal Lon°", "Rashi", "Deg in Rashi", "Nakshatra", "Pada"]
    display_df["Sidereal Lon°"] = display_df["Sidereal Lon°"].round(3)
    display_df["Deg in Rashi"]  = display_df["Deg in Rashi"].round(3)
    st.dataframe(display_df, use_container_width=True, hide_index=True)
    st.caption(f"Lagna: {RASHI_SHORT[lagna_rashi_idx]} ({lagna_sidereal:.3f}°) · "
               f"Ayanamsha: {ayanamsha:.4f}° (Lahiri)")
