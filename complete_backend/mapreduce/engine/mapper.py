"""
mapper.py — Log Line Mapper

Parses Apache/Nginx combined-log-format lines and emits (key, value) pairs
for HTTP status codes, request hours, and severity/error levels.
"""

import re
from concurrent.futures import ProcessPoolExecutor
from typing import List, Tuple

# ---------------------------------------------------------------------------
# Apache / Nginx combined log format regex
# Example line:
#   192.168.1.1 - - [10/Oct/2023:14:32:15 +0000] "GET /api/data HTTP/1.1" 404 512 "-" "Mozilla/5.0"
#
# Fields captured:
#   1  remote_host
#   2  ident
#   3  remote_user
#   4  datetime string  (day/month/year:hour:min:sec tz)
#   5  request line     (method path protocol)
#   6  status code
#   7  body bytes
#   8  referer
#   9  user agent
# ---------------------------------------------------------------------------
_COMBINED_LOG_RE = re.compile(
    r'^(\S+)'                     # 1  remote host / IP
    r'\s+(\S+)'                   # 2  ident (usually "-")
    r'\s+(\S+)'                   # 3  remote user
    r'\s+\[([^\]]+)\]'            # 4  date/time
    r'\s+"([^"]*)"'               # 5  request line
    r'\s+(\d{3})'                 # 6  status code
    r'\s+(\S+)'                   # 7  body bytes (may be "-")
    r'(?:\s+"([^"]*)")?'          # 8  referer   (optional)
    r'(?:\s+"([^"]*)")?'          # 9  user agent (optional)
)

# Regex to pull the hour out of the datetime field
_HOUR_RE = re.compile(r':(\d{2}):\d{2}:\d{2}\s')

# Common severity keywords that may appear in the request path or log line
_SEVERITY_KEYWORDS = re.compile(
    r'\b(EMERG|ALERT|CRIT|ERROR|WARN(?:ING)?|NOTICE|INFO|DEBUG)\b',
    re.IGNORECASE,
)


def map_chunk(chunk: List[str]) -> List[Tuple[str, int]]:
    """Parse a list of log lines and emit ``(key, 1)`` pairs.

    Emitted key families
    --------------------
    * ``HTTP_<status>``  — one pair per successfully parsed line.
    * ``Hour_<HH>``      — one pair per successfully parsed line.
    * ``Severity_<LVL>`` — one pair per detected severity keyword.

    Lines that do not match the combined-log regex are silently skipped.

    Parameters
    ----------
    chunk : list[str]
        A list of raw log-line strings.

    Returns
    -------
    list[tuple[str, int]]
        Emitted (key, value) pairs.
    """
    pairs: List[Tuple[str, int]] = []

    for line in chunk:
        if not line or not line.strip():
            continue

        match = _COMBINED_LOG_RE.match(line)
        if match:
            # --- HTTP status code ---
            status_code = match.group(6)
            pairs.append((f"HTTP_{status_code}", 1))

            # --- Hour of request ---
            datetime_str = match.group(4)
            hour_match = _HOUR_RE.search(datetime_str)
            if hour_match:
                hour = hour_match.group(1)
                pairs.append((f"Hour_{hour}", 1))

        # --- Severity / error level (may appear anywhere in the line) ---
        sev_match = _SEVERITY_KEYWORDS.search(line)
        if sev_match:
            severity = sev_match.group(1).upper()
            # Normalise WARNING → WARN for consistency
            if severity == "WARNING":
                severity = "WARN"
            pairs.append((f"Severity_{severity}", 1))

    return pairs


def parallel_map(
    chunks: List[List[str]],
    max_workers: int = 4,
) -> List[Tuple[str, int]]:
    """Map all chunks in parallel using a process pool.

    Parameters
    ----------
    chunks : list[list[str]]
        The list of log-line chunks produced by :func:`splitter.split_file`.
    max_workers : int, optional
        Maximum number of worker processes (default 4).

    Returns
    -------
    list[tuple[str, int]]
        A flat list of all ``(key, value)`` pairs from every chunk.
    """
    if not chunks:
        return []

    all_pairs: List[Tuple[str, int]] = []

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = executor.map(map_chunk, chunks)
        for result in futures:
            all_pairs.extend(result)

    return all_pairs
