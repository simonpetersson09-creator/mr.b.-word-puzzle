#!/usr/bin/env bash
set -euo pipefail
if [[ "$(uname -s)" != "Darwin" ]] || ! command -v xcodebuild >/dev/null; then
  echo "Archive/export kräver macOS med Xcode, Apple Distribution-certifikat och appens provisioning profile." >&2
  exit 1
fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUTPUT="${IOS_OUTPUT_DIR:-${TMPDIR:-/tmp}/mrb-word-puzzle-release}"
ARCHIVE="$OUTPUT/MrBWordPuzzle.xcarchive"
mkdir -p "$OUTPUT"
if [[ "${1:-}" == "--export" ]]; then
  test -d "$ARCHIVE" || { echo "Skapa först arkivet med bun run native:archive:ios." >&2; exit 1; }
  xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportOptionsPlist ios/App/ExportOptions.plist -exportPath "$OUTPUT/export"
  echo "IPA för App Store Connect: $OUTPUT/export"
elif [[ $# == 0 ]]; then
  bun run native:sync:ios
  bun run native:verify:ios -- --release
  xcodebuild -resolvePackageDependencies -project ios/App/App.xcodeproj -scheme App
  xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath "$ARCHIVE" archive
  echo "Arkiv: $ARCHIVE (öppna i Xcode Organizer för Validate App / Distribute App)."
else
  echo "Använd utan argument för archive eller --export för IPA." >&2
  exit 1
fi