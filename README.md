# MORK BORG Character Reliquary

A lightweight web app for generating, editing, and storing MORK BORG character sheets.

## Run

1. Open `index.html` directly in your browser.
2. Optional local server:
   - `python3 -m http.server` (from this directory)
   - Open `http://localhost:8000`

## Features

- Gothic-themed responsive UI (desktop + mobile).
- Full character sheet editing.
- Classless-rules-based random character generation.
- Local autosave with `localStorage`.
- Multiple saved characters with quick switching.
- Import and export character JSON files.
- Expanded dropdown options for class, homeland, weapon, armor, and attack stat.
- Custom weapon and armor entries with editable `d` values.
- Powers/scroll tracking with visual checkbox trackers and a bottom quick-reference sheet.
- Expanded name variety in random generation.

## Rules Accuracy

The randomizer is aligned to baseline classless character creation:

- Ability modifiers generated from 3d6 rolls using the core modifier table.
- HP generated as `d8 + Toughness`, with minimum 1.
- Omens generated as `d2`.
- Silver generated as `2d6 x 10`.
- Inventory generated from classless loadout/gear tables, plus waterskin and food.
- Weapon and armor generated from classless weapon (`d10`) and armor (`d4`) tables, with reduced tables when a starting scroll appears in gear.

If you select a class other than `Classless Scvm`, class-specific starting rules may differ and should be adjusted manually.

## Anti-Crawl / Privacy

For GitHub Pages hosting, this project uses:

- Page-level noindex/noarchive meta tags in `index.html`.
- `robots.txt` with `Disallow: /`.

GitHub Pages does not let you set custom response headers like `X-Robots-Tag`, so meta tags and `robots.txt` are the enforceable controls here.

For strongest protection, host behind authentication and avoid public linking.

## Data Storage

Character sheets are stored locally in your browser using:

- `morkborg-reliquary.characters.v1`
- `morkborg-reliquary.active.v1`
