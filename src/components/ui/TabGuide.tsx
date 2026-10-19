"use client";

import { useState } from "react";
import { GUIDES } from "@/data/guides";

const LKEY_GUIDE = "report-helper-guide-open:v1";

function readOpenState(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(LKEY_GUIDE);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function TabGuide({ tab }: { tab: string }) {
  const g = GUIDES[tab];
  const [st, setSt] = useState<Record<string, boolean>>(() => (typeof window === "undefined" ? {} : readOpenState()));
  if (!g) return null;
  const open = st[tab] !== false;
  return (
    <details
      className="guide"
      open={open}
      onToggle={(e) => {
        const isOpen = (e.currentTarget as HTMLDetailsElement).open;
        if (isOpen === open) return;
        const next = { ...st, [tab]: isOpen };
        setSt(next);
        try {
          window.localStorage.setItem(LKEY_GUIDE, JSON.stringify(next));
        } catch {
          // localStorage unavailable — state only
        }
      }}
    >
      <summary>{g.title} 탭은 이렇게 써요</summary>
      <div>{g.desc}</div>
      <ul>
        {g.tips.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </details>
  );
}
