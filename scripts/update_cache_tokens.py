#!/usr/bin/env python3
"""Inject build metadata into app shell asset references."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
INDEX_HTML = REPO_ROOT / "public" / "index.html"
APP_JS = REPO_ROOT / "public" / "app.js"
SW_JS = REPO_ROOT / "public" / "sw.js"


def replace_exactly_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.MULTILINE)
    if count != 1:
        raise ValueError(f"Expected 1 replacement for {label}, found {count}.")
    return updated


def update_index_html(token: str) -> None:
    text = INDEX_HTML.read_text(encoding="utf-8")
    text = replace_exactly_once(
        text,
        r"(theme-init\.js\?v=)[^\"]+",
        rf"\g<1>{token}",
        "index theme-init token",
    )
    text = replace_exactly_once(
        text,
        r"(styles\.css\?v=)[^\"]+",
        rf"\g<1>{token}",
        "index styles token",
    )
    text = replace_exactly_once(
        text,
        r"(app\.js\?v=)[^\"]+",
        rf"\g<1>{token}",
        "index app token",
    )
    INDEX_HTML.write_text(text, encoding="utf-8")


def update_app_js(token: str) -> None:
    text = APP_JS.read_text(encoding="utf-8")
    text = replace_exactly_once(
        text,
        r"(const DICE_MODULE_SCRIPT_SRC = \"dice\.js\?v=)[^\"]+(\";)",
        rf"\g<1>{token}\g<2>",
        "app dice token",
    )
    APP_JS.write_text(text, encoding="utf-8")


def update_app_version(version: str) -> None:
    text = APP_JS.read_text(encoding="utf-8")
    text = replace_exactly_once(
        text,
        r"(const APP_VERSION = \")[^\"]+(\";)",
        rf"\g<1>{version}\g<2>",
        "app version",
    )
    APP_JS.write_text(text, encoding="utf-8")


def update_sw_js(token: str) -> None:
    text = SW_JS.read_text(encoding="utf-8")
    text = replace_exactly_once(
        text,
        r"(const CACHE_VERSION = \")[^\"]+(\";)",
        rf"\g<1>{token}\g<2>",
        "service worker cache version",
    )
    text = replace_exactly_once(
        text,
        r"(\/theme-init\.js\?v=)[^\"]+",
        rf"\g<1>{token}",
        "service worker theme-init token",
    )
    text = replace_exactly_once(
        text,
        r"(\/styles\.css\?v=)[^\"]+",
        rf"\g<1>{token}",
        "service worker styles token",
    )
    text = replace_exactly_once(
        text,
        r"(\/app\.js\?v=)[^\"]+",
        rf"\g<1>{token}",
        "service worker app token",
    )
    text = replace_exactly_once(
        text,
        r"(\/dice\.js\?v=)[^\"]+",
        rf"\g<1>{token}",
        "service worker dice token",
    )
    SW_JS.write_text(text, encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--token",
        required=True,
        help="Cache token to inject into app-shell asset URLs and cache version.",
    )
    parser.add_argument(
        "--app-version",
        required=True,
        help="Resolved semantic version string (major.minor.patch) for footer rendering.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    token = args.token.strip()
    app_version = args.app_version.strip()
    if not token:
        print("Token must not be empty.", file=sys.stderr)
        return 2
    if not re.fullmatch(r"[A-Za-z0-9._-]+", token):
        print(
            "Token contains unsupported characters. Use only letters, numbers, dot, underscore, or dash.",
            file=sys.stderr,
        )
        return 2
    if not re.fullmatch(r"\d+\.\d+\.\d+", app_version):
        print("App version must match major.minor.patch using numeric segments.", file=sys.stderr)
        return 2

    update_index_html(token)
    update_app_js(token)
    update_app_version(app_version)
    update_sw_js(token)
    print(f"Updated cache token to: {token} and app version to: {app_version}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
