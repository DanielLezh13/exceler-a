"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1600);
  };

  return <button type="button" className={`copy-code-button ${copied ? "copied" : ""}`} onClick={copyCode} aria-label={copied ? "Code copied" : "Copy code"} title={copied ? "Copied" : "Copy code"}>
    {copied ? <Check size={11} strokeWidth={2.8} /> : <Copy size={11} />}
  </button>;
}
