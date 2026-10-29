"use client";

import { Card } from "./Card";
import { Txt } from "./Fields";
import { dailyVarSnippetsFor, extractVars } from "@/lib/snippets";
import type { Snippet } from "@/types/report";

/**
 * "매일 반영" + 변수 있는 문구를 위한 전용 입력칸. 리테일·포스처럼 매일 값만 바꿔 넣으면,
 * 그 값으로 채운 문장이 복사용 보고서 텍스트에 자동으로 들어간다(편집 중인 다른 칸에는 안 섞임).
 */
export function DailySnippetVars({
  snippets,
  location,
  values,
  onChange,
}: {
  snippets: Snippet[];
  location: string;
  values: Record<string, Record<string, string>>;
  onChange: (snippetId: string, vars: Record<string, string>) => void;
}) {
  const targets = dailyVarSnippetsFor(snippets, location);
  if (targets.length === 0) return null;
  return (
    <>
      {targets.map((s) => (
        <Card key={s.id} title={`📌 ${s.label}`} right={<span className="sub">오늘 값</span>}>
          {extractVars(s.template).map((v) => (
            <Txt
              key={v}
              id={`dv-${s.id}-${v}`}
              label={v}
              value={values[s.id]?.[v] || ""}
              onChange={(val) => onChange(s.id, { ...(values[s.id] || {}), [v]: val })}
            />
          ))}
        </Card>
      ))}
    </>
  );
}
