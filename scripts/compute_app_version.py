#!/usr/bin/env python3
"""Compute app version as major.minor.patch from version.json + git history."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def run_git(args: list[str]) -> str:
    completed = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return completed.stdout.strip()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--config",
        default="version.json",
        help="Path (relative to repo root) to JSON file with major/minor keys.",
    )
    parser.add_argument(
        "--github-output",
        default="",
        help="Optional path to write GitHub Actions outputs.",
    )
    return parser.parse_args()


def read_major_minor(config_path: Path) -> tuple[int, int]:
    payload = json.loads(config_path.read_text(encoding="utf-8"))
    major = payload.get("major")
    minor = payload.get("minor")
    if not isinstance(major, int) or major < 0:
        raise ValueError("version major must be a non-negative integer.")
    if not isinstance(minor, int) or minor < 0:
        raise ValueError("version minor must be a non-negative integer.")
    return major, minor


def main() -> int:
    args = parse_args()
    config_path = (REPO_ROOT / args.config).resolve()
    try:
        relative_config = config_path.relative_to(REPO_ROOT)
    except ValueError:
        print("Version config must be inside the repository.", file=sys.stderr)
        return 2
    if not config_path.exists():
        print(f"Missing version config: {relative_config}", file=sys.stderr)
        return 2

    try:
        major, minor = read_major_minor(config_path)
        base_sha = run_git(["log", "-n", "1", "--format=%H", "--", str(relative_config)])
        if not base_sha:
            raise ValueError(f"Could not determine last commit for {relative_config}.")
        patch_raw = run_git(["rev-list", "--count", f"{base_sha}..HEAD"])
        patch = int(patch_raw)
        if patch < 0:
            raise ValueError("Patch version cannot be negative.")
    except (subprocess.CalledProcessError, ValueError, json.JSONDecodeError) as error:
        print(f"Failed to compute app version: {error}", file=sys.stderr)
        return 2

    version = f"{major}.{minor}.{patch}"
    print(version)

    if args.github_output:
        output_path = Path(args.github_output)
        with output_path.open("a", encoding="utf-8") as handle:
            handle.write(f"version={version}\n")
            handle.write(f"major={major}\n")
            handle.write(f"minor={minor}\n")
            handle.write(f"patch={patch}\n")
            handle.write(f"base_sha={base_sha}\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
