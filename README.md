# Mork Borg Character Reliquary

A lightweight web app for generating, editing, and storing Mork Borg character sheets.

## Run

1. Open `index.html` directly in your browser.
2. Optional local server:
   - `python3 -m http.server` (from this directory)
   - Open `http://localhost:8000`

## Features

- Gothic-themed responsive UI (desktop + mobile).
- Full character sheet editing.
- Random character generation.
- Local autosave with `localStorage`.
- Multiple saved characters with quick switching.
- Import and export character JSON files.

## Data Storage

Character sheets are stored locally in your browser using:

- `morkborg-reliquary.characters.v1`
- `morkborg-reliquary.active.v1`
