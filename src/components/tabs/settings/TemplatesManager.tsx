"use client";

// 설정 탭 "보고서 양식" — 양식을 여러 개 만들어두고(이름 직접 지정) 골라 쓴다. 양식마다 오픈·마감보고의
// 블록 순서·켜기/끄기·제목 문구를 바꿀 수 있고, 오늘 보고서로 바로 미리보기 한다.
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  activeTemplate,
  CLOSE_BLOCK_LABEL,
  deleteTemplate,
  duplicateTemplate,
  moveBlock,
  OPEN_BLOCK_LABEL,
  saveTemplate,
  TITLE_VARS,
  templateList,
  UNTITLED_BLOCKS,
  selectTemplate as applyTemplate,
  DEFAULT_TEMPLATE,
} from "@/lib/report-templates";
import { closeText, openText } from "@/lib/report-text";
import { getClose, getOpen } from "@/lib/local-reports";
import { amountRemaining, mapsFor } from "@/lib/custom-sections";
import { uid } from "@/lib/format";
import type { LocalReportData, ReportTemplate, TemplateBlock } from "@/types/report";

type Kind = "open" | "close";

export function TemplatesManager({
  data,
  update,
  date,
  storeLabel,
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
  date: string;
  storeLabel: string;
}) {
  const list = templateList(data.settings);
  const active = activeTemplate(data.settings);
  const [selId, setSelId] = useState(active.id);
  const sel = list.find((t) => t.id === selId) ?? active;
  const [draft, setDraft] = useState<ReportTemplate | null>(null);
  const [kind, setKind] = useState<Kind>("close");
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const editing = draft && draft.id === sel.id ? draft : sel;
  const dirty = !!draft && draft.id === sel.id && JSON.stringify(draft) !== JSON.stringify(sel);

  const select = (id: string) => {
    if (dirty && !confirm("저장하지 않은 양식 변경이 있어요. 버리고 다른 양식을 볼까요?")) return;
    setDraft(null);
    setRenaming(false);
    setSelId(id);
  };

  const setBlocks = (k: Kind, blocks: TemplateBlock<string>[]) =>
    setDraft({ ...editing, [k]: blocks } as ReportTemplate);
  const blocks = (kind === "open" ? editing.open : editing.close) as TemplateBlock<string>[];
  const labels = (kind === "open" ? OPEN_BLOCK_LABEL : CLOSE_BLOCK_LABEL) as Record<string, string>;
  const setBlock = (i: number, p: Partial<TemplateBlock<string>>) => setBlocks(kind, blocks.map((b, j) => (j === i ? { ...b, ...p } : b)));

  const save = () => {
    if (!draft) return;
    update((d) => ({ ...d, settings: saveTemplate(d.settings, draft) }));
    setDraft(null);
  };

  const addNew = () => {
    if (dirty && !confirm("저장하지 않은 변경이 있어요. 버리고 새 양식을 만들까요?")) return;
    const newId = uid();
    update((d) => ({ ...d, settings: duplicateTemplate(d.settings, sel.id, undefined, newId).settings }));
    setDraft(null);
    setSelId(newId);
    setRenaming(true);
    setNameDraft(`${list.length + 1}번 보고서 양식`);
  };

  const rename = () => {
    const name = nameDraft.trim();
    if (!name) return;
    update((d) => ({ ...d, settings: saveTemplate(d.settings, { ...(templateList(d.settings).find((t) => t.id === sel.id) ?? sel), name }) }));
    if (draft) setDraft({ ...draft, name });
    setRenaming(false);
  };

  const remove = () => {
    if (!confirm(`"${sel.name}" 양식을 지울까요? 보고서 내용은 안 지워져요.`)) return;
    update((d) => ({ ...d, settings: deleteTemplate(d.settings, sel.id) }));
    setDraft(null);
    setSelId(list.find((t) => t.id !== sel.id)!.id);
  };

  const preview = (() => {
    const customDefs = data.settings.customSections || [];
    const remainingFor = (defId: string) => {
      const def = customDefs.find((x) => x.id === defId);
      if (!def || def.type !== "amount" || def.totalBudget == null) return null;
      return amountRemaining(mapsFor(def, data.opens, data.closes), defId, def.totalBudget, date);
    };
    const snippets = data.settings.snippets || [];
    return kind === "open"
      ? openText(getOpen(data, date), storeLabel, customDefs, remainingFor, snippets, editing)
      : closeText(getClose(data, date), storeLabel, data.settings.inventoryNote, customDefs, remainingFor, snippets, editing);
  })();

  return (
    <Card title="보고서 양식" right={dirty ? <span className="tag warn">저장 안 됨</span> : <span className="sub">사용 중: {active.name}</span>}>
      <p className="hint">
        보고서 형식이 바뀌어도 예전 양식을 지우지 않고 여러 개 두고 골라 쓸 수 있어요. 양식마다 오픈·마감보고의 순서·제목·넣을 칸을 정해요.
      </p>

      <div className="chips">
        {list.map((t) => (
          <button key={t.id} type="button" className="chip" aria-pressed={t.id === sel.id} onClick={() => select(t.id)}>
            {t.id === active.id ? "✓ " : ""}
            {t.name}
          </button>
        ))}
        <button type="button" className="chip" onClick={addNew}>
          + 새 양식
        </button>
      </div>

      <div className="box" style={{ gap: 8 }}>
        {renaming ? (
          <div style={{ display: "flex", gap: 6 }}>
            <input
              className="inp"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && rename()}
              aria-label="양식 이름"
              autoFocus
              style={{ flex: 1, minWidth: 0 }}
            />
            <button type="button" className="btn sm pri" disabled={!nameDraft.trim()} onClick={rename}>
              이름 저장
            </button>
            <button type="button" className="btn sm" onClick={() => setRenaming(false)}>
              취소
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <b style={{ fontSize: 15 }}>{sel.name}</b>
            {sel.id === active.id ? (
              <span className="tag ok">사용 중</span>
            ) : (
              <button type="button" className="btn sm pri" onClick={() => update((d) => ({ ...d, settings: applyTemplate(d.settings, sel.id) }))}>
                이 양식 쓰기
              </button>
            )}
            <span style={{ flex: 1 }} />
            <button
              type="button"
              className="link"
              onClick={() => {
                setNameDraft(sel.name);
                setRenaming(true);
              }}
            >
              이름 바꾸기
            </button>
            {list.length > 1 && (
              <button type="button" className="link danger" onClick={remove}>
                삭제
              </button>
            )}
          </div>
        )}
      </div>

      <div className="seg" role="group" aria-label="오픈/마감 양식">
        <button type="button" aria-pressed={kind === "open"} onClick={() => setKind("open")}>
          오픈보고
        </button>
        <button type="button" aria-pressed={kind === "close"} onClick={() => setKind("close")}>
          마감보고
        </button>
      </div>

      <p className="hint">
        체크를 끄면 그 칸이 복사되는 보고서에서 빠져요. 제목엔 {TITLE_VARS.join(" ")}를 쓸 수 있어요(날짜·요일·매장 이름으로 바뀜).
      </p>

      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {blocks.map((b, i) => (
          <li key={b.id} className="box" style={{ gap: 6, padding: 10, opacity: b.on ? 1 : 0.55 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={b.on} onChange={(e) => setBlock(i, { on: e.target.checked })} aria-label={`${labels[b.id]} 넣기`} style={{ width: 18, height: 18 }} />
              <b style={{ fontSize: 13.5, flex: 1, minWidth: 0 }}>{labels[b.id]}</b>
              <button type="button" className="btn sm" disabled={i === 0} onClick={() => setBlocks(kind, moveBlock(blocks, i, -1))} aria-label={`${labels[b.id]} 위로`}>
                ↑
              </button>
              <button type="button" className="btn sm" disabled={i === blocks.length - 1} onClick={() => setBlocks(kind, moveBlock(blocks, i, 1))} aria-label={`${labels[b.id]} 아래로`}>
                ↓
              </button>
            </div>
            {!UNTITLED_BLOCKS.has(b.id) &&
              (b.id === "header" ? (
                <textarea className="inp" rows={2} value={b.title} onChange={(e) => setBlock(i, { title: e.target.value })} aria-label={`${labels[b.id]} 문구`} />
              ) : (
                <input className="inp" value={b.title} onChange={(e) => setBlock(i, { title: e.target.value })} placeholder="비우면 제목 줄 없이 내용만" aria-label={`${labels[b.id]} 제목`} />
              ))}
          </li>
        ))}
      </ol>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          className="link"
          onClick={() => {
            if (!confirm(`${kind === "open" ? "오픈" : "마감"}보고 양식을 처음 기본 양식으로 되돌릴까요? (저장해야 반영돼요)`)) return;
            setBlocks(kind, (kind === "open" ? DEFAULT_TEMPLATE.open : DEFAULT_TEMPLATE.close).map((x) => ({ ...x })) as TemplateBlock<string>[]);
          }}
        >
          기본 양식으로 되돌리기
        </button>
        <span style={{ flex: 1 }} />
        <button type="button" className="btn sm" onClick={() => setShowPreview((s) => !s)}>
          {showPreview ? "미리보기 닫기" : "오늘 보고서로 미리보기"}
        </button>
        {dirty && (
          <>
            <button type="button" className="btn sm" onClick={() => setDraft(null)}>
              취소
            </button>
            <button type="button" className="btn sm pri" onClick={save}>
              양식 저장
            </button>
          </>
        )}
      </div>

      {showPreview && (
        <pre className="box" style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12.5, lineHeight: 1.6, fontFamily: "inherit", maxHeight: 360, overflow: "auto" }}>
          {preview}
        </pre>
      )}
    </Card>
  );
}

/** 오픈·마감 탭 위 — 양식이 2개 이상일 때만, 지금 쓰는 양식을 바로 바꿀 수 있게. */
export function TemplateSwitch({ data, update }: { data: LocalReportData; update: (fn: (d: LocalReportData) => LocalReportData) => void }) {
  const list = templateList(data.settings);
  const active = activeTemplate(data.settings);
  if (list.length < 2) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span className="sub" style={{ flexShrink: 0 }}>
        양식
      </span>
      <div className="chips" style={{ flexWrap: "nowrap", overflowX: "auto", paddingBottom: 2 }}>
        {list.map((t) => (
          <button key={t.id} type="button" className="chip sm" aria-pressed={t.id === active.id} onClick={() => update((d) => ({ ...d, settings: applyTemplate(d.settings, t.id) }))} style={{ flexShrink: 0 }}>
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
