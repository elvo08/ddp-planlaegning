#!/usr/bin/env bash
# Kører tests/tests.html i en hovedløs Chrome og udskriver resultatet.
# Exit-kode 0 kun hvis alle tests er bestået.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
browser="/c/Program Files/Google/Chrome/Application/chrome.exe"
profile="$(cygpath -w "${TMPDIR:-/tmp}")\\ddp-tests-chrome"
url="file:///$(cygpath -m "$here/tests.html")"
out="$(timeout 60 "$browser" --headless --disable-gpu --no-first-run --user-data-dir="$profile" \
  --allow-file-access-from-files --virtual-time-budget=10000 --dump-dom "$url" 2>/dev/null)"
res="$(printf '%s' "$out" | sed -n '/<pre id="results">/,/<\/pre>/p' | sed 's/<[^>]*>//g')"
printf '%s\n' "$res"
printf '%s' "$res" | grep -q "TESTS BESTÅET"
