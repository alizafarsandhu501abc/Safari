"""
test_engine.py — Comprehensive unit tests for the MapReduce log analysis engine.

Tests cover:
  • splitter  — file splitting and edge cases
  • mapper    — regex parsing, status codes, hours, severity
  • shuffler  — grouping and alphabetical sort
  • reducer   — summing and categorisation
  • full pipeline end-to-end
"""

import os
import tempfile
from typing import List

import pytest

from mapreduce.engine.splitter import split_file
from mapreduce.engine.mapper import map_chunk, parallel_map
from mapreduce.engine.shuffler import shuffle_and_sort
from mapreduce.engine.reducer import reduce


# ---------------------------------------------------------------------------
# Sample log lines in Apache combined log format
# ---------------------------------------------------------------------------

SAMPLE_LINES: List[str] = [
    '192.168.1.1 - - [10/Oct/2023:14:32:15 +0000] "GET /api/data HTTP/1.1" 404 512 "-" "Mozilla/5.0"',
    '10.0.0.5 - frank [10/Oct/2023:14:33:00 +0000] "POST /submit HTTP/1.1" 200 1024 "http://example.com" "curl/7.68.0"',
    '172.16.0.2 - - [10/Oct/2023:08:12:44 +0000] "GET /index.html HTTP/1.1" 200 2048 "-" "Chrome/91.0"',
    '192.168.1.10 - admin [10/Oct/2023:23:59:59 +0000] "DELETE /api/user/42 HTTP/1.1" 500 128 "-" "PostmanRuntime/7.28"',
    '10.10.10.10 - - [10/Oct/2023:00:00:01 +0000] "GET /health HTTP/1.1" 200 64 "-" "kube-probe/1.21"',
    '192.168.1.1 - - [10/Oct/2023:14:35:22 +0000] "GET /missing HTTP/1.1" 404 256 "-" "Mozilla/5.0"',
    '10.0.0.1 - - [10/Oct/2023:09:15:30 +0000] "GET /dashboard HTTP/1.1" 301 0 "-" "Safari/605.1"',
    '10.0.0.1 - - [10/Oct/2023:09:15:31 +0000] "GET /dashboard/ HTTP/1.1" 200 4096 "-" "Safari/605.1"',
]

# A line containing an error-level keyword (e.g. from an error log merged in)
SEVERITY_LINE = (
    '10.0.0.1 - - [10/Oct/2023:12:00:00 +0000] '
    '"GET /ERROR/page HTTP/1.1" 503 0 "-" "Bot/1.0"'
)


# ===================================================================
# Helpers
# ===================================================================

def _write_temp_log(lines: List[str]) -> str:
    """Write *lines* to a temporary ``.log`` file and return its path."""
    tmp = tempfile.NamedTemporaryFile(
        mode="w", suffix=".log", delete=False, encoding="utf-8",
    )
    tmp.write("\n".join(lines) + "\n")
    tmp.close()
    return tmp.name


# ===================================================================
# Splitter tests
# ===================================================================

class TestSplitter:
    """Tests for :func:`engine.splitter.split_file`."""

    def test_basic_split(self):
        path = _write_temp_log(SAMPLE_LINES)
        try:
            chunks = split_file(path, chunk_size=3)
            # 8 lines / 3 = 3 chunks (3 + 3 + 2)
            assert len(chunks) == 3
            assert len(chunks[0]) == 3
            assert len(chunks[1]) == 3
            assert len(chunks[2]) == 2
        finally:
            os.unlink(path)

    def test_chunk_size_larger_than_file(self):
        path = _write_temp_log(SAMPLE_LINES)
        try:
            chunks = split_file(path, chunk_size=10000)
            assert len(chunks) == 1
            assert len(chunks[0]) == len(SAMPLE_LINES)
        finally:
            os.unlink(path)

    def test_chunk_size_equals_file(self):
        path = _write_temp_log(SAMPLE_LINES)
        try:
            chunks = split_file(path, chunk_size=len(SAMPLE_LINES))
            assert len(chunks) == 1
        finally:
            os.unlink(path)

    def test_empty_file(self):
        tmp = tempfile.NamedTemporaryFile(
            mode="w", suffix=".log", delete=False, encoding="utf-8",
        )
        tmp.close()
        try:
            chunks = split_file(tmp.name, chunk_size=100)
            assert chunks == []
        finally:
            os.unlink(tmp.name)

    def test_invalid_chunk_size(self):
        path = _write_temp_log(SAMPLE_LINES)
        try:
            with pytest.raises(ValueError):
                split_file(path, chunk_size=0)
        finally:
            os.unlink(path)

    def test_file_not_found(self):
        with pytest.raises(FileNotFoundError):
            split_file("/nonexistent/path/file.log")

    def test_single_line_file(self):
        path = _write_temp_log([SAMPLE_LINES[0]])
        try:
            chunks = split_file(path, chunk_size=5)
            assert len(chunks) == 1
            assert len(chunks[0]) == 1
        finally:
            os.unlink(path)


# ===================================================================
# Mapper tests
# ===================================================================

class TestMapper:
    """Tests for :func:`engine.mapper.map_chunk`."""

    def test_extracts_http_status(self):
        pairs = map_chunk([SAMPLE_LINES[0]])  # 404
        status_pairs = [p for p in pairs if p[0].startswith("HTTP_")]
        assert ("HTTP_404", 1) in status_pairs

    def test_extracts_hour(self):
        pairs = map_chunk([SAMPLE_LINES[0]])  # hour 14
        hour_pairs = [p for p in pairs if p[0].startswith("Hour_")]
        assert ("Hour_14", 1) in hour_pairs

    def test_multiple_lines(self):
        pairs = map_chunk(SAMPLE_LINES)
        http_keys = [p[0] for p in pairs if p[0].startswith("HTTP_")]
        # Should have one HTTP key per parseable line
        assert len(http_keys) == len(SAMPLE_LINES)
        # We expect 404 twice
        assert http_keys.count("HTTP_404") == 2

    def test_hour_range(self):
        pairs = map_chunk(SAMPLE_LINES)
        hours = {p[0] for p in pairs if p[0].startswith("Hour_")}
        # Lines include hours 14, 14, 08, 23, 00, 14, 09, 09
        assert "Hour_00" in hours
        assert "Hour_23" in hours
        assert "Hour_08" in hours
        assert "Hour_09" in hours

    def test_severity_detection(self):
        pairs = map_chunk([SEVERITY_LINE])
        sev_pairs = [p for p in pairs if p[0].startswith("Severity_")]
        assert len(sev_pairs) == 1
        assert sev_pairs[0][0] == "Severity_ERROR"

    def test_empty_lines_skipped(self):
        pairs = map_chunk(["", "   ", ""])
        assert pairs == []

    def test_non_matching_lines_skipped(self):
        pairs = map_chunk(["this is not a log line", "random text"])
        # No HTTP/Hour pairs should be emitted
        http_pairs = [p for p in pairs if p[0].startswith("HTTP_")]
        assert http_pairs == []

    def test_status_200(self):
        pairs = map_chunk([SAMPLE_LINES[1]])
        status_pairs = [p for p in pairs if p[0].startswith("HTTP_")]
        assert ("HTTP_200", 1) in status_pairs


class TestParallelMap:
    """Tests for :func:`engine.mapper.parallel_map`."""

    def test_parallel_map_basic(self):
        chunks = [SAMPLE_LINES[:4], SAMPLE_LINES[4:]]
        pairs = parallel_map(chunks, max_workers=2)
        # Should have results from all 8 lines
        http_pairs = [p for p in pairs if p[0].startswith("HTTP_")]
        assert len(http_pairs) == len(SAMPLE_LINES)

    def test_parallel_map_empty_chunks(self):
        pairs = parallel_map([], max_workers=2)
        assert pairs == []

    def test_parallel_map_single_chunk(self):
        pairs = parallel_map([SAMPLE_LINES], max_workers=1)
        http_pairs = [p for p in pairs if p[0].startswith("HTTP_")]
        assert len(http_pairs) == len(SAMPLE_LINES)


# ===================================================================
# Shuffler tests
# ===================================================================

class TestShuffler:
    """Tests for :func:`engine.shuffler.shuffle_and_sort`."""

    def test_groups_correctly(self):
        pairs = [("HTTP_404", 1), ("HTTP_200", 1), ("HTTP_404", 1)]
        result = shuffle_and_sort(pairs)
        assert result["HTTP_404"] == [1, 1]
        assert result["HTTP_200"] == [1]

    def test_keys_sorted_alphabetically(self):
        pairs = [("Z_key", 1), ("A_key", 1), ("M_key", 1)]
        result = shuffle_and_sort(pairs)
        keys = list(result.keys())
        assert keys == ["A_key", "M_key", "Z_key"]

    def test_empty_input(self):
        result = shuffle_and_sort([])
        assert result == {}

    def test_single_pair(self):
        result = shuffle_and_sort([("HTTP_200", 1)])
        assert result == {"HTTP_200": [1]}

    def test_mixed_key_types(self):
        pairs = [
            ("HTTP_200", 1),
            ("Hour_14", 1),
            ("HTTP_200", 1),
            ("Hour_14", 1),
            ("Severity_ERROR", 1),
        ]
        result = shuffle_and_sort(pairs)
        assert "HTTP_200" in result
        assert "Hour_14" in result
        assert "Severity_ERROR" in result
        assert result["HTTP_200"] == [1, 1]


# ===================================================================
# Reducer tests
# ===================================================================

class TestReducer:
    """Tests for :func:`engine.reducer.reduce`."""

    def test_sums_correctly(self):
        shuffled = {
            "HTTP_200": [1, 1, 1],
            "HTTP_404": [1, 1],
            "Hour_14": [1, 1, 1, 1],
        }
        results = reduce(shuffled)
        assert results["http_codes"]["HTTP_200"] == 3
        assert results["http_codes"]["HTTP_404"] == 2
        assert results["hourly_traffic"]["Hour_14"] == 4

    def test_summary_totals(self):
        shuffled = {
            "HTTP_200": [1, 1, 1],
            "HTTP_404": [1, 1],
            "HTTP_500": [1],
        }
        results = reduce(shuffled)
        assert results["summary"]["total_requests"] == 6
        # 404 (2) + 500 (1) = 3 errors
        assert results["summary"]["total_errors"] == 3

    def test_empty_input(self):
        results = reduce({})
        assert results["http_codes"] == {}
        assert results["hourly_traffic"] == {}
        assert results["summary"]["total_requests"] == 0
        assert results["summary"]["total_errors"] == 0

    def test_severity_category(self):
        shuffled = {
            "Severity_ERROR": [1, 1],
            "Severity_WARN": [1],
        }
        results = reduce(shuffled)
        assert results["severity"]["Severity_ERROR"] == 2
        assert results["severity"]["Severity_WARN"] == 1

    def test_no_errors(self):
        shuffled = {"HTTP_200": [1, 1, 1], "HTTP_301": [1]}
        results = reduce(shuffled)
        assert results["summary"]["total_errors"] == 0
        assert results["summary"]["total_requests"] == 4


# ===================================================================
# End-to-end pipeline test
# ===================================================================

class TestPipeline:
    """End-to-end test running the full MapReduce pipeline."""

    def test_full_pipeline(self):
        path = _write_temp_log(SAMPLE_LINES)
        try:
            # 1. Split
            chunks = split_file(path, chunk_size=4)
            assert len(chunks) == 2  # 8 lines / 4

            # 2. Map (single-threaded for test determinism)
            all_pairs = []
            for chunk in chunks:
                all_pairs.extend(map_chunk(chunk))

            http_pairs = [p for p in all_pairs if p[0].startswith("HTTP_")]
            assert len(http_pairs) == len(SAMPLE_LINES)

            # 3. Shuffle
            shuffled = shuffle_and_sort(all_pairs)
            assert "HTTP_404" in shuffled
            assert "HTTP_200" in shuffled

            # 4. Reduce
            results = reduce(shuffled)
            assert results["http_codes"]["HTTP_404"] == 2
            assert results["http_codes"]["HTTP_200"] == 4
            assert results["http_codes"]["HTTP_500"] == 1
            assert results["http_codes"]["HTTP_301"] == 1
            assert results["summary"]["total_requests"] == 8
            # Errors: 2 × 404 + 1 × 500 = 3
            assert results["summary"]["total_errors"] == 3
            # Hours
            assert "Hour_14" in results["hourly_traffic"]
        finally:
            os.unlink(path)

    def test_pipeline_with_severity(self):
        lines = SAMPLE_LINES + [SEVERITY_LINE]
        path = _write_temp_log(lines)
        try:
            chunks = split_file(path, chunk_size=100)
            all_pairs = map_chunk(chunks[0])
            shuffled = shuffle_and_sort(all_pairs)
            results = reduce(shuffled)
            assert "Severity_ERROR" in results["severity"]
            assert results["severity"]["Severity_ERROR"] == 1
        finally:
            os.unlink(path)
