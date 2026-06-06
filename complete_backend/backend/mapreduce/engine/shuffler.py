"""
shuffler.py — Shuffle & Sort Phase

Groups (key, value) pairs by key and sorts keys alphabetically.
"""

from collections import defaultdict
from typing import Dict, List, Tuple


def shuffle_and_sort(
    mapped_pairs: List[Tuple[str, int]],
) -> Dict[str, List[int]]:
    """Group mapped pairs by key and sort the keys alphabetically.

    Parameters
    ----------
    mapped_pairs : list[tuple[str, int]]
        Flat list of ``(key, value)`` pairs emitted by the mapper(s).

    Returns
    -------
    dict[str, list[int]]
        A dictionary whose keys are sorted alphabetically.  Each value is
        the list of integers associated with that key.

    Example
    -------
    >>> shuffle_and_sort([('HTTP_404', 1), ('HTTP_200', 1), ('HTTP_404', 1)])
    {'HTTP_200': [1], 'HTTP_404': [1, 1]}
    """
    groups: Dict[str, List[int]] = defaultdict(list)

    for key, value in mapped_pairs:
        groups[key].append(value)

    # Return a plain dict with keys in sorted order
    return dict(sorted(groups.items()))
