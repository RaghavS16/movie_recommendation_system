# server/tmdb_retry.py
# Robust TMDB API caller with automatic retry + exponential backoff.
# Fixes: ConnectionResetError 10054, timeout, 429 rate-limit, 5xx server errors.
#
# Usage in any file:
#   from tmdb_retry import tmdb_get
#   data = tmdb_get("/search/movie", {"query": "theri"})

import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

TMDB_API_KEY  = os.getenv('TMDB_API_KEY')
TMDB_BASE_URL = "https://api.themoviedb.org/3"

# Errors we should retry on
_RETRYABLE = (
    requests.exceptions.ConnectionError,   # ConnectionResetError 10054 lives here
    requests.exceptions.Timeout,
    requests.exceptions.ChunkedEncodingError,
)


def tmdb_get(endpoint: str, params: dict = None, retries: int = 3, timeout: int = 8) -> dict:
    """
    Make a TMDB GET request with automatic retry on connection errors.

    Args:
        endpoint : TMDB path, e.g. "/search/movie"  (leading slash required)
        params   : dict of query params (api_key is added automatically)
        retries  : how many times to retry before giving up (default 3)
        timeout  : seconds to wait per attempt (default 8)

    Returns:
        Parsed JSON dict, or {} on total failure.

    Retry schedule:
        attempt 1 → immediate
        attempt 2 → wait 1 s
        attempt 3 → wait 2 s
        (doubles each time, capped at 4 s)
    """
    url    = f"{TMDB_BASE_URL}{endpoint}"
    params = dict(params or {})
    params["api_key"] = TMDB_API_KEY

    wait = 1  # seconds between retries

    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(url, params=params, timeout=timeout)

            # ── Rate limited (429) — wait the time TMDB tells us ──
            if resp.status_code == 429:
                retry_after = int(resp.headers.get("Retry-After", wait))
                print(f"⏳ TMDB rate-limited. Waiting {retry_after}s …")
                time.sleep(retry_after)
                continue

            # ── Server error (5xx) — retry ──
            if resp.status_code >= 500:
                print(f"⚠️  TMDB {resp.status_code} on attempt {attempt}. Retrying …")
                time.sleep(wait)
                wait = min(wait * 2, 4)
                continue

            # ── Any other non-200 (404, 401 …) — don't retry, return empty ──
            if resp.status_code != 200:
                print(f"⚠️  TMDB {resp.status_code} for {endpoint}")
                return {}

            return resp.json()

        except _RETRYABLE as e:
            # ConnectionResetError 10054 is a ConnectionError subclass
            err_name = type(e).__name__
            print(f"⚠️  TMDB {err_name} on attempt {attempt}/{retries}: {e}")
            if attempt < retries:
                print(f"   Retrying in {wait}s …")
                time.sleep(wait)
                wait = min(wait * 2, 4)
            else:
                print(f"   All {retries} attempts failed for {endpoint}.")
                return {}

        except Exception as e:
            # Unexpected error — log and give up immediately
            print(f"⚠️  TMDB unexpected error: {e}")
            return {}

    return {}