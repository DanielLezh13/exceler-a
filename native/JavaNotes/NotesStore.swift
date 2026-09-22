import Foundation
import Combine

struct Snippet: Codable, Identifiable, Equatable {
    var id = UUID()
    var title: String
    var category: String
    var code: String
    var note: String

    static let starters: [Snippet] = [
        Snippet(title: "Unit I Reference", category: "Reference", code: #"""
        // INPUT PROGRAM STRUCTURE
        import java.util.Scanner;

        public class Main {
            public static void main(String[] args) {
                Scanner input = new Scanner(System.in);

                // Your code goes here
            }
        }

        // REFERENCE EXAMPLES — use inside main

        // VARIABLES & DATA TYPES
        int count = 5;
        double cost = 9.99;
        boolean gameOver = false;
        char letter = 'A';
        String name = "Daniel";

        // ASSIGNMENT
        count = 8;
        count = count + 2;

        // INPUT
        int age = input.nextInt();
        double price = input.nextDouble();
        boolean hasId = input.nextBoolean();
        String word = input.next();       // one word
        input.nextLine();                 // finish this line
        String fullName = input.nextLine(); // next full line

        // OUTPUT
        System.out.print("Enter age: ");  // stay on this line
        System.out.println(age);         // then a new line
        System.out.println("Age: " + age);

        // ARITHMETIC
        int sum = 7 + 2;         // 9
        int difference = 7 - 2;  // 5
        int product = 7 * 2;     // 14
        int quotient = 7 / 2;    // 3
        int remainder = 7 % 2;   // 1

        // DECIMAL DIVISION & CASTING
        double result = 7.0 / 2;       // 3.5
        double cast = (double) 7 / 2;  // 3.5
        double truncated = 7 / 2;      // 3.0

        // PRECEDENCE
        int first = 2 + 3 * 4;    // 14
        int grouped = (2 + 3) * 4; // 20

        // COMPOUND ASSIGNMENT
        count += 2;  // count = count + 2
        count -= 2;  // count = count - 2
        count *= 2;  // count = count * 2
        count /= 2;  // count = count / 2
        count %= 2;  // count = count % 2

        // INCREMENT & DECREMENT
        count++;     // add 1
        count--;     // subtract 1

        // POSTFIX: use, then change
        int x = 4;
        int oldValue = x++;  // oldValue = 4, x = 5

        // PREFIX: change, then use
        x = 4;
        int newValue = ++x;  // newValue = 5, x = 5

        // Same timing for --
        x = 4;
        int oldCount = x--;  // oldCount = 4, x = 3
        x = 4;
        int newCount = --x;  // newCount = 3, x = 3

        // TEXT + NUMBERS
        System.out.println(2 + 3 + " points"); // 5 points
        System.out.println("Points: " + 2 + 3); // Points: 23
        System.out.println("Points: " + (2 + 3)); // Points: 5
        """#, note: "")
    ]
}

struct NotesDocument: Codable {
    var version = 1
    var snippets: [Snippet]
}

enum NotesError: LocalizedError {
    case unsupportedVersion
    case unreadableOriginal
    var errorDescription: String? {
        switch self {
        case .unsupportedVersion: return "This notes file is from a newer version of Java Notes. It has not been changed."
        case .unreadableOriginal: return "Your existing notes could not be read. Nothing has been overwritten. Open the saved-notes folder to recover notes.json or its backup."
        }
    }
}

final class NotesStore: ObservableObject {
    @Published private(set) var snippets: [Snippet] = []
    @Published var errorMessage: String?
    let folder: URL
    private var canSave = true
    var file: URL { folder.appendingPathComponent("notes.json") }
    var backup: URL { folder.appendingPathComponent("notes.backup.json") }

    init(folder: URL) {
        self.folder = folder
        do {
            if FileManager.default.fileExists(atPath: file.path) {
                let document = try JSONDecoder().decode(NotesDocument.self, from: Data(contentsOf: file))
                guard document.version == 1 else { throw NotesError.unsupportedVersion }
                snippets = document.snippets
            } else {
                try persist(Snippet.starters)
                snippets = Snippet.starters
            }
        } catch {
            canSave = false
            errorMessage = "\(error.localizedDescription)\n\nYour existing file is unchanged."
        }
    }

    private func persist(_ values: [Snippet]) throws {
        guard canSave else { throw NotesError.unreadableOriginal }
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(NotesDocument(snippets: values))
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        // Preserve the previous complete file before each atomic replacement.
        if FileManager.default.fileExists(atPath: file.path) {
            try Data(contentsOf: file).write(to: backup, options: .atomic)
        }
        try data.write(to: file, options: .atomic)
    }

    @discardableResult
    private func commit(_ values: [Snippet]) -> Bool {
        do {
            try persist(values)
            snippets = values
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    @discardableResult
    func save(_ snippet: Snippet) -> Bool {
        var values = snippets
        if let index = values.firstIndex(where: { $0.id == snippet.id }) {
            values[index] = snippet
        } else {
            values.append(snippet)
        }
        return commit(values)
    }

    @discardableResult
    func remove(_ snippet: Snippet) -> Bool {
        commit(snippets.filter { $0.id != snippet.id })
    }

    func move(_ snippet: Snippet, by offset: Int) {
        guard let index = snippets.firstIndex(where: { $0.id == snippet.id }),
              snippets.indices.contains(index + offset) else { return }
        var values = snippets
        values.swapAt(index, index + offset)
        commit(values)
    }
}

func runStoreTests() throws {
    let folder = FileManager.default.temporaryDirectory.appendingPathComponent("JavaNotes-tests-\(UUID())")
    defer { try? FileManager.default.removeItem(at: folder) }
    let store = NotesStore(folder: folder)
    let starterCount = Snippet.starters.count
    precondition(store.errorMessage == nil && store.snippets.count == starterCount)
    precondition(starterCount == 1 && store.snippets[0].note.isEmpty)
    precondition(store.snippets[0].code.components(separatedBy: "public class Main").count == 2)
    precondition(store.snippets[0].code.contains("boolean hasId = input.nextBoolean();"))
    precondition(FileManager.default.fileExists(atPath: store.file.path))
    var sample = Snippet(title: "Test", category: "Mine", code: "  String x = \"hello\";\n\t// Exact spacing 😀\n", note: "Personal note")
    precondition(store.save(sample))
    precondition(NotesStore(folder: folder).snippets.last == sample)
    sample.code += "System.out.println(x);\n"
    precondition(store.save(sample))
    precondition(NotesStore(folder: folder).snippets.last == sample)
    let backupDocument = try JSONDecoder().decode(NotesDocument.self, from: Data(contentsOf: store.backup))
    precondition(backupDocument.snippets.last?.code != sample.code)
    store.move(sample, by: -1)
    precondition(NotesStore(folder: folder).snippets[starterCount - 1] == sample)
    precondition(store.remove(sample))
    precondition(NotesStore(folder: folder).snippets.count == starterCount)
    for snippet in store.snippets { precondition(store.remove(snippet)) }
    precondition(NotesStore(folder: folder).snippets.isEmpty, "Empty collection must not reset to starter notes")
    let corrupt = Data("not valid JSON".utf8)
    try corrupt.write(to: store.file, options: .atomic)
    let blocked = NotesStore(folder: folder)
    precondition(blocked.errorMessage != nil)
    precondition(!blocked.save(sample))
    let unchanged = try Data(contentsOf: store.file)
    precondition(unchanged == corrupt)
    print("PASS: starter notes, add, exact code round-trip, edit, backup, reorder, remove, empty collection, corrupt-file protection")
}
