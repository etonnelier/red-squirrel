#!/usr/bin/env bash
# Wraps `next dev`, watches stdout for the "Ready in" line, then opens the
# Local URL advertised in the preceding banner.
#
# Override port with PORT env var. Pass extra flags via NEXT_FLAGS.

set -uo pipefail

PORT="${PORT:-4115}"
URL=""

strip_ansi() { printf '%s' "$1" | sed -E $'s/\x1b\\[[0-9;]*[a-zA-Z]//g'; }

open_url() {
  local u="$1"
  if   command -v open     >/dev/null 2>&1; then open "$u"      >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$u"  >/dev/null 2>&1 || true
  elif command -v cygstart >/dev/null 2>&1; then cygstart "$u" >/dev/null 2>&1 || true
  elif command -v cmd      >/dev/null 2>&1; then cmd /c start "" "$u" >/dev/null 2>&1 || true
  fi
}

next dev -p "$PORT" ${NEXT_FLAGS:-} 2>&1 | while IFS= read -r raw; do
  printf '%s\n' "$raw"
  line=$(strip_ansi "$raw")

  if [[ -z "$URL" && "$line" =~ Local:[[:space:]]+(https?://[^[:space:]]+) ]]; then
    URL="${BASH_REMATCH[1]}"
  fi

  if [[ "$line" == *"Ready in"* && -n "$URL" ]]; then
    open_url "$URL" &
    URL=""
  fi
done
