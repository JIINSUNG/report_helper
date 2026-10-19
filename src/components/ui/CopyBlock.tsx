"use client";

import { useState } from "react";
import { copyText } from "@/lib/format";

export function CopyBlock({ text, empty, label = "이 블록 복사" }: { text: string; empty: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  const copy = async () => {
    await copyText(text);
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };

  if (!text.trim()) return <p className="hint">{empty}</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {open && <pre style={{ flex: "none" }}>{text}</pre>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setOpen(!open)}>
          {open ? "미리보기 닫기" : "미리보기"}
        </button>
        <button type="button" className="btn pri" style={{ flex: 2 }} onClick={copy}>
          {done ? "복사했어요 ✓" : label}
        </button>
      </div>
    </div>
  );
}
