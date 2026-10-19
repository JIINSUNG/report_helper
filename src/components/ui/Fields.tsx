import type { ReactNode } from "react";
import { comma } from "@/lib/format";

export function Num({
  id,
  label,
  value,
  onChange,
  suf,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  suf?: string;
  hint?: ReactNode;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>
        <span>{label}</span>
        {hint}
      </span>
      <div className={suf ? "suf" : undefined}>
        <input
          id={id}
          className="inp"
          inputMode="numeric"
          placeholder="0"
          value={value ? comma(value) : ""}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            onChange(raw ? Number(raw) : 0);
          }}
        />
        {suf && <i>{suf}</i>}
      </div>
    </label>
  );
}

export function Txt({
  id,
  label,
  value,
  onChange,
  ph,
  suf,
  mode,
  onKeyDown,
}: {
  id: string;
  label?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  ph?: string;
  suf?: string;
  mode?: "text" | "numeric" | "decimal";
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="field" htmlFor={id}>
      {label && (
        <span>
          <span>{label}</span>
        </span>
      )}
      <div className={suf ? "suf" : undefined}>
        <input
          id={id}
          className="inp"
          inputMode={mode}
          placeholder={ph || ""}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {suf && <i>{suf}</i>}
      </div>
    </label>
  );
}

export function Area({
  id,
  value,
  onChange,
  ph,
  rows = 3,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  ph?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      className="inp"
      rows={rows}
      placeholder={ph || ""}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Chips({
  options,
  value,
  onChange,
  multi,
  labels,
}: {
  options: string[];
  value: string | string[];
  onChange: (v: string | string[]) => void;
  multi?: boolean;
  labels?: Record<string, string>;
}) {
  const arr = Array.isArray(value) ? value : [];
  const on = (o: string) => (multi ? arr.includes(o) : value === o);
  const tap = (o: string) => {
    if (multi) {
      onChange(on(o) ? arr.filter((x) => x !== o) : [...arr, o]);
    } else {
      onChange(on(o) ? "" : o);
    }
  };
  return (
    <div className="chips">
      {options.map((o) => (
        <button key={o} type="button" className="chip" aria-pressed={on(o)} onClick={() => tap(o)}>
          {labels ? labels[o] : o}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="step">
      <button type="button" aria-label="빼기" onClick={() => onChange(Math.max(0, value - 1))}>
        −
      </button>
      <span>{value}</span>
      <button type="button" aria-label="더하기" onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}
