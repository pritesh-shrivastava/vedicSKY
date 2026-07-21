# Agentic Jobs

This folder contains repo-owned scripts intended to be run by Hermes cron or
other agent/scheduler surfaces. Keep implementation code here; Hermes should
only own scheduling, delivery targets, and its own runtime config.

## Daily Panchang

`daily_panchang.py` prints a sunrise-based daily panchang summary to stdout:
sunrise, sunset, moonrise, moonset, vara, tithi, nakshatra, yoga, karana, and
Moon rashi. Tithi and nakshatra include local transition times and the next
value. Hermes delivers that stdout to Telegram.

Run manually from the repo root:

```bash
uv run --with pyswisseph --with pandas python agentic/daily_panchang.py
```

Run for a specific date:

```bash
uv run --with pyswisseph --with pandas python agentic/daily_panchang.py --date 2026-07-21
```

Defaults use the canonical Ujjain observer location from
`scripts/graha_positions_reference.py`:

- latitude: `23.1828`
- longitude: `75.7772`
- altitude: `500`
- timezone: `Asia/Kolkata`

Override location with environment variables:

```bash
PANCHANG_LAT=19.0760 \
PANCHANG_LON=72.8777 \
PANCHANG_ALT=14 \
PANCHANG_TZ=Asia/Kolkata \
uv run --with pyswisseph --with pandas python agentic/daily_panchang.py
```

Or pass CLI flags:

```bash
uv run --with pyswisseph --with pandas python agentic/daily_panchang.py \
  --lat 19.0760 --lon 72.8777 --alt 14 --tz Asia/Kolkata
```

## Daily Graha Ephemeris

`daily_ephemeris.py` prints a multi-day graha position table to stdout. It
defaults to today plus the next 5 days, with positions calculated at `09:00`
local time for each date.

Run manually from the repo root:

```bash
uv run --with pyswisseph --with pandas python agentic/daily_ephemeris.py
```

Run for a specific start date:

```bash
uv run --with pyswisseph --with pandas python agentic/daily_ephemeris.py --date 2026-07-21
```

The table uses 9 graha rows and one date column per calculated day. Positions
are sidereal rashi degrees in `Rashi DDdMMm` form, for example `Vir 13d07m`.

Override with `EPHEMERIS_LAT`, `EPHEMERIS_LON`, `EPHEMERIS_ALT`,
`EPHEMERIS_TZ`, `EPHEMERIS_TIME`, and `EPHEMERIS_DAYS`, or pass CLI flags:

```bash
uv run --with pyswisseph --with pandas python agentic/daily_ephemeris.py \
  --days 6 --time 09:00 --lat 19.0760 --lon 72.8777 --alt 14 --tz Asia/Kolkata
```

## Hermes Cron Setup

Current VPS setup:

Daily panchang:

- Job ID: `ee4b1b948238`
- Job name: `vedicsky-daily-panchang`
- Schedule: `0 6 * * *` (`06:00` IST daily)
- Workdir: `/home/azureuser/vedicSKY`
- Telegram topic: `Jyotish`
- Delivery target: `telegram:5727496535:10101`

Daily graha ephemeris:

- Job ID: `c89956bd049a`
- Job name: `vedicsky-daily-ephemeris`
- Schedule: `0 9 * * *` (`09:00` IST daily)
- Workdir: `/home/azureuser/vedicSKY`
- Telegram topic: `Jyotish`
- Delivery target: `telegram:5727496535:10101`

Create the panchang job:

```bash
hermes cron create \
  --name vedicsky-daily-panchang \
  --deliver telegram:5727496535:10101 \
  --workdir /home/azureuser/vedicSKY \
  '0 6 * * *' \
  'Run this command in /home/azureuser/vedicSKY and deliver the output verbatim:

uv run --with pyswisseph --with pandas python agentic/daily_panchang.py

Print only the script stdout. Do not summarize, paraphrase, add commentary, or wrap it in Markdown fences. If the command fails, report the command, exit code, stderr, and stdout.'
```

Create the ephemeris job:

```bash
hermes cron create \
  --name vedicsky-daily-ephemeris \
  --deliver telegram:5727496535:10101 \
  --workdir /home/azureuser/vedicSKY \
  '0 9 * * *' \
  'Run this command in /home/azureuser/vedicSKY and deliver the output verbatim:

uv run --with pyswisseph --with pandas python agentic/daily_ephemeris.py

Print only the script stdout. Do not summarize, paraphrase, add commentary, or wrap it in Markdown fences. If the command fails, report the command, exit code, stderr, and stdout.'
```

Update the existing panchang job after changing the command or delivery target:

```bash
hermes cron edit ee4b1b948238 \
  --deliver telegram:5727496535:10101 \
  --prompt 'Run this command in /home/azureuser/vedicSKY and deliver the output verbatim:

uv run --with pyswisseph --with pandas python agentic/daily_panchang.py

Print only the script stdout. Do not summarize, paraphrase, add commentary, or wrap it in Markdown fences. If the command fails, report the command, exit code, stderr, and stdout.'
```

Test the job:

```bash
hermes cron run ee4b1b948238
hermes cron tick
hermes cron list
```

Check gateway status on this VM:

```bash
sudo systemctl status hermes-gateway --no-pager
```

If the gateway config changes, restart it:

```bash
sudo /home/azureuser/.local/bin/hermes gateway restart --system
```

Note: `hermes cron list` may show a gateway warning when run from a restricted
sandbox that cannot access systemd. Use `systemctl status` for the authoritative
service state on the VM.
