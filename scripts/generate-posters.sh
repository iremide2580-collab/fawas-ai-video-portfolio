#!/usr/bin/env bash
# =============================================================================
# Extract a poster (thumbnail) frame from every video in assets/videos/
# and write it to assets/posters/<same-name>.jpg
#
# Usage:  ./scripts/generate-posters.sh
# Needs:  ffmpeg  (macOS: brew install ffmpeg · Ubuntu: sudo apt install ffmpeg)
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

VIDEO_DIR="assets/videos"
POSTER_DIR="assets/posters"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "✖ ffmpeg not found. Install it, then run this script again." >&2
  exit 1
fi

if [ ! -d "$VIDEO_DIR" ]; then
  echo "✖ $VIDEO_DIR does not exist yet. Add your MP4s there first." >&2
  exit 1
fi

mkdir -p "$POSTER_DIR"
count=0
shopt -s nullglob nocaseglob

for file in "$VIDEO_DIR"/*.mp4; do
  base="$(basename "${file%.*}")"
  out="$POSTER_DIR/$base.jpg"

  # Try 1s in (skips a black first frame), fall back to the very first frame.
  if ffmpeg -y -loglevel error -ss 1 -i "$file" -frames:v 1 \
      -vf "scale='min(1280,iw)':-2" -q:v 4 "$out" 2>/dev/null; then
    :
  else
    ffmpeg -y -loglevel error -i "$file" -frames:v 1 \
      -vf "scale='min(1280,iw)':-2" -q:v 4 "$out"
  fi

  echo "✔ $out"
  count=$((count + 1))
done

if [ "$count" -eq 0 ]; then
  echo "No .mp4 files found in $VIDEO_DIR."
else
  echo "Done — $count poster(s) written to $POSTER_DIR."
fi
