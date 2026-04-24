import sys
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo

import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
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

# ── tabs ──────────────────────────────────────────────────────────────────────
tab1, tab2, tab3 = st.tabs(
    ["🔵 Rashi Wheel", "🌐 Celestial Map", "🔶 South Kundali"]
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

    # Draw 12 rashi sectors (30° each)
    for i in range(12):
        theta_start = np.radians(i * 30)
        theta_end   = np.radians((i + 1) * 30)
        thetas = np.linspace(theta_start, theta_end, 50)
        ax.fill_between(thetas, 0.75, 1.0, color=RASHI_COLORS[i], alpha=0.35)
        ax.fill_between(thetas, 0.0,  0.75, color=RASHI_COLORS[i], alpha=0.06)
        # Rashi label
        mid = np.radians(i * 30 + 15)
        ax.text(mid, 0.875, RASHI_SHORT[i], ha="center", va="center",
                fontsize=10, color="white", fontweight="bold")

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

    ax.set_yticks([])
    ax.set_xticks([])
    ax.spines["polar"].set_visible(False)
    ax.set_title("Rashi Chakra · Sidereal Vedic", color="white", pad=15, fontsize=13)
    st.pyplot(fig)
    plt.close(fig)

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 2: CELESTIAL MAP (ecliptic longitude vs. ecliptic latitude placeholder)
# ═══════════════════════════════════════════════════════════════════════════════
with tab2:
    fig, ax = plt.subplots(figsize=(12, 5))
    fig.patch.set_facecolor("#0D1117")
    ax.set_facecolor("#0D1117")

    # Draw 12 rashi bands
    for i in range(12):
        x0, x1 = i * 30, (i + 1) * 30
        ax.axvspan(x0, x1, alpha=0.12, color=RASHI_COLORS[i])
        ax.text((x0 + x1) / 2, -4.5, RASHI_SHORT[i], ha="center", va="center",
                fontsize=9, color="white", alpha=0.6)

    # Plot planets along ecliptic (latitude ≈ 0 for all)
    for _, row in df.iterrows():
        graha = row["graha"]
        x = float(row["sidereal_lon"])
        y = 0.0  # planets are near the ecliptic plane
        color = PLANET_COLOR[graha]
        ax.scatter(x, y, color=color, s=100, zorder=5)
        ax.annotate(
            PLANET_ABBR[graha],
            (x, y), textcoords="offset points", xytext=(0, 12),
            ha="center", fontsize=9, color=color, fontweight="bold",
        )

    # Lagna marker
    ax.axvline(lagna_sidereal, color=PLANET_COLOR["Lagna"], lw=1.5, ls="--", alpha=0.8)
    ax.text(lagna_sidereal, 4.2, "La", ha="center", fontsize=9,
            color=PLANET_COLOR["Lagna"], fontweight="bold")

    ax.set_xlim(0, 360)
    ax.set_ylim(-6, 6)
    ax.set_xticks(range(0, 361, 30))
    ax.set_xticklabels([f"{i*30}°" for i in range(13)], color="white", fontsize=8)
    ax.set_yticks([])
    ax.set_xlabel("Sidereal Ecliptic Longitude (°)", color="white")
    ax.set_title("Celestial Map · Planets along the Ecliptic", color="white", fontsize=13)
    ax.tick_params(colors="white")
    for spine in ax.spines.values():
        spine.set_edgecolor("#444444")
    st.pyplot(fig)
    plt.close(fig)

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
    ax.text(2, 2.2, "Navgraha", ha="center", va="center", fontsize=11, color="#CCCCCC")
    ax.text(2, 1.8, now.strftime("%d %b %Y"), ha="center", va="center",
            fontsize=9, color="#888888")

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
