"""
splitter.py — Log File Splitter

Reads a .log file and splits it into chunks of lines for parallel
processing in the MapReduce pipeline.
"""

from typing import List


def split_file(filepath: str, chunk_size: int = 1000) -> List[List[str]]:
    """Read a log file and split it into chunks of ``chunk_size`` lines.

    Parameters
    ----------
    filepath : str
        Path to the ``.log`` file to read.
    chunk_size : int, optional
        Maximum number of lines per chunk (default 1000).

    Returns
    -------
    list[list[str]]
        A list of chunks, where each chunk is a list of log-line strings.
        Trailing newlines are stripped from every line.

    Raises
    ------
    FileNotFoundError
        If *filepath* does not exist.
    ValueError
        If *chunk_size* is less than 1.
    """
    if chunk_size < 1:
        raise ValueError("chunk_size must be >= 1")

    with open(filepath, "r", encoding="utf-8") as fh:
        lines = fh.readlines()

    # Strip trailing newline / whitespace from each line
    lines = [line.rstrip("\n\r") for line in lines]

    # Remove completely empty trailing lines that result from a final newline
    # but keep intentional blank lines inside the file.
    if not lines:
        return []

    # Build chunks
    chunks: List[List[str]] = []
    for start in range(0, len(lines), chunk_size):
        chunk = lines[start : start + chunk_size]
        # Skip chunks that are entirely empty strings (edge-case guard)
        if any(line for line in chunk):
            chunks.append(chunk)

    return chunks
