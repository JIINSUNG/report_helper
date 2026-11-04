"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useWarehouse } from "@/lib/use-warehouse";
import { shelfCellId, shelfCellLabel, shelfTopCellId, shelfTopCellLabel, allCellIds } from "@/data/warehouse-layout";
import type { WarehouseZone } from "@/types/shared";

const PANEL_WIDTH = 176;
const SENS = 0.6; // 드래그 1px당 회전 각도

interface Panel {
  id: string;
  label: string;
  sub?: string;
  cells: { id: string; label: string }[];
}

function zonePanel(zone: WarehouseZone): Panel {
  if (zone.kind === "area") return { id: zone.id, label: zone.label, sub: zone.sub, cells: [{ id: zone.id, label: "" }] };
  const tiers = zone.tiers ?? 4;
  return {
    id: zone.id,
    label: zone.label,
    cells: [
      ...(zone.hasTop ? [{ id: shelfTopCellId(zone.id), label: shelfTopCellLabel(zone) }] : []),
      ...Array.from({ length: tiers }, (_, i) => ({ id: shelfCellId(zone.id, i + 1), label: shelfCellLabel(zone, i + 1) })),
    ],
  };
}

function CellBox({ label, text, onOpen }: { label: string; text: string; onOpen: () => void }) {
  return (
    <button type="button" className={"wh-cell" + (text ? " filled" : "")} onClick={onOpen}>
      <span className="wh-cell-label">{label}</span>
      <span className="wh-cell-text">{text || "비어있음"}</span>
    </button>
  );
}

function normalizeDeg(d: number) {
  let n = d % 360;
  if (n > 180) n -= 360;
  if (n < -180) n += 360;
  return n;
}

function Carousel({
  panels,
  cells,
  onOpenCell,
}: {
  panels: Panel[];
  cells: Record<string, { text: string }>;
  onOpenCell: (id: string, label: string) => void;
}) {
  const n = panels.length || 1;
  const stepDeg = 360 / n;
  const radius = Math.round(PANEL_WIDTH / 2 / Math.tan(Math.PI / n) || 0);
  const [rotation, setRotation] = useState(0);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  // state(dragging)는 다음 렌더까지 반영이 안 돼서, 드래그 시작 직후 오는 pointermove를
  // 놓치는 경우가 있었다(그래서 "슬라이드가 안 된다"는 느낌이 났음) — ref로 즉시 읽는다.
  const rotationRef = useRef(0);
  const draggingRef = useRef(false);
  const dragStart = useRef({ x: 0, rotation: 0, moved: false });

  const goTo = (i: number) => {
    const clamped = ((i % n) + n) % n;
    rotationRef.current = -clamped * stepDeg;
    setRotation(rotationRef.current);
    setActive(clamped);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = { x: e.clientX, rotation: rotationRef.current, moved: false };
    draggingRef.current = true;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStart.current.x;
    if (Math.abs(dx) > 4) dragStart.current.moved = true;
    rotationRef.current = dragStart.current.rotation + dx * SENS;
    setRotation(rotationRef.current);
  };
  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    const nearest = Math.round(-rotationRef.current / stepDeg);
    goTo(nearest);
  };
  // 칸(button) 위에서 드래그가 일어났으면, 손을 뗀 자리에서 그 칸의 클릭(수정 시트 열기)이
  // 바로 이어서 발생하는 걸 막는다 — 안 그러면 회전시키려던 게 칸 편집으로 열려버린다.
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragStart.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <>
      <div className="wh-nav">
        <button type="button" className="iconbtn" aria-label="이전 구역" onClick={() => goTo(active - 1)}>
          ‹
        </button>
        <div className="wh-dots">
          {panels.map((p, i) => (
            <button key={p.id} type="button" className={"wh-dot" + (i === active ? " on" : "")} aria-label={p.label} onClick={() => goTo(i)} />
          ))}
        </div>
        <button type="button" className="iconbtn" aria-label="다음 구역" onClick={() => goTo(active + 1)}>
          ›
        </button>
      </div>
      <div className="wh-stage">
        <div
          className="wh-ring"
          style={{ transform: `translateZ(${-radius}px) rotateY(${rotation}deg)`, transition: dragging ? "none" : "transform .35s cubic-bezier(.2,.8,.2,1)" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={onClickCapture}
        >
          {panels.map((p, i) => {
            const eff = normalizeDeg(i * stepDeg + rotation);
            const frontality = Math.cos((eff * Math.PI) / 180);
            const opacity = Math.max(0.12, (frontality + 1) / 2);
            const facingAway = Math.abs(eff) > 95;
            return (
              <div
                className="wh-panel3d"
                key={p.id}
                style={{
                  transform: `rotateY(${i * stepDeg}deg) translateZ(${radius}px)`,
                  opacity,
                  zIndex: Math.round(frontality * 9) + 1,
                  pointerEvents: facingAway ? "none" : undefined,
                }}
              >
                <div className="wh-panel-label">
                  {p.label}
                  {p.sub && <small>{p.sub}</small>}
                </div>
                <div className="wh-panel-cells">
                  {p.cells.map((c) => (
                    <CellBox key={c.id} label={c.label} text={cells[c.id]?.text || ""} onOpen={() => onOpenCell(c.id, c.label || p.label)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function ListView({
  panels,
  cells,
  onOpenCell,
}: {
  panels: Panel[];
  cells: Record<string, { text: string }>;
  onOpenCell: (id: string, label: string) => void;
}) {
  const [q, setQ] = useState("");
  const rows = panels.flatMap((p) => p.cells.map((c) => ({ zone: p.label, label: c.label || p.label, id: c.id, text: cells[c.id]?.text || "" })));
  const ql = q.trim().toLowerCase();
  const filtered = ql ? rows.filter((r) => r.label.toLowerCase().includes(ql) || r.text.toLowerCase().includes(ql)) : rows;

  return (
    <div className="wh-list">
      <input className="inp" placeholder="위치·내용 검색" value={q} onChange={(e) => setQ(e.target.value)} />
      {filtered.map((r) => (
        <button type="button" key={r.id} className={"wh-row" + (r.text ? " filled" : "")} onClick={() => onOpenCell(r.id, r.label)}>
          <span className="wh-row-label">{r.label}</span>
          <span className="wh-row-text">{r.text || "비어있음"}</span>
        </button>
      ))}
      {!filtered.length && <p className="hint center">찾는 칸이 없어요.</p>}
    </div>
  );
}

function ZoneEditor({
  zone,
  canRemove,
  onRename,
  onSetTiers,
  onSetHasTop,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  zone: WarehouseZone;
  canRemove: boolean;
  onRename: (label: string) => void;
  onSetTiers: (tiers: number) => void;
  onSetHasTop: (v: boolean) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const [label, setLabel] = useState(zone.label);
  return (
    <div className="wh-zone-edit">
      <div className="row2">
        <input className="inp" value={label} onChange={(e) => setLabel(e.target.value)} onBlur={() => label.trim() && onRename(label)} aria-label="구역 이름" />
        <div className="tact">
          <button type="button" className="iconbtn" aria-label="위로" onClick={onMoveUp}>
            ↑
          </button>
          <button type="button" className="iconbtn" aria-label="아래로" onClick={onMoveDown}>
            ↓
          </button>
          <button type="button" className="iconbtn" style={{ color: "var(--warn)" }} aria-label="구역 삭제" disabled={!canRemove} onClick={onRemove}>
            ✕
          </button>
        </div>
      </div>
      {zone.kind === "shelf" && (
        <div className="row2" style={{ alignItems: "center" }}>
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <span className="hint" style={{ margin: 0 }}>
              단 개수
            </span>
            <input
              type="number"
              className="inp mini"
              style={{ width: 50 }}
              min={1}
              max={8}
              value={zone.tiers ?? 4}
              onChange={(e) => onSetTiers(Number(e.target.value) || 1)}
              aria-label={`${zone.label} 단 개수`}
            />
          </label>
          <button type="button" className="chip sm" aria-pressed={!!zone.hasTop} onClick={() => onSetHasTop(!zone.hasTop)}>
            맨 위 칸 {zone.hasTop ? "있음" : "없음"}
          </button>
        </div>
      )}
    </div>
  );
}

export function WarehouseTab() {
  const { cells, zones, canWrite, checkShare, setCell, renameZone, setZoneTiers, setZoneHasTop, moveZone, addZone, removeZone } = useWarehouse();
  const [editing, setEditing] = useState<{ id: string; label: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [structureOpen, setStructureOpen] = useState(false);

  const panels = zones.map(zonePanel);
  const allIds = allCellIds(zones);

  const open = (id: string, label: string) => {
    setEditing({ id, label });
    setDraft(cells[id]?.text || "");
    setErr("");
  };

  const save = async () => {
    const msg = checkShare(draft);
    if (msg) {
      setErr(msg);
      return;
    }
    if (editing) await setCell(editing.id, draft);
    setEditing(null);
  };

  const filledCount = allIds.filter((id) => cells[id]?.text).length;

  if (!canWrite) {
    return (
      <>
        <h1 className="ptitle">창고</h1>
        <p className="hint center">직원·관리자만 볼 수 있어요.</p>
      </>
    );
  }

  return (
    <>
      <h1 className="ptitle">창고</h1>
      <Card title="창고 둘러보기" right={<span className="sub">{filledCount}/{allIds.length}칸 사용 중</span>}>
        <p className="hint" style={{ margin: 0 }}>
          {viewMode === "map" ? "구역을 드래그해서 회전하며 볼 수 있어요. 칸을 눌러 뭐가 있는지 적어두세요." : "칸을 검색하거나 눌러서 바로 고칠 수 있어요."}
        </p>
        <div className="seg">
          <button type="button" aria-pressed={viewMode === "map"} onClick={() => setViewMode("map")}>
            지도로 보기
          </button>
          <button type="button" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")}>
            목록으로 보기
          </button>
        </div>

        {viewMode === "map" ? <Carousel panels={panels} cells={cells} onOpenCell={open} /> : <ListView panels={panels} cells={cells} onOpenCell={open} />}

        <button type="button" className="link" style={{ alignSelf: "flex-start", fontSize: 12.5 }} onClick={() => setStructureOpen(!structureOpen)}>
          {structureOpen ? "구조 편집 닫기" : "구역 이름·구조 편집"}
        </button>
        {structureOpen && (
          <div className="wh-structure">
            {zones.map((z) => (
              <ZoneEditor
                key={z.id}
                zone={z}
                canRemove={zones.length > 1}
                onRename={(label) => renameZone(z.id, label)}
                onSetTiers={(t) => setZoneTiers(z.id, t)}
                onSetHasTop={(v) => setZoneHasTop(z.id, v)}
                onMoveUp={() => moveZone(z.id, -1)}
                onMoveDown={() => moveZone(z.id, 1)}
                onRemove={() => removeZone(z.id)}
              />
            ))}
            <div className="row2">
              <button type="button" className="btn sm" onClick={() => addZone("shelf")}>
                + 선반 추가
              </button>
              <button type="button" className="btn sm" onClick={() => addZone("area")}>
                + 넓은 공간 추가
              </button>
            </div>
          </div>
        )}
      </Card>

      {editing && (
        <div className="sheet" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div className="cardhead">
              <h2 style={{ fontSize: 16, margin: 0 }}>{editing.label}</h2>
              <button type="button" className="link" onClick={() => setEditing(null)}>
                닫기
              </button>
            </div>
            <textarea
              className="inp"
              rows={5}
              autoFocus
              placeholder="예: 레드미 패드 2프로 박스 3개, 충전기 여유분"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            {err && (
              <p className="hint" style={{ color: "var(--warn)" }}>
                {err}
              </p>
            )}
            {cells[editing.id]?.byName && (
              <p className="hint" style={{ margin: 0 }}>
                마지막 수정: {cells[editing.id].byName}
              </p>
            )}
            <button type="button" className="btn pri wide" onClick={save}>
              저장
            </button>
          </div>
        </div>
      )}
    </>
  );
}
