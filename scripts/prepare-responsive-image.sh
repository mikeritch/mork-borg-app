#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Prepare mobile and desktop responsive WebP image variants using macOS sips + cwebp.

Usage:
  scripts/prepare-responsive-image.sh --input <file> [options]

Options:
  -i, --input <file>         Source image file (required)
  -m, --mobile <px>          Max pixel size for mobile variant (default: 900)
  -d, --desktop <px>         Max pixel size for desktop variant (default: 1800)
  -o, --output-dir <dir>     Output directory (default: source file directory)
  -b, --base-name <name>     Output file base name (default: source file base name)
  -q, --quality <0-100>      WebP quality (default: 82)
  -h, --help                 Show this help

Examples:
  scripts/prepare-responsive-image.sh --input assets/logos/CRBanner.png
  scripts/prepare-responsive-image.sh --input assets/logos/CRBanner.png --mobile 800 --desktop 2000 --quality 85
EOF
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
}

to_lower() {
  printf "%s" "$1" | tr '[:upper:]' '[:lower:]'
}

file_dims() {
  local file="$1"
  local width
  width="$(sips -g pixelWidth "$file" | awk '/pixelWidth/ {print $2}')"
  local height
  height="$(sips -g pixelHeight "$file" | awk '/pixelHeight/ {print $2}')"
  printf "%sx%s" "$width" "$height"
}

mime_for_ext() {
  case "$1" in
    webp) printf "image/webp" ;;
    png) printf "image/png" ;;
    jpg|jpeg) printf "image/jpeg" ;;
    *) printf "image/*" ;;
  esac
}

INPUT=""
MOBILE_MAX=900
DESKTOP_MAX=1800
OUTPUT_DIR=""
BASE_NAME=""
WEBP_QUALITY=82

while [[ $# -gt 0 ]]; do
  case "$1" in
    -i|--input)
      INPUT="${2:-}"
      shift 2
      ;;
    -m|--mobile)
      MOBILE_MAX="${2:-}"
      shift 2
      ;;
    -d|--desktop)
      DESKTOP_MAX="${2:-}"
      shift 2
      ;;
    -o|--output-dir)
      OUTPUT_DIR="${2:-}"
      shift 2
      ;;
    -b|--base-name)
      BASE_NAME="${2:-}"
      shift 2
      ;;
    -q|--quality)
      WEBP_QUALITY="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

require_command sips
require_command cwebp

if [[ -z "$INPUT" ]]; then
  echo "--input is required" >&2
  usage
  exit 1
fi

if [[ ! -f "$INPUT" ]]; then
  echo "Input file not found: $INPUT" >&2
  exit 1
fi

if ! [[ "$MOBILE_MAX" =~ ^[0-9]+$ ]] || ! [[ "$DESKTOP_MAX" =~ ^[0-9]+$ ]]; then
  echo "--mobile and --desktop must be whole numbers" >&2
  exit 1
fi

if ! [[ "$WEBP_QUALITY" =~ ^[0-9]+$ ]] || (( WEBP_QUALITY < 0 || WEBP_QUALITY > 100 )); then
  echo "--quality must be a whole number between 0 and 100" >&2
  exit 1
fi

INPUT_DIR="$(cd "$(dirname "$INPUT")" && pwd)"
INPUT_FILE="$(basename "$INPUT")"
INPUT_BASE="${INPUT_FILE%.*}"

if [[ -z "$OUTPUT_DIR" ]]; then
  OUTPUT_DIR="$INPUT_DIR"
fi
mkdir -p "$OUTPUT_DIR"
OUTPUT_DIR="$(cd "$OUTPUT_DIR" && pwd)"

if [[ -z "$BASE_NAME" ]]; then
  BASE_NAME="$INPUT_BASE"
fi

TARGET_EXT="webp"

resize_variant() {
  local label="$1"
  local max_size="$2"
  local out_file="${OUTPUT_DIR}/${BASE_NAME}-${label}.${TARGET_EXT}"
  local tmp_png
  tmp_png="$(mktemp "/tmp/${BASE_NAME}-${label}.XXXXXX.png")"
  sips -Z "$max_size" "$INPUT" --out "$tmp_png" >/dev/null
  cwebp -quiet -q "$WEBP_QUALITY" "$tmp_png" -o "$out_file" >/dev/null
  rm -f "$tmp_png"
  printf "%s" "$out_file"
}

MOBILE_OUT="$(resize_variant mobile "$MOBILE_MAX")"
DESKTOP_OUT="$(resize_variant desktop "$DESKTOP_MAX")"

MOBILE_DIMS="$(file_dims "$MOBILE_OUT")"
DESKTOP_DIMS="$(file_dims "$DESKTOP_OUT")"
MOBILE_WIDTH="${MOBILE_DIMS%x*}"
DESKTOP_WIDTH="${DESKTOP_DIMS%x*}"
MIME_TYPE="$(mime_for_ext "$TARGET_EXT")"

echo "Created:"
echo "  $MOBILE_OUT ($MOBILE_DIMS)"
echo "  $DESKTOP_OUT ($DESKTOP_DIMS)"
echo
echo "Responsive snippet:"
cat <<EOF
<picture>
  <source srcset="${DESKTOP_OUT} ${DESKTOP_WIDTH}w, ${MOBILE_OUT} ${MOBILE_WIDTH}w" type="${MIME_TYPE}" />
  <img src="${DESKTOP_OUT}" alt="Describe the image" loading="lazy" decoding="async" sizes="(max-width: 700px) 100vw, ${DESKTOP_WIDTH}px" />
</picture>
EOF
