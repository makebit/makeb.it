#!/usr/bin/env bash
#
# optimize-images.sh — compress the source images into optimized WebP files.
#
# - Reads every image from assets/img-originals/ (the untouched source of truth)
#   and writes an optimized .webp into assets/img/, preserving the subfolder
#   layout. The originals are only read, never modified.
# - Large images are capped at MAX_WIDTH px (smaller images keep their size).
# - Re-running is safe: it skips images whose .webp is newer than the source.
#
# Requires ImageMagick (`magick`).

set -euo pipefail

# Resolve paths relative to the repo root (parent of this script's dir).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SRC_DIR="$ROOT_DIR/assets/img-originals"   # source images (read-only)
OUT_DIR="$ROOT_DIR/assets/img"             # optimized .webp output

MAX_WIDTH=1200      # cap the image width at this many px (never upscales)
QUALITY=80          # WebP quality (0-100); 80 is a good size/quality balance

if ! command -v magick >/dev/null 2>&1; then
	echo "Error: ImageMagick (magick) is not installed." >&2
	exit 1
fi

if [[ ! -d "$SRC_DIR" ]]; then
	echo "Error: source directory not found: $SRC_DIR" >&2
	exit 1
fi

total_before=0
total_after=0

# Find all raster source images under assets/img-originals/.
while IFS= read -r -d '' src; do
	rel="${src#"$SRC_DIR"/}"                 # path relative to img-originals
	dest="$OUT_DIR/${rel%.*}.webp"           # mirror path in assets/img, as .webp

	# Skip if an up-to-date webp already exists.
	if [[ -f "$dest" && "$dest" -nt "$src" ]]; then
		echo "skip   $rel (webp up to date)"
		continue
	fi

	mkdir -p "$(dirname "$dest")"

	before=$(stat -c%s "$src")

	# Only downscale when wider than MAX_WIDTH; never upscale (the '>' flag).
	magick "$src" \
		-resize "${MAX_WIDTH}x>" \
		-strip \
		-quality "$QUALITY" \
		"$dest"

	after=$(stat -c%s "$dest")
	total_before=$((total_before + before))
	total_after=$((total_after + after))

	printf 'ok     %s  %s -> %s\n' "$rel" \
		"$(numfmt --to=iec "$before")" "$(numfmt --to=iec "$after")"
done < <(find "$SRC_DIR" -type f \
	\( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.gif' \) \
	-print0)

echo "----------------------------------------"
echo "Source: $SRC_DIR"
echo "Output: $OUT_DIR"
if (( total_before > 0 )); then
	printf 'Compressed: %s -> %s (saved %s)\n' \
		"$(numfmt --to=iec "$total_before")" \
		"$(numfmt --to=iec "$total_after")" \
		"$(numfmt --to=iec "$((total_before - total_after))")"
fi
