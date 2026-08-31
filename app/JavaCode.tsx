import { javaLanguage } from "@codemirror/lang-java";
import { classHighlighter, highlightTree } from "@lezer/highlight";
import { Fragment, type ReactNode } from "react";

export default function JavaCode({ code }: { code: string }) {
  const pieces: ReactNode[] = [];
  const tree = javaLanguage.parser.parse(code);
  let position = 0;
  let key = 0;

  highlightTree(tree, classHighlighter, (from, to, classes) => {
    if (from > position) pieces.push(<Fragment key={key++}>{code.slice(position, from)}</Fragment>);
    pieces.push(<span className={classes} key={key++}>{code.slice(from, to)}</span>);
    position = to;
  });

  if (position < code.length) pieces.push(<Fragment key={key++}>{code.slice(position)}</Fragment>);
  return <code className="java-code">{pieces}</code>;
}
