"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ago, won } from "@/lib/format";
import { useAuth } from "@/context/auth-context";
import { useRequests } from "@/lib/use-requests";
import type { useShared } from "@/lib/use-shared";
import type { ProductGroup } from "@/types/product";

const PHONE_RE = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/;

interface RivalForm {
  n: string;
  b: string;
  p: number;
  url: string;
  src: string;
  pts: string;
}

const blank: RivalForm = { n: "", b: "", p: 0, url: "", src: "", pts: "" };

export function RivalCard({ grp, shared }: { grp: ProductGroup; shared: ReturnType<typeof useShared> }) {
  const { uid, role } = useAuth();
  const reqs = useRequests();
  const list = [...shared.rivals].filter((r) => r.group === grp.id).sort((a, b) => (a.p || 9e12) - (b.p || 9e12));
  const [f, setF] = useState<RivalForm>(blank);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const set = (p: Partial<RivalForm>) => setF({ ...f, ...p });

  const add = async () => {
    if (!f.n.trim() || !f.b.trim()) {
      setErr("제품명과 브랜드를 적어주세요.");
      return;
    }
    if (!f.src.trim()) {
      setErr("출처를 적어주세요. (예: 다나와 최저가 10/19, 브랜드 공식몰)");
      return;
    }
    const url = f.url.trim();
    if (url && !/^https?:\/\//.test(url)) {
      setErr("상세 링크는 https://로 시작해야 해요.");
      return;
    }
    if (PHONE_RE.test(f.pts + f.src)) {
      setErr("전화번호처럼 보이는 내용은 적을 수 없어요.");
      return;
    }
    const body = { group: grp.id, n: f.n.trim().slice(0, 80), b: f.b.trim().slice(0, 40), p: f.p || null, url, src: f.src.trim().slice(0, 120), pts: f.pts.trim().slice(0, 300) };
    setBusy(true);
    try {
      if (editId) await shared.editRival(editId, body);
      else await shared.addRival(body);
      setF(blank);
      setOpen(false);
      setErr("");
      setEditId(null);
    } catch {
      setErr("저장하지 못했어요. 참여자 이상 권한이 필요해요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={grp.label + " 경쟁 제품"} right={<span className="sub">직원 공유 · {list.length}개</span>}>
      <p className="hint">매장에서 비교 질문을 많이 받는 경쟁 제품을 출처와 함께 남겨주세요. 모든 직원에게 보여요.</p>
      {list.map((r) => {
        const isMine = r.by === uid;
        const pending = reqs.pendingFor("rival", r.id);
        return (
          <div className="rival" key={r.id}>
            <div className="rh">
              <span>
                <i className="brand">{r.b}</i>
                <b>{r.n}</b>
              </span>
              <b>{r.p ? won(r.p) : "가격 미기재"}</b>
            </div>
            {r.pts && <p>{r.pts}</p>}
            <small>
              출처: {r.src}
              {r.at ? ` · ${ago(r.at)}` : ""}
              {r.url && (
                <>
                  {" "}
                  ·{" "}
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="olink">
                    상세 ↗
                  </a>
                </>
              )}
              {isMine && (
                <>
                  {" "}
                  ·{" "}
                  <button
                    type="button"
                    className="link"
                    onClick={() => {
                      setF({ n: r.n, b: r.b, p: r.p || 0, url: r.url || "", src: r.src || "", pts: r.pts || "" });
                      setEditId(r.id);
                      setOpen(true);
                    }}
                  >
                    수정
                  </button>
                </>
              )}
              {" · "}
              {role === "admin" ? (
                <button type="button" className="link danger" onClick={() => shared.deleteRival(r.id)}>
                  삭제
                </button>
              ) : (
                role !== "guest" && (
                  <button type="button" className="link" style={{ color: "var(--muted)" }} disabled={pending} onClick={() => reqs.add({ kind: "rival", target: r.id, label: (r.b ? r.b + " " : "") + r.n })}>
                    {pending ? "요청됨" : "삭제 요청"}
                  </button>
                )
              )}
            </small>
          </div>
        );
      })}
      {list.length === 0 && <p className="hint">아직 추가된 경쟁 제품이 없어요.</p>}
      {shared.canWrite &&
        (open ? (
          <div className="box">
            <div className="grid2">
              <label className="field" htmlFor={"rv-n-" + grp.id}>
                <span>
                  <span>제품명</span>
                </span>
                <input id={"rv-n-" + grp.id} className="inp" placeholder="예: 비스포크 큐브 에어" value={f.n} onChange={(e) => set({ n: e.target.value })} />
              </label>
              <label className="field" htmlFor={"rv-b-" + grp.id}>
                <span>
                  <span>브랜드</span>
                </span>
                <input id={"rv-b-" + grp.id} className="inp" placeholder="예: 삼성" value={f.b} onChange={(e) => set({ b: e.target.value })} />
              </label>
            </div>
            <div className="grid2">
              <label className="field" htmlFor={"rv-p-" + grp.id}>
                <span>
                  <span>가격</span>
                </span>
                <input id={"rv-p-" + grp.id} className="inp" inputMode="numeric" value={f.p || ""} onChange={(e) => set({ p: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })} />
              </label>
              <label className="field" htmlFor={"rv-s-" + grp.id}>
                <span>
                  <span>출처 (필수)</span>
                </span>
                <input id={"rv-s-" + grp.id} className="inp" placeholder="예: 다나와 최저가 10/19" value={f.src} onChange={(e) => set({ src: e.target.value })} />
              </label>
            </div>
            <label className="field" htmlFor={"rv-u-" + grp.id}>
              <span>
                <span>상세 링크</span>
              </span>
              <input id={"rv-u-" + grp.id} className="inp" placeholder="https://..." value={f.url} onChange={(e) => set({ url: e.target.value })} />
            </label>
            <label className="field" htmlFor={"rv-f-" + grp.id}>
              <span>
                <span>특장점 (선택)</span>
              </span>
              <input id={"rv-f-" + grp.id} className="inp" placeholder="예: 물걸레 겸용 · 전국 AS망" value={f.pts} onChange={(e) => set({ pts: e.target.value })} />
            </label>
            {err && <div className="alert">{err}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn sm"
                onClick={() => {
                  setOpen(false);
                  setErr("");
                  setEditId(null);
                  setF(blank);
                }}
              >
                취소
              </button>
              <button type="button" className="btn pri sm" disabled={busy} onClick={add}>
                {busy ? "저장 중…" : editId ? "수정 저장" : "추가"}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn dash" onClick={() => setOpen(true)}>
            + 경쟁 제품 추가
          </button>
        ))}
    </Card>
  );
}
