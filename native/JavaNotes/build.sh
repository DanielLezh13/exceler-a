#!/bin/zsh
set -euo pipefail
project_dir="${0:A:h}"
output_dir="${1:-$project_dir/build}"
app_dir="$output_dir/Java Notes.app"
mkdir -p "$app_dir/Contents/MacOS" "$app_dir/Contents/Resources"
xcrun swiftc -swift-version 5 -O -framework AppKit -framework SwiftUI \
    "$project_dir/NotesStore.swift" "$project_dir/JavaNotes.swift" \
    -o "$app_dir/Contents/MacOS/JavaNotes"
cp "$project_dir/Info.plist" "$app_dir/Contents/Info.plist"
xcrun swift "$project_dir/GenerateIcon.swift" "$output_dir/JavaNotes.iconset"
iconutil -c icns "$output_dir/JavaNotes.iconset" -o "$app_dir/Contents/Resources/JavaNotes.icns"
codesign --force --sign - "$app_dir"
"$app_dir/Contents/MacOS/JavaNotes" --self-test
print "Built: $app_dir"
