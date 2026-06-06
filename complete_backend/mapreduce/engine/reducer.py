"""
reducer.py — Reduce Phase

Aggregates shuffled data by summing values for each key and categorises
the results into HTTP errors, hourly traffic, and a summary.
"""

from typing import Any, Dict, List


def reduce(shuffled_data: Dict[str, List[int]]) -> Dict[str, Any]:
    """Sum values for every key and categorise the results.

    Parameters
    ----------
    shuffled_data : dict[str, list[int]]
        Output of :func:`shuffler.shuffle_and_sort`.

    Returns
    -------
    dict[str, Any]
        A dictionary with three top-level sections:

        * ``http_codes``      — ``{ 'HTTP_200': N, … }``
        * ``hourly_traffic``  — ``{ 'Hour_00': N, … }``
        * ``severity``        — ``{ 'Severity_ERROR': N, … }``
        * ``summary``         — ``{ 'total_requests': N, 'total_errors': N }``

        Where *total_requests* counts all HTTP code occurrences and
        *total_errors* counts 4xx and 5xx status codes.
    """
    # First pass: sum every key
    summed: Dict[str, int] = {
        key: sum(values) for key, values in shuffled_data.items()
    }

    # Categorise
    http_codes: Dict[str, int] = {}
    hourly_traffic: Dict[str, int] = {}
    severity: Dict[str, int] = {}

    for key, total in sorted(summed.items()):
        if key.startswith("HTTP_"):
            http_codes[key] = total
        elif key.startswith("Hour_"):
            hourly_traffic[key] = total
        elif key.startswith("Severity_"):
            severity[key] = total

    # Summary statistics
    total_requests = sum(http_codes.values())
    total_errors = sum(
        count
        for code, count in http_codes.items()
        if code.startswith("HTTP_4") or code.startswith("HTTP_5")
    )

    results: Dict[str, Any] = {
        "http_codes": http_codes,
        "hourly_traffic": hourly_traffic,
        "severity": severity,
        "summary": {
            "total_requests": total_requests,
            "total_errors": total_errors,
        },
    }

    return results
