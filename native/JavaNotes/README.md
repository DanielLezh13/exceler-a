# Java Notes

A small, local-only Mac reference panel. This is a standalone native app, not an Apple desktop widget and not part of the assessment or grader.

Starts with one editable **Unit I Reference**: the Scanner/program wrapper once, followed by independent syntax examples for learned variables, input, output, arithmetic, casting, and updates. The examples are a reference collection, not one program to run. There are no explanation paragraphs under the note. Updating the app never automatically replaces existing saved notes.

## Use

- Open **Java Notes** in your user Applications folder.
- The pin keeps it above ordinary windows. Click it to unpin.
- **+** adds a snippet; the pencil edits it. Click **Save** to keep changes.
- Copy with the overlapping-sheets icon. Right-click a card to reorder or remove it.
- Search or filter by category as your collection grows. Categories are free-form.
- The **…** menu adjusts code size, opens the data folder, or hides/quits the app.
- Drag the title bar to move it; resize an edge to fit your workspace.
- Closing the window keeps the app running; click its Dock icon to reopen. It does not start at login automatically.

## Your data

Saved locally in `~/Library/Application Support/Java Notes/notes.json`. The previous complete collection is stored in `notes.backup.json` before each atomic save. The backup is one generation, not permanent version history. No account, network connection, or browser is used. Invalid existing files are not overwritten. Code whitespace, quotes, and line breaks are stored as entered.

## Build and verify

Requires macOS 14+ and Apple's command line developer tools. No package dependencies or full Xcode installation.

```sh
zsh native/JavaNotes/build.sh
open 'native/JavaNotes/build/Java Notes.app'
```

Build into a different directory by passing it as the first argument. Do not rebuild a running installed copy; quit the app first. The script compiles, locally signs, and runs isolated storage tests (add/edit/reload, exact code preservation, backup, order, deletion, empty state, corrupt-file protection). `--data-dir /absolute/test/directory` allows isolated UI checks.
