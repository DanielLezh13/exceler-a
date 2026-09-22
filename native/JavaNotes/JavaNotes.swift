import AppKit
import SwiftUI

private let accent = Color(red: 0.56, green: 0.86, blue: 0.72)

// A plain-code editor: no smart quotes, autocorrect, or automatic substitutions.
struct CodeEditor: NSViewRepresentable {
    @Binding var text: String
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    func makeNSView(context: Context) -> NSScrollView {
        let scroll = NSScrollView()
        scroll.hasVerticalScroller = true
        scroll.borderType = .noBorder
        let editor = NSTextView()
        editor.isRichText = false
        editor.isAutomaticQuoteSubstitutionEnabled = false
        editor.isAutomaticDashSubstitutionEnabled = false
        editor.isAutomaticTextReplacementEnabled = false
        editor.isAutomaticSpellingCorrectionEnabled = false
        editor.isContinuousSpellCheckingEnabled = false
        editor.isGrammarCheckingEnabled = false
        editor.isAutomaticLinkDetectionEnabled = false
        editor.allowsUndo = true
        editor.font = .monospacedSystemFont(ofSize: 13, weight: .regular)
        editor.textColor = .labelColor
        editor.backgroundColor = NSColor(white: 0.09, alpha: 1)
        editor.textContainerInset = NSSize(width: 12, height: 12)
        editor.isVerticallyResizable = true
        editor.isHorizontallyResizable = false
        editor.autoresizingMask = [.width]
        editor.textContainer?.widthTracksTextView = true
        editor.setAccessibilityLabel("Java code")
        editor.string = text
        editor.delegate = context.coordinator
        scroll.documentView = editor
        return scroll
    }
    func updateNSView(_ view: NSScrollView, context: Context) {
        context.coordinator.parent = self
        guard let editor = view.documentView as? NSTextView else { return }
        if editor.string != text { editor.string = text }
    }
    final class Coordinator: NSObject, NSTextViewDelegate {
        var parent: CodeEditor
        init(_ parent: CodeEditor) { self.parent = parent }
        func textDidChange(_ notification: Notification) {
            guard let editor = notification.object as? NSTextView else { return }
            parent.text = editor.string
        }
    }
}

private func coloredJava(_ code: String) -> AttributedString {
    let result = NSMutableAttributedString(string: code, attributes: [
        .font: NSFont.monospacedSystemFont(ofSize: 12, weight: .regular),
        .foregroundColor: NSColor(white: 0.87, alpha: 1)
    ])
    // Display-only coloring; never parses, changes, or grades the user's code.
    let patterns: [(String, NSColor)] = [
        (#"\b(import|public|class|static|void|new|int|double|boolean|char|true|false|if|else|for|while|return)\b"#, .systemPink),
        (#"\b(String|Scanner|System|Main)\b"#, .systemTeal),
        (#"\b\d+(?:\.\d+)?\b"#, .systemOrange),
        (#""(?:\\.|[^"\\])*""#, NSColor(red: 0.67, green: 0.84, blue: 0.53, alpha: 1)),
        (#"//[^\n]*"#, .secondaryLabelColor)
    ]
    for (pattern, color) in patterns {
        guard let regex = try? NSRegularExpression(pattern: pattern) else { continue }
        for match in regex.matches(in: code, range: NSRange(location: 0, length: (code as NSString).length)) {
            result.addAttribute(.foregroundColor, value: color, range: match.range)
        }
    }
    return AttributedString(result)
}

struct SnippetEditor: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var store: NotesStore
    @State var draft: Snippet
    let isNew: Bool
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(isNew ? "New snippet" : "Edit snippet").font(.title2.weight(.semibold))
            TextField("Title", text: $draft.title).accessibilityLabel("Snippet title")
            TextField("Category — e.g. Input, Loops", text: $draft.category).accessibilityLabel("Category")
            CodeEditor(text: $draft.code).frame(minHeight: 220).clipShape(RoundedRectangle(cornerRadius: 8))
            HStack {
                Spacer()
                Button("Cancel") { dismiss() }.keyboardShortcut(.cancelAction)
                Button("Save") {
                    draft.title = draft.title.trimmingCharacters(in: .whitespacesAndNewlines)
                    draft.category = draft.category.trimmingCharacters(in: .whitespacesAndNewlines)
                    if draft.category.isEmpty { draft.category = "My notes" }
                    if store.save(draft) { dismiss() }
                }
                .keyboardShortcut(.defaultAction)
                .disabled(draft.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .textFieldStyle(.roundedBorder)
        .padding(22).frame(width: 430, height: 520)
        .preferredColorScheme(.dark)
        .alert("Couldn’t save your notes", isPresented: Binding(
            get: { store.errorMessage != nil }, set: { if !$0 { store.errorMessage = nil } }
        )) { Button("OK", role: .cancel) { store.errorMessage = nil } }
        message: { Text(store.errorMessage ?? "") }
    }
}

struct NotesView: View {
    @ObservedObject var store: NotesStore
    @AppStorage("pinned") private var pinned = true
    @AppStorage("referenceFontSize") private var fontSize = 12.0
    @State private var query = ""
    @State private var category = "All"
    @State private var editing: Snippet?
    @State private var removing: Snippet?
    @State private var copied: UUID?
    var onPin: (Bool) -> Void

    private var categories: [String] { Array(Set(store.snippets.map(\.category))).sorted() }
    private var visible: [Snippet] {
        store.snippets.filter { snippet in
            (category == "All" || snippet.category == category) &&
            (query.isEmpty || [snippet.title, snippet.category, snippet.code, snippet.note]
                .contains { $0.localizedCaseInsensitiveContains(query) })
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Text("Java Notes").font(.system(size: 21, weight: .semibold, design: .rounded))
                Spacer()
                Button { pinned.toggle(); onPin(pinned) } label: {
                    Image(systemName: pinned ? "pin.fill" : "pin")
                        .foregroundStyle(pinned ? accent : .secondary)
                }.help(pinned ? "Unpin from other windows" : "Keep above other windows")
                    .accessibilityLabel(pinned ? "Unpin window" : "Pin window")
                Menu {
                    Button("Larger code") { fontSize = min(20, fontSize + 1) }
                    Button("Smaller code") { fontSize = max(10, fontSize - 1) }
                    Divider()
                    Button("Open saved-notes folder") { NSWorkspace.shared.open(store.folder) }
                    Button("Hide Java Notes") { NSApp.hide(nil) }
                    Button("Quit Java Notes") { NSApp.terminate(nil) }
                } label: { Image(systemName: "ellipsis") }
                .menuStyle(.borderlessButton).fixedSize().accessibilityLabel("Options")
                Button {
                    editing = Snippet(title: "", category: category == "All" ? "My notes" : category, code: "", note: "")
                } label: { Image(systemName: "plus").foregroundStyle(accent) }
                    .help("Add a snippet (⌘N)").accessibilityLabel("Add snippet").keyboardShortcut("n")
            }
            .buttonStyle(.plain).padding(.horizontal, 18).padding(.top, 12).padding(.bottom, 16)

            if store.snippets.count > 1 || !query.isEmpty {
              HStack(spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                    TextField("Find a snippet", text: $query).textFieldStyle(.plain)
                        .accessibilityLabel("Find a snippet")
                }.padding(8).background(.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 8))
                Picker("Category", selection: $category) {
                    Text("All").tag("All")
                    ForEach(categories, id: \.self) { Text($0).tag($0) }
                }.labelsHidden().frame(maxWidth: 115)
              }.padding(.horizontal, 18).padding(.bottom, 14)
            }

            Divider().opacity(0.5)
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    ForEach(visible) { snippet in card(snippet) }
                    if visible.isEmpty {
                        Text(store.snippets.isEmpty ? "Add your first snippet with +." : "No matching snippets.")
                            .foregroundStyle(.secondary).frame(maxWidth: .infinity).padding(.vertical, 40)
                    }
                }.padding(16)
            }
            Divider().opacity(0.5)
            HStack {
                Circle().fill(accent).frame(width: 5, height: 5)
                Text("Saved on this Mac").font(.system(size: 10))
                Spacer()
                Text(store.snippets.count == 1 ? "1 note" : "\(store.snippets.count) notes")
                    .font(.system(size: 10).monospacedDigit())
            }.foregroundStyle(.secondary).padding(.horizontal, 18).padding(.vertical, 10)
        }
        .background(Color(red: 0.065, green: 0.077, blue: 0.084))
        .tint(accent).preferredColorScheme(.dark)
        .sheet(item: $editing) { snippet in
            SnippetEditor(store: store, draft: snippet, isNew: !store.snippets.contains { $0.id == snippet.id })
        }
        .alert("Remove this snippet?", isPresented: Binding(
            get: { removing != nil }, set: { if !$0 { removing = nil } }
        )) {
            Button("Cancel", role: .cancel) { removing = nil }
            Button("Remove", role: .destructive) {
                if let snippet = removing { store.remove(snippet) }
                removing = nil
            }
        } message: { Text("\(removing?.title ?? "This snippet") will be removed. The previous saved collection is kept in notes.backup.json until your next change.") }
        .alert("Couldn’t open or save notes", isPresented: Binding(
            get: { store.errorMessage != nil && editing == nil }, set: { if !$0 { store.errorMessage = nil } }
        )) { Button("OK", role: .cancel) { store.errorMessage = nil } }
        message: { Text(store.errorMessage ?? "") }
        .onChange(of: categories) { _, values in
            if category != "All" && !values.contains(category) { category = "All" }
        }
    }

    private func card(_ snippet: Snippet) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Text(snippet.title).font(.system(size: 12, weight: .semibold))
                Spacer(minLength: 0)
                Button {
                    NSPasteboard.general.clearContents()
                    NSPasteboard.general.setString(snippet.code, forType: .string)
                    copied = snippet.id
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        if copied == snippet.id { copied = nil }
                    }
                } label: { Image(systemName: copied == snippet.id ? "checkmark" : "doc.on.doc") }
                    .help("Copy code").accessibilityLabel("Copy \(snippet.title)")
                Button { editing = snippet } label: { Image(systemName: "pencil") }
                    .help("Edit snippet").accessibilityLabel("Edit \(snippet.title)")
            }.buttonStyle(.plain)
            ScrollView(.horizontal, showsIndicators: false) {
                Text(resizedCode(snippet.code)).textSelection(.enabled)
                    .fixedSize(horizontal: true, vertical: true).lineSpacing(4)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(13).frame(maxWidth: .infinity, alignment: .leading)
        .background(.white.opacity(0.035), in: RoundedRectangle(cornerRadius: 11))
        .overlay(RoundedRectangle(cornerRadius: 11).strokeBorder(.white.opacity(0.065)))
        .contextMenu {
            Button("Edit") { editing = snippet }
            Button("Move up") { store.move(snippet, by: -1) }
                .disabled(store.snippets.first?.id == snippet.id)
            Button("Move down") { store.move(snippet, by: 1) }
                .disabled(store.snippets.last?.id == snippet.id)
            Divider()
            Button("Remove…", role: .destructive) { removing = snippet }
        }
    }

    private func resizedCode(_ code: String) -> AttributedString {
        var text = coloredJava(code)
        text.font = .system(size: fontSize, design: .monospaced)
        return text
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    var window: NSWindow!
    var store: NotesStore!
    func applicationDidFinishLaunching(_ notification: Notification) {
        let arguments = ProcessInfo.processInfo.arguments
        let folder: URL
        if let i = arguments.firstIndex(of: "--data-dir"), arguments.indices.contains(i + 1) {
            folder = URL(fileURLWithPath: arguments[i + 1], isDirectory: true)
        } else {
            folder = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
                .appendingPathComponent("Java Notes", isDirectory: true)
        }
        store = NotesStore(folder: folder)
        UserDefaults.standard.register(defaults: ["pinned": true, "referenceFontSize": 12.0])
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 430, height: 650),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = "Java Notes"
        window.titlebarAppearsTransparent = true
        window.appearance = NSAppearance(named: .darkAqua)
        window.backgroundColor = NSColor(red: 0.065, green: 0.077, blue: 0.084, alpha: 1)
        window.minSize = NSSize(width: 370, height: 350)
        window.isReleasedWhenClosed = false
        window.delegate = self
        window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        setPinned(UserDefaults.standard.bool(forKey: "pinned"))
        let view = NotesView(store: store, onPin: { [weak self] value in self?.setPinned(value) })
        window.contentView = NSHostingView(rootView: view)
        if !window.setFrameUsingName("JavaNotesWindow") {
            if let screen = NSScreen.main {
                window.setFrameTopLeftPoint(NSPoint(x: screen.visibleFrame.maxX - 454, y: screen.visibleFrame.maxY - 48))
            }
        }
        window.setFrameAutosaveName("JavaNotesWindow")
        installMenu()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
    func setPinned(_ value: Bool) { window.level = value ? .floating : .normal }
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        window.makeKeyAndOrderFront(nil)
        return true
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { false }
    private func installMenu() {
        let menu = NSMenu()
        let applicationItem = NSMenuItem()
        let applicationMenu = NSMenu(title: "Java Notes")
        applicationMenu.addItem(withTitle: "Hide Java Notes", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        applicationMenu.addItem(.separator())
        applicationMenu.addItem(withTitle: "Quit Java Notes", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        applicationItem.submenu = applicationMenu
        menu.addItem(applicationItem)
        let editItem = NSMenuItem()
        let editMenu = NSMenu(title: "Edit")
        for (title, selector, key) in [("Undo", "undo:", "z"), ("Cut", "cut:", "x"), ("Copy", "copy:", "c"), ("Paste", "paste:", "v"), ("Select All", "selectAll:", "a")] {
            editMenu.addItem(withTitle: title, action: Selector(selector), keyEquivalent: key)
        }
        editItem.submenu = editMenu
        menu.addItem(editItem)
        NSApp.mainMenu = menu
    }
}

@main
struct JavaNotesMain {
    static func main() {
        if CommandLine.arguments.contains("--print-starters") {
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
            let data = try! encoder.encode(NotesDocument(snippets: Snippet.starters))
            print(String(decoding: data, as: UTF8.self))
            return
        }
        if CommandLine.arguments.contains("--self-test") {
            do { try runStoreTests() } catch { fatalError("Store test failed: \(error)") }
            return
        }
        let app = NSApplication.shared
        let delegate = AppDelegate()
        app.setActivationPolicy(.regular)
        app.delegate = delegate
        withExtendedLifetime(delegate) { app.run() }
    }
}
