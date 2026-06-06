#!/usr/bin/env python3
"""
main.py — MapReduce Log Analysis CLI

Orchestrates the full pipeline:  Split → Map → Shuffle → Reduce
and writes a structured JSON report.
"""

import argparse
import json
import os
import time
from typing import Any, Dict

from complete_backend.mapreduce.engine.splitter import split_file
from complete_backend.mapreduce.engine.mapper import parallel_map
from complete_backend.mapreduce.engine.shuffler import shuffle_and_sort
from complete_backend.mapreduce.engine.reducer import reduce


def run_pipeline(
    input_path: str,
    workers: int = 4,
) -> Dict[str, Any]:
    """Execute the full MapReduce pipeline and return the report dict.

    Parameters
    ----------
    input_path : str
        Path to the input ``.log`` file.
    workers : int, optional
        Number of parallel worker processes (default 4).

    Returns
    -------
    dict[str, Any]
        A report dictionary containing metadata and analysis results.
    """
    start_time = time.perf_counter()

    # 1. Split
    chunks = split_file(input_path)
    total_lines = sum(len(chunk) for chunk in chunks)

    # 2. Map (parallel)
    mapped_pairs = parallel_map(chunks, max_workers=workers)

    # 3. Shuffle & Sort
    shuffled = shuffle_and_sort(mapped_pairs)

    # 4. Reduce
    results = reduce(shuffled)

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    report: Dict[str, Any] = {
        "metadata": {
            "filename": os.path.basename(input_path),
            "filepath": os.path.abspath(input_path),
            "total_lines": total_lines,
            "chunk_count": len(chunks),
            "worker_count": workers,
            "duration_ms": round(elapsed_ms, 2),
        },
        "results": results,
    }

    return report


def main() -> None:
    """CLI entry-point."""
    parser = argparse.ArgumentParser(
        description="MapReduce Log Analysis Engine — analyse Apache/Nginx logs",
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to the .log file to analyse",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="Number of parallel map workers (default: 4)",
    )
    parser.add_argument(
        "--output-json",
        required=True,
        help="Path for the JSON output report",
    )

    args = parser.parse_args()

    report = run_pipeline(args.input, workers=args.workers)

    # Write JSON report
    with open(args.output_json, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, ensure_ascii=False)

    print(f"Analysis complete in {report['metadata']['duration_ms']:.2f} ms")
    print(f"  Total lines processed : {report['metadata']['total_lines']}")
    print(f"  Total requests found  : {report['results']['summary']['total_requests']}")
    print(f"  Total errors (4xx/5xx): {report['results']['summary']['total_errors']}")
    print(f"  Report written to     : {args.output_json}")


if __name__ == "__main__":
    main()
