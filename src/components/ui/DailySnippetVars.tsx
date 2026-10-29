"use client";

import { Card } from "./Card";
import { Txt } from "./Fields";
import { dailyVarSnippetsFor, extractVars } from "@/lib/snippets";
import type { Snippet } from "@/types/report";

/**
 * "매일 반영" + 변수 있는 문구를 위한 전용 입력칸. 리테일·포스처럼 매일 값만 바꿔 넣으면,
 * 그 값으로 채운 문장이 복사용 보고서 텍스트에 자동으로 들어간다(편집 중인 다른 칸에는 안 섞임).
 * "빼기"를 누르면 오늘은 이 문구를 통째로 건너뛰고(보고서 텍스트에도 안 들어감), "다시 넣기"로
 * 되돌릴 수 있다.
 */
export function DailySnippetVars({
  snippets,
  location,
  values,
  skip = [],
  onChange,
  onToggleSkip,
}: {
  snippets: Snippet[];
  location: string;
  values: Record<string, Record<string, string>>;
  skip?: string[];
  onChange: (snippetId: string, vars: Record<string, string>) => void;
  onToggleSkip: (snippetId: string) => void;
}) {
  const targets = dailyVarSnippetsFor(snippets, location);
  if (targets.length === 0) return null;
  return (
    <>
      {targets.map((s) => {
        const skipped = skip.includes(s.id);
        return (
          <Card
            key={s.id}
            title={`📌 ${s.label}`}
            right={
              <button type="button" className="link" onClick={() => onToggleSkip(s.id)}>
                {skipped ? "다시 넣기" : "오늘은 빼기 ✕"}
              </button>
            }
          >
            {skipped ? (
              <p className="hint" style={{ margin: 0 }}>
                오늘은 이 문구를 안 넣어요. 보고서 텍스트에도 안 들어가요.
              </p>
            ) : (
              extractVars(s.template).map((v) => (
                <Txt
                  key={v}
                  id={`dv-${s.id}-${v}`}
                  label={v}
                  value={values[s.id]?.[v] || ""}
                  onChange={(val) => onChange(s.id, { ...(values[s.id] || {}), [v]: val })}
                />
              ))
            )}
          </Card>
        );
      })}
    </>
  );
}
