"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useWarehouse } from "@/lib/use-warehouse";
import {
  ALL_CELL_IDS,
  WAREHOUSE_CORNER,
  WAREHOUSE_MIDDLE,
  WAREHOUSE_RIGHT_FLOOR,
  WAREHOUSE_SHELVES,
  shelfCellId,
  shelfCellLabel,
} from "@/data/warehouse-layout";

const MAX_ANGLE = 42; // 도. 중앙에서 멀어질수록 이만큼까지 옆벽처럼 회전된다.
const DEPTH = 160; // px. 옆으로 밀려날수록 안쪽으로 들어가 보이게 하는 양.

interface Panel {
  id: string;
  label: string;
  sub?: string;
  cells: { id: string; label: string }[];
}

function CellBox({ label, text, onOpen }: { label: string; text: string; onOpen: () => void }) {
  return (
    <button type="button" className={"wh-cell" + (text ? " filled" : "")} onClick={onOpen}>
      <span className="wh-cell-label">{label}</span>
      <span className="wh-cell-text">{text || "비어있음"}</span>
    </button>
  );
}

export function WarehouseTab() {
  const { cells, canWrite, checkShare, setCell } = useWarehouse();
  const [editing, setEditing] = useState<{ id: string; label: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");
  const [active, setActive] = useState(0);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const panels: Panel[] = [
    { id: WAREHOUSE_CORNER.id, label: WAREHOUSE_CORNER.label, cells: [{ id: WAREHOUSE_CORNER.id, label: "" }] },
    ...WAREHOUSE_SHELVES.map((shelf) => ({
      id: shelf.id,
      label: shelf.label,
      cells: [1, 2, 3, 4].map((tier) => ({ id: shelfCellId(shelf.id, tier), label: shelfCellLabel(shelf, tier) })),
    })),
    { id: WAREHOUSE_MIDDLE.id, label: WAREHOUSE_MIDDLE.label, sub: WAREHOUSE_MIDDLE.sub, cells: [{ id: WAREHOUSE_MIDDLE.id, label: "" }] },
    { id: WAREHOUSE_RIGHT_FLOOR.id, label: WAREHOUSE_RIGHT_FLOOR.label, sub: WAREHOUSE_RIGHT_FLOOR.sub, cells: [{ id: WAREHOUSE_RIGHT_FLOOR.id, label: "" }] },
  ];

  const applyTransforms = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const containerCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    let closestIdx = 0;
    let closestDist = Infinity;
    panelRefs.current.forEach((el, i) => {
      if (!el) return;
      const panelCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = panelCenter - containerCenter;
      const ratio = Math.max(-1, Math.min(1, dist / (scroller.clientWidth / 2)));
      const angle = ratio * MAX_ANGLE;
      const z = -Math.abs(ratio) * DEPTH;
      const opacity = 1 - Math.abs(ratio) * 0.55;
      el.style.transform = `perspective(1000px) rotateY(${-angle}deg) translateZ(${z}px)`;
      el.style.opacity = String(Math.max(0.35, opacity));
      // 패널끼리 겹칠 때 가운데가 위로 오는 정도만 필요 — .sheet(z-index:20)보다 한참 낮게 묶어둔다.
      el.style.zIndex = String(10 - Math.round(Math.abs(ratio) * 9));
      if (Math.abs(dist) < closestDist) {
        closestDist = Math.abs(dist);
        closestIdx = i;
      }
    });
    setActive(closestIdx);
  };

  const onScroll = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      applyTransforms();
    });
  };

  useEffect(() => {
    applyTransforms();
    const onResize = () => applyTransforms();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const goTo = (i: number) => {
    const el = panelRefs.current[Math.max(0, Math.min(panels.length - 1, i))];
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

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

  const filledCount = ALL_CELL_IDS.filter((id) => cells[id]?.text).length;

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
      <Card title="창고 둘러보기" right={<span className="sub">{filledCount}/{ALL_CELL_IDS.length}칸 사용 중</span>}>
        <p className="hint" style={{ margin: 0 }}>
          옆으로 스크롤하면 구역을 돌아가며 볼 수 있어요. 칸을 눌러 뭐가 있는지 적어두세요.
        </p>
        <div className="wh-nav">
          <button type="button" className="iconbtn" aria-label="이전 구역" disabled={active === 0} onClick={() => goTo(active - 1)}>
            ‹
          </button>
          <div className="wh-dots">
            {panels.map((p, i) => (
              <button key={p.id} type="button" className={"wh-dot" + (i === active ? " on" : "")} aria-label={p.label} onClick={() => goTo(i)} />
            ))}
          </div>
          <button type="button" className="iconbtn" aria-label="다음 구역" disabled={active === panels.length - 1} onClick={() => goTo(active + 1)}>
            ›
          </button>
        </div>
        <div className="wh-scroller" ref={scrollerRef} onScroll={onScroll}>
          {panels.map((p, i) => (
            <div
              className="wh-panel"
              key={p.id}
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
            >
              <div className="wh-panel-label">
                {p.label}
                {p.sub && <small>{p.sub}</small>}
              </div>
              <div className={"wh-panel-cells" + (p.cells.length > 1 ? " stack" : "")}>
                {p.cells.map((c) => (
                  <CellBox key={c.id} label={c.label} text={cells[c.id]?.text || ""} onOpen={() => open(c.id, c.label ? `${p.label} ${c.label}` : p.label)} />
                ))}
              </div>
            </div>
          ))}
        </div>
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
