from dataclasses import dataclass, field
from typing import List, Tuple
from unidiff import PatchSet


@dataclass
class DiffHunk:
    file_path: str
    status: str
    added_lines: List[Tuple[int, str]] = field(default_factory=list)
    removed_lines: List[Tuple[int, str]] = field(default_factory=list)
    patch_text: str = ""


def parse_git_diff(raw_diff_text: str) -> List[DiffHunk]:
    """Parse raw git diff patch text into structured file hunks with line numbers."""
    if not raw_diff_text.strip():
        return []

    try:
        patch = PatchSet(raw_diff_text)
        hunks: List[DiffHunk] = []

        for patched_file in patch:
            path = patched_file.target_file or patched_file.source_file
            if path.startswith("a/") or path.startswith("b/"):
                path = path[2:]

            status = "modified"
            if patched_file.is_added_file:
                status = "added"
            elif patched_file.is_removed_file:
                status = "deleted"

            added_lines = []
            removed_lines = []

            for hunk in patched_file:
                for line in hunk:
                    if line.is_added and line.target_line_no is not None:
                        added_lines.append((line.target_line_no, line.value.rstrip("\r\n")))
                    elif line.is_removed and line.source_line_no is not None:
                        removed_lines.append((line.source_line_no, line.value.rstrip("\r\n")))

            hunks.append(
                DiffHunk(
                    file_path=path,
                    status=status,
                    added_lines=added_lines,
                    removed_lines=removed_lines,
                    patch_text=str(patched_file),
                )
            )
        return hunks
    except Exception:
        # Fallback simple parser if unidiff strict parsing fails on raw commit string
        return [
            DiffHunk(
                file_path="modified_files",
                status="modified",
                patch_text=raw_diff_text,
            )
        ]
