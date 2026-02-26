#!/usr/bin/env python3
"""Check vendored library versions against npm latest and emit a markdown report."""

from __future__ import annotations

import argparse
import datetime as dt
import glob
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import List, Optional, Tuple


@dataclass
class LibrarySpec:
    label: str
    package: str
    pattern: str
    version_regex: str


@dataclass
class CheckResult:
    label: str
    package: str
    local_file: Optional[str]
    current_version: Optional[str]
    latest_version: Optional[str]
    status: str
    note: str = ""


LIBRARIES: List[LibrarySpec] = [
    LibrarySpec(
        label="three.js",
        package="three",
        pattern="public/assets/vendor/three-*.module.js",
        version_regex=r"three-(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\.module\.js",
    ),
    LibrarySpec(
        label="cannon-es",
        package="cannon-es",
        pattern="public/assets/vendor/cannon-es-*.module.js",
        version_regex=r"cannon-es-(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\.module\.js",
    ),
    LibrarySpec(
        label="lucide",
        package="lucide",
        pattern="public/assets/vendor/lucide-*.min.js",
        version_regex=r"lucide-(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\.min\.js",
    ),
]


def parse_semver(value: str) -> Optional[Tuple[int, int, int, Tuple]]:
    match = re.match(r"^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$", value)
    if not match:
        return None
    major, minor, patch = (int(match.group(1)), int(match.group(2)), int(match.group(3)))
    prerelease = match.group(4)
    if not prerelease:
        pre_key = (1,)
    else:
        parts = []
        for token in prerelease.split("."):
            if token.isdigit():
                parts.append((0, int(token)))
            else:
                parts.append((1, token))
        pre_key = (0, tuple(parts))
    return (major, minor, patch, pre_key)


def compare_versions(left: str, right: str) -> Optional[int]:
    left_key = parse_semver(left)
    right_key = parse_semver(right)
    if left_key is None or right_key is None:
        return None
    if left_key < right_key:
        return -1
    if left_key > right_key:
        return 1
    return 0


def fetch_latest_version(package: str) -> str:
    quoted = urllib.parse.quote(package, safe="")
    url = f"https://registry.npmjs.org/{quoted}/latest"
    req = urllib.request.Request(url, headers={"User-Agent": "character-reliquary-vendor-check/1.0"})
    with urllib.request.urlopen(req, timeout=20) as response:
        payload = json.load(response)
    version = payload.get("version")
    if not isinstance(version, str) or not version.strip():
        raise ValueError(f"Missing version field for package '{package}'")
    return version.strip()


def choose_local_file(spec: LibrarySpec) -> Tuple[Optional[str], Optional[str]]:
    candidates = sorted(glob.glob(spec.pattern))
    if not candidates:
        return None, None

    best_file: Optional[str] = None
    best_version: Optional[str] = None
    best_key: Optional[Tuple[int, int, int, Tuple]] = None
    regex = re.compile(spec.version_regex)

    for file_path in candidates:
        name = os.path.basename(file_path)
        match = regex.fullmatch(name)
        if not match:
            continue
        version = match.group(1)
        semver = parse_semver(version)
        if semver is None:
            continue
        if best_key is None or semver > best_key:
            best_key = semver
            best_file = file_path
            best_version = version

    if best_file is None:
        return candidates[-1], None
    return best_file, best_version


def build_report(results: List[CheckResult]) -> str:
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# Vendor Dependency Check",
        "",
        f"Generated: {now}",
        "",
        "| Library | Local file | Current | Latest | Status |",
        "|---|---|---:|---:|---|",
    ]

    status_map = {
        "up_to_date": "Up to date",
        "outdated": "Update available",
        "missing_local": "Missing local file",
        "lookup_error": "Lookup failed",
        "version_parse_error": "Version parse failed",
    }

    for item in results:
        local_file = item.local_file or "—"
        current = item.current_version or "—"
        latest = item.latest_version or "—"
        status_text = status_map.get(item.status, item.status)
        if item.note:
            status_text = f"{status_text}: {item.note}"
        lines.append(f"| {item.label} | `{local_file}` | `{current}` | `{latest}` | {status_text} |")

    actionable = [r for r in results if r.status in {"outdated", "missing_local"}]
    errors = [r for r in results if r.status in {"lookup_error", "version_parse_error"}]

    if actionable:
        lines.extend(
            [
                "",
                "## Action Needed",
                "",
                "The following vendored libraries need attention:",
            ]
        )
        for item in actionable:
            lines.append(
                f"- `{item.label}` (`{item.current_version or 'missing'}` -> `{item.latest_version or 'unknown'}`)"
            )

    if errors:
        lines.extend(
            [
                "",
                "## Lookup Errors",
                "",
                "The checker could not confidently compare these libraries:",
            ]
        )
        for item in errors:
            lines.append(f"- `{item.label}`: {item.note or item.status}")

    if not actionable and not errors:
        lines.extend(["", "All vendored libraries are up to date."])

    return "\n".join(lines) + "\n"


def write_github_output(path: str, has_updates: bool, has_errors: bool, report_file: str) -> None:
    needs_attention = has_updates or has_errors
    with open(path, "a", encoding="utf-8") as fh:
        fh.write(f"has_updates={'true' if has_updates else 'false'}\n")
        fh.write(f"has_errors={'true' if has_errors else 'false'}\n")
        fh.write(f"needs_attention={'true' if needs_attention else 'false'}\n")
        fh.write(f"report_file={report_file}\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Check vendored dependency versions.")
    parser.add_argument(
        "--report-file",
        default="vendor-update-report.md",
        help="Path to markdown report output file",
    )
    parser.add_argument(
        "--github-output",
        default="",
        help="Optional path to GitHub Actions output file",
    )
    args = parser.parse_args()

    results: List[CheckResult] = []

    for spec in LIBRARIES:
        local_file, current = choose_local_file(spec)
        if not local_file:
            results.append(
                CheckResult(
                    label=spec.label,
                    package=spec.package,
                    local_file=None,
                    current_version=None,
                    latest_version=None,
                    status="missing_local",
                    note=f"No file matched {spec.pattern}",
                )
            )
            continue

        if not current:
            results.append(
                CheckResult(
                    label=spec.label,
                    package=spec.package,
                    local_file=local_file,
                    current_version=None,
                    latest_version=None,
                    status="version_parse_error",
                    note="Could not parse local version from filename",
                )
            )
            continue

        try:
            latest = fetch_latest_version(spec.package)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError) as exc:
            results.append(
                CheckResult(
                    label=spec.label,
                    package=spec.package,
                    local_file=local_file,
                    current_version=current,
                    latest_version=None,
                    status="lookup_error",
                    note=str(exc),
                )
            )
            continue

        cmp_result = compare_versions(current, latest)
        if cmp_result is None:
            status = "version_parse_error"
            note = "Unable to compare semver values"
        elif cmp_result < 0:
            status = "outdated"
            note = ""
        else:
            status = "up_to_date"
            note = ""

        results.append(
            CheckResult(
                label=spec.label,
                package=spec.package,
                local_file=local_file,
                current_version=current,
                latest_version=latest,
                status=status,
                note=note,
            )
        )

    report = build_report(results)
    with open(args.report_file, "w", encoding="utf-8") as fh:
        fh.write(report)

    has_updates = any(item.status in {"outdated", "missing_local"} for item in results)
    has_errors = any(item.status in {"lookup_error", "version_parse_error"} for item in results)

    if args.github_output:
        write_github_output(args.github_output, has_updates, has_errors, args.report_file)

    print(report, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
