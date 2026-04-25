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
    "Surya":   "Su", "Chandra": "Ch", "Mangala": "Ma",
    "Budha":   "Bu", "Guru":    "Ju", "Shukra":  "Ve",
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

# ── header ────────────────────────────────────────────────────────────────────
st.title("🪐 Navgraha Clock")
st.caption(f"Current positions as of {now.strftime('%Y-%m-%d %H:%M %Z')} · Lahiri ayanamsha · Sidereal (Vedic)")

# ── 3D celestial sphere builder ───────────────────────────────────────────────
def build_celestial_sphere(df, lagna_sidereal, lagna_rashi_idx):
    traces = []

    # Sphere surface — subtle dark background to anchor the 3-D shape
    u = np.linspace(0, 2 * np.pi, 80)
    v = np.linspace(0, np.pi, 40)
    xs = np.outer(np.cos(u), np.sin(v))
    ys = np.outer(np.sin(u), np.sin(v))
    zs = np.outer(np.ones(80), np.cos(v))
    traces.append(go.Surface(
        x=xs, y=ys, z=zs,
        colorscale=[[0, "#050A1A"], [1, "#0B1530"]],
        showscale=False, opacity=0.55, hoverinfo="none",
    ))

    # Latitude circles at ±30° and ±60° (ecliptic parallels) — grid reference
    for lat_deg in (-60, -30, 30, 60):
        lons = np.linspace(0, 360, 361)
        r = np.cos(np.radians(lat_deg))
        xc = r * np.cos(np.radians(lons))
        yc = r * np.sin(np.radians(lons))
        zc = np.full(361, np.sin(np.radians(lat_deg)))
        traces.append(go.Scatter3d(
            x=xc, y=yc, z=zc, mode="lines",
            line=dict(color="rgba(255,255,255,0.08)", width=1),
            hoverinfo="none", showlegend=False,
        ))

    # Rashi arcs on the ecliptic — thick, colour-coded
    for i in range(12):
        lons = np.linspace(i * 30, (i + 1) * 30, 60)
        traces.append(go.Scatter3d(
            x=np.cos(np.radians(lons)),
            y=np.sin(np.radians(lons)),
            z=np.zeros(60),
            mode="lines",
            line=dict(color=RASHI_COLORS[i], width=6),
            hoverinfo="none", showlegend=False,
        ))

    # Rashi boundary meridians — full great circles
    for i in range(12):
        lon = i * 30
        lats = np.linspace(-90, 90, 181)
        traces.append(go.Scatter3d(
            x=np.cos(np.radians(lats)) * np.cos(np.radians(lon)),
            y=np.cos(np.radians(lats)) * np.sin(np.radians(lon)),
            z=np.sin(np.radians(lats)),
            mode="lines",
            line=dict(color="rgba(255,255,255,0.30)", width=1),
            hoverinfo="none", showlegend=False,
        ))

    # Nakshatra boundaries — short lines within ±22° latitude
    for i in range(27):
        lon = i * (360 / 27)
        lats = np.linspace(-22, 22, 45)
        traces.append(go.Scatter3d(
            x=np.cos(np.radians(lats)) * np.cos(np.radians(lon)),
            y=np.cos(np.radians(lats)) * np.sin(np.radians(lon)),
            z=np.sin(np.radians(lats)),
            mode="lines",
            line=dict(color="rgba(180,180,180,0.15)", width=0.5),
            hoverinfo="none", showlegend=False,
        ))

    # Rashi labels — floating just outside the sphere on the ecliptic plane
    for i in range(12):
        mid = (i + 0.5) * 30
        r = 1.22
        traces.append(go.Scatter3d(
            x=[r * np.cos(np.radians(mid))],
            y=[r * np.sin(np.radians(mid))],
            z=[0.0],
            mode="text",
            text=[RASHI_SHORT[i]],
            textfont=dict(color=RASHI_COLORS[i], size=11),
            hoverinfo="none", showlegend=False,
        ))

    # Planet markers
    for _, row in df.iterrows():
        graha = row["graha"]
        lon = float(row["sidereal_lon"])
        traces.append(go.Scatter3d(
            x=[np.cos(np.radians(lon))],
            y=[np.sin(np.radians(lon))],
            z=[0.0],
            mode="markers+text",
            marker=dict(
                size=9, color=PLANET_COLOR[graha],
                line=dict(color="white", width=1),
            ),
            text=[PLANET_ABBR[graha]],
            textposition="top center",
            textfont=dict(color=PLANET_COLOR[graha], size=12),
            name=graha,
            hovertemplate=(
                f"<b>{graha}</b><br>"
                f"Lon: {float(row['sidereal_lon']):.3f}°<br>"
                f"Rashi: {row['rashi_en']} ({float(row['degree_in_rashi']):.2f}°)<br>"
                f"Nakshatra: {row['nakshatra_en']} Pada {int(row['pada'])}"
                "<extra></extra>"
            ),
        ))

    # Lagna marker
    traces.append(go.Scatter3d(
        x=[np.cos(np.radians(lagna_sidereal))],
        y=[np.sin(np.radians(lagna_sidereal))],
        z=[0.0],
        mode="markers+text",
        marker=dict(
            size=9, color=PLANET_COLOR["Lagna"], symbol="diamond",
            line=dict(color="white", width=1),
        ),
        text=["La"],
        textposition="top center",
        textfont=dict(color=PLANET_COLOR["Lagna"], size=12),
        name="Lagna",
        hovertemplate=(
            f"<b>Lagna</b><br>Lon: {lagna_sidereal:.3f}°<br>"
            f"Rashi: {RASHI_SHORT[lagna_rashi_idx]}"
            "<extra></extra>"
        ),
    ))

    fig = go.Figure(data=traces)
    fig.update_layout(
        paper_bgcolor="#0D1117",
        scene=dict(
            bgcolor="#0D1117",
            xaxis=dict(visible=False, range=[-1.5, 1.5]),
            yaxis=dict(visible=False, range=[-1.5, 1.5]),
            zaxis=dict(visible=False, range=[-1.5, 1.5]),
            aspectmode="cube",
            camera=dict(
                eye=dict(x=1.5, y=1.0, z=0.6),
                up=dict(x=0, y=0, z=1),
            ),
        ),
        margin=dict(l=0, r=0, t=40, b=0),
        height=640,
        title=dict(
            text="Celestial Sphere · Sidereal Ecliptic (Lahiri) · Drag to rotate",
            font=dict(color="white", size=14),
            x=0.5,
        ),
        legend=dict(
            font=dict(color="white"),
            bgcolor="rgba(0,0,0,0)",
            itemsizing="constant",
        ),
    )
    return fig


# ── tabs ──────────────────────────────────────────────────────────────────────
tab1, tab2, tab3 = st.tabs(
    ["🔵 Hindu Zodiac 2D", "🌐 Celestial Sphere", "🔶 South Indian Rashi"]
)

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 1: RASHI WHEEL
# ═══════════════════════════════════════════════════════════════════════════════
with tab1:
    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw={"projection": "polar"})
    fig.patch.set_facecolor("#0D1117")
    ax.set_facecolor("#0D1117")

    # Aries at top, counter-clockwise (standard Vedic convention)
    ax.set_theta_zero_location("N")
    ax.set_theta_direction(-1)

    # Constellation stick figures + rashi labels
    R_STAR = 0.83      # reference radius for ecliptic-plane stars (lat=0°)
    LAT_SCALE = 0.005  # radial shift per degree of ecliptic latitude
    for i, outline in enumerate(RASHI_OUTLINES):
        color = RASHI_COLORS[i]
        rashi_start = i * 30  # sidereal degrees

        # Label just outside the ring
        mid = np.radians(rashi_start + 15)
        ax.text(mid, 1.04, RASHI_SHORT[i], ha="center", va="center",
                fontsize=9, color=color, fontweight="bold")

        # Convert (frac, lat) → polar (theta, r)
        star_coords = [
            (np.radians(rashi_start + frac * 30), R_STAR + lat * LAT_SCALE)
            for frac, lat in outline["stars"]
        ]

        # Draw stick-figure lines
        for si, sj in outline["lines"]:
            t0, r0 = star_coords[si]
            t1, r1 = star_coords[sj]
            ax.plot([t0, t1], [r0, r1], color=color, lw=0.9, alpha=0.7, zorder=3)

        # Draw star dots
        for theta, r in star_coords:
            ax.plot(theta, r, "o", color=color, markersize=2.5, alpha=0.9, zorder=4)

    # Draw sector dividers
    for i in range(12):
        ax.plot([np.radians(i * 30), np.radians(i * 30)], [0, 1.0],
                color="white", lw=0.5, alpha=0.3)

    PLANET_R = 0.60  # all planets at the same radius
    LAGNA_R  = 0.68  # Lagna just inside the rashi band

    # Plot each planet at its exact sidereal longitude
    for _, row in df.iterrows():
        graha  = row["graha"]
        theta  = np.radians(float(row["sidereal_lon"]))
        color  = PLANET_COLOR[graha]
        ax.plot(theta, PLANET_R, "o", color=color, markersize=9, zorder=5)
        ax.text(theta, PLANET_R + 0.07, PLANET_ABBR[graha],
                ha="center", va="center", fontsize=8, color=color, fontweight="bold")

    # Lagna — triangle at exact longitude
    lagna_theta = np.radians(lagna_sidereal)
    ax.plot(lagna_theta, LAGNA_R, "^", color=PLANET_COLOR["Lagna"], markersize=10, zorder=6)
    ax.text(lagna_theta, LAGNA_R + 0.04, "La", ha="center", va="center",
            fontsize=8, color=PLANET_COLOR["Lagna"], fontweight="bold")

    ax.set_ylim(0, 1.15)
    ax.set_yticks([])
    ax.set_xticks([])
    ax.spines["polar"].set_visible(False)
    ax.set_title("Hindu Zodiac 2D · Constellation Outlines · Sidereal (Lahiri)", color="white", pad=15, fontsize=13)
    st.pyplot(fig)
    plt.close(fig)

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 2: 3D CELESTIAL SPHERE
# ═══════════════════════════════════════════════════════════════════════════════
with tab2:
    sphere_fig = build_celestial_sphere(df, lagna_sidereal, lagna_rashi_idx)
    st.plotly_chart(sphere_fig, use_container_width=True)
    st.caption(
        "Ecliptic coordinate system: Aries (0°) points along +X axis. "
        "Colour-coded arcs = 12 Rashis. Faint lines = 27 Nakshatra boundaries. "
        "Drag to rotate · Scroll to zoom · Double-click to reset."
    )

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 3: SOUTH INDIAN KUNDALI
# ═══════════════════════════════════════════════════════════════════════════════
with tab3:
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
    rashi_planets[lagna_rashi_idx].append("La")
    for _, row in df.iterrows():
        rashi_planets[int(row["rashi_index"])].append(PLANET_ABBR[row["graha"]])

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
            facecolor=RASHI_COLORS[rashi_i] + "22",
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
