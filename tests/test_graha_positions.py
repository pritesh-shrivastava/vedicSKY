import pytest
pytest.importorskip("swisseph")  # skip early if swisseph C bindings not available

from datetime import datetime
from zoneinfo import ZoneInfo
import pandas as pd

from graha_positions_reference import (
    calculate_graha_positions_for_local_dt,
    GRAHA_TESTS,
    DEFAULT_LOCATION,
    GRAHAS,
)


def _make_local_dt(date_str: str, time_str: str, tzname: str) -> datetime:
    y, m, d = map(int, date_str.split("-"))
    h, mi, s = map(int, time_str.split(":"))
    tz = ZoneInfo(tzname)
    return datetime(y, m, d, h, mi, s, tzinfo=tz)


@pytest.mark.parametrize("test_case", GRAHA_TESTS)
def test_expected_grahas_match(test_case):
    """For each test case in GRAHA_TESTS, compute graha positions and assert expected rashi/nakshatra."""
    loc = test_case.get("location", DEFAULT_LOCATION)
    tzname = loc.get("timezone", DEFAULT_LOCATION["timezone"])
    time_str = test_case.get("time", "00:00:00")
    local_dt = _make_local_dt(test_case["date"], time_str, tzname)

    df = calculate_graha_positions_for_local_dt(local_dt, loc)
    assert isinstance(df, pd.DataFrame)
    # index by graha for easy lookup
    df_indexed = df.set_index("graha")

    for graha, expected in test_case["expected"].items():
        assert graha in df_indexed.index, f"{graha} not found in computed rows"
        row = df_indexed.loc[graha]
        assert row["rashi_en"] == expected["rashi"], (
            f"{graha} rashi mismatch: got {row['rashi_en']} expected {expected['rashi']}"
        )
        assert row["nakshatra_en"] == expected["nakshatra"], (
            f"{graha} nakshatra mismatch: got {row['nakshatra_en']} expected {expected['nakshatra']}"
        )


def test_dataframe_shape_and_columns_smoke():
    """Smoke test: DataFrame returns one row per graha and contains key columns."""
    test_case = GRAHA_TESTS[0]
    loc = test_case.get("location", DEFAULT_LOCATION)
    tzname = loc.get("timezone", DEFAULT_LOCATION["timezone"])
    time_str = test_case.get("time", "00:00:00")
    local_dt = _make_local_dt(test_case["date"], time_str, tzname)

    df = calculate_graha_positions_for_local_dt(local_dt, loc)

    assert len(df) == len(GRAHAS)
    for col in ("graha", "rashi_en", "nakshatra_en", "sidereal_lon", "tropical_lon"):
        assert col in df.columns
