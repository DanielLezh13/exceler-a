"use client";

import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap, type Completion, type CompletionContext } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { java } from "@codemirror/lang-java";
import { bracketMatching, HighlightStyle, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { linter, lintGutter, lintKeymap, type Diagnostic } from "@codemirror/lint";
import { EditorState, Prec } from "@codemirror/state";
import { drawSelection, dropCursor, EditorView, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers, placeholder as editorPlaceholder } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { useEffect, useRef } from "react";

type JavaEditorProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  starterCode?: string;
  onSubmit?: () => void;
};

const commonJavaWords = [
  "boolean", "break", "case", "char", "class", "continue", "default", "do", "double", "else", "false", "for", "if", "import", "int", "new", "private", "public", "return", "Scanner", "static", "String", "switch", "System", "this", "true", "void", "while",
  "next", "nextBoolean", "nextDouble", "nextInt", "nextLine", "out", "print", "println",
];

const javaCompletions: Completion[] = [
  { label: "System.out.println()", apply: "System.out.println()", type: "function", detail: "print a line" },
  { label: "System.out.print()", apply: "System.out.print()", type: "function", detail: "print without a new line" },
  { label: "input.nextInt()", apply: "input.nextInt()", type: "function", detail: "read a whole number" },
  { label: "input.nextDouble()", apply: "input.nextDouble()", type: "function", detail: "read a decimal number" },
  { label: "input.nextBoolean()", apply: "input.nextBoolean()", type: "function", detail: "read true or false" },
  { label: "input.nextLine()", apply: "input.nextLine()", type: "function", detail: "read a full line of text" },
  { label: "input.next()", apply: "input.next()", type: "function", detail: "read one word" },
  { label: "Scanner input = new Scanner(System.in);", type: "text", detail: "create the input reader" },
  ...["int", "double", "boolean", "char", "String", "Scanner", "true", "false", "if", "else", "for", "while", "switch", "case", "break", "return"].map((label) => ({ label, type: "keyword" } as Completion)),
];

const javaHighlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier], color: "#c792ea" },
  { tag: [tags.typeName, tags.className], color: "#82aaff" },
  { tag: [tags.string, tags.character], color: "#c3e88d" },
  { tag: [tags.number, tags.bool, tags.null], color: "#f78c6c" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "#82aaff" },
  { tag: [tags.propertyName, tags.variableName], color: "#e8edf0" },
  { tag: [tags.operator, tags.punctuation], color: "#89ddff" },
  { tag: [tags.lineComment, tags.blockComment], color: "#697782", fontStyle: "italic" },
  { tag: tags.invalid, color: "#ff6b6b", textDecoration: "underline" },
]);

function editDistance(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = row[rightIndex];
      row[rightIndex] = Math.min(
        row[rightIndex] + 1,
        row[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return row[right.length];
}

function maskStringsAndComments(source: string) {
  return source.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, " "));
}

function javaTypoDiagnostics(source: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const searchable = maskStringsAndComments(source);
  for (const match of searchable.matchAll(/\b[A-Za-z_][A-Za-z0-9_]*\b/g)) {
    const word = match[0];
    if (word.length < 3) continue;
    if (commonJavaWords.includes(word)) continue;
    const suggestion = commonJavaWords.find((candidate) => {
      if (candidate.length < 3 || Math.abs(candidate.length - word.length) > 1) return false;
      return editDistance(candidate, word) === 1;
    });
    if (!suggestion) continue;
    const from = match.index ?? 0;
    diagnostics.push({
      from,
      to: from + word.length,
      severity: "warning",
      message: `Did you mean ${suggestion}?`,
      actions: [{
        name: `Change to ${suggestion}`,
        apply(view, actionFrom, actionTo) {
          view.dispatch({ changes: { from: actionFrom, to: actionTo, insert: suggestion } });
        },
      }],
    });
  }
  return diagnostics;
}

function identifiersFrom(source: string) {
  const reserved = new Set(commonJavaWords);
  return Array.from(new Set(source.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) ?? []))
    .filter((word) => !reserved.has(word) && word.length > 1)
    .map((label) => ({ label, type: "variable" } as Completion));
}

export default function JavaEditor({ id, value, onChange, placeholder, multiline = true, starterCode = "", onSubmit }: JavaEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onSubmitRef = useRef(onSubmit);

  useEffect(() => {
    onChangeRef.current = onChange;
    onSubmitRef.current = onSubmit;
  }, [onChange, onSubmit]);

  useEffect(() => {
    if (!hostRef.current) return;
    const starterIdentifiers = identifiersFrom(starterCode);
    const completionSource = (context: CompletionContext) => {
      const word = context.matchBefore(/[A-Za-z_][A-Za-z0-9_.]*/);
      if (!word || (word.from === word.to && !context.explicit)) return null;
      const afterDot = word.text.lastIndexOf(".") + 1;
      return { from: word.from + afterDot, options: [...javaCompletions, ...starterIdentifiers], validFor: /^[A-Za-z_][A-Za-z0-9_]*$/ };
    };
    const submitKeys = Prec.lowest(keymap.of([
      ...(!multiline ? [{ key: "Enter", run: () => { onSubmitRef.current?.(); return true; } }] : []),
      { key: "Mod-Enter", run: () => { onSubmitRef.current?.(); return true; } },
    ]));

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        indentOnInput(),
        syntaxHighlighting(javaHighlightStyle),
        bracketMatching(),
        highlightActiveLine(),
        closeBrackets(),
        autocompletion({ override: [completionSource], activateOnTyping: true, maxRenderedOptions: 8 }),
        java(),
        lintGutter(),
        linter((view) => javaTypoDiagnostics(view.state.doc.toString()), { delay: 350 }),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ spellcheck: "false", autocorrect: "off", autocapitalize: "off", "aria-label": "Java answer editor" }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString());
        }),
        keymap.of([...closeBracketsKeymap, ...completionKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab, ...lintKeymap]),
        submitKeys,
        editorPlaceholder(placeholder),
        EditorView.theme({
          "&": { minHeight: multiline ? "210px" : "47px" },
          ".cm-scroller": { minHeight: multiline ? "210px" : "47px", maxHeight: multiline ? "430px" : "47px" },
          ".cm-content": { minHeight: multiline ? "210px" : "47px" },
          ".cm-gutters": { display: multiline ? "flex" : "none" },
        }),
      ],
    });
    const editor = new EditorView({ state, parent: hostRef.current });
    editorRef.current = editor;
    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, [id, multiline, placeholder, starterCode]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const current = editor.state.doc.toString();
    if (current === value) return;
    editor.dispatch({ changes: { from: 0, to: current.length, insert: value } });
  }, [value]);

  return <div className={`java-editor ${multiline ? "multiline" : "single"}`} id={id} ref={hostRef} />;
}
