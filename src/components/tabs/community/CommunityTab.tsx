"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useCommunity } from "@/lib/use-community";
import { useRequests } from "@/lib/use-requests";
import { relTime } from "@/lib/format";
import type { Post, PostTag } from "@/types/shared";

const POST_TAGS: [PostTag, string][] = [
  ["good", "👍 잘 된 세일즈"],
  ["warn", "⚠ 컴플레인·주의"],
  ["ask", "❓ 질문"],
  ["notice", "📢 공지"],
  ["free", "💬 자유"],
];

const PHONE_RE = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/;
const MONEY_RE = /\d[\d,]{4,}\s*원|\d+(\.\d+)?\s*(만|억)\s*원?\s*(매출|달성|실적)|매출\s*\d/;

function checkShare(t: string): string {
  if (PHONE_RE.test(t)) return "전화번호처럼 보이는 내용이 있어요. 고객 연락처는 공유방에 적을 수 없어요.";
  if (MONEY_RE.test(t)) return "매출·실적 금액처럼 보이는 내용이 있어요. 회사 기밀이라 공유방에는 적지 말아주세요.";
  return "";
}

function PostCard({ p, comm }: { p: Post; comm: ReturnType<typeof useCommunity> }) {
  const { uid, role } = useAuth();
  const reqs = useRequests();
  const [c, setC] = useState("");
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const [ed, setEd] = useState(false);
  const [et, setEt] = useState("");
  const cs = comm.comments.filter((x) => x.postId === p.id);
  const likes = Object.keys(p.likes || {}).length;
  const liked = !!uid && !!(p.likes || {})[uid];
  const tl = (POST_TAGS.find((t) => t[0] === p.tag) || POST_TAGS[4])[1];
  const isMine = p.by === uid;
  const isAdmin = role === "admin";
  const pending = reqs.pendingFor("post", p.id);

  const send = async () => {
    const t = c.trim();
    if (!t) return;
    const e = checkShare(t);
    if (e) {
      setErr(e);
      return;
    }
    if (await comm.comment(p.id, t.slice(0, 500))) {
      setC("");
      setErr("");
    }
  };

  return (
    <section className={"card post t-" + p.tag}>
      <div className="phd">
        <span className={"ptag t-" + p.tag}>{tl}</span>
        <span className="sub">
          {isMine ? "나" : p.byName || "동료"} · {p.store || ""} · {relTime(p.at)}
        </span>
      </div>
      {p.prod && <span className="pprod">{p.prod}</span>}
      {ed ? (
        <>
          <textarea className="inp" rows={3} value={et} onChange={(e) => setEt(e.target.value)} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn sm" onClick={() => setEd(false)}>
              취소
            </button>
            <button
              type="button"
              className="btn pri sm"
              onClick={async () => {
                const t = et.trim();
                const e = checkShare(t);
                if (e) {
                  setErr(e);
                  return;
                }
                if (t && (await comm.edit(p.id, { text: t.slice(0, 1000) }))) {
                  setEd(false);
                  setErr("");
                }
              }}
            >
              저장
            </button>
          </div>
        </>
      ) : (
        <p className="ptext">
          {p.text}
          {p.editedAt && <small className="sub"> (수정됨)</small>}
        </p>
      )}
      <div className="pact">
        <button type="button" className={"link" + (liked ? " on" : "")} aria-pressed={liked} onClick={() => comm.like(p)}>
          {liked ? "♥" : "♡"} 도움돼요 {likes || ""}
        </button>
        <button type="button" className="link" onClick={() => setOpen(!open)}>
          댓글 {cs.length || ""}
        </button>
        <span style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          {isMine && (
            <button
              type="button"
              className="link"
              onClick={() => {
                setEd(true);
                setEt(p.text);
              }}
            >
              수정
            </button>
          )}
          {isAdmin ? (
            <button type="button" className="link danger" onClick={() => comm.del(p.id)}>
              삭제
            </button>
          ) : (
            role !== "guest" && (
              <button type="button" className="link" style={{ color: "var(--muted)" }} disabled={pending} onClick={() => reqs.add({ kind: "post", target: p.id, label: p.text.slice(0, 60) })}>
                {pending ? "요청됨" : "삭제 요청"}
              </button>
            )
          )}
        </span>
      </div>
      {(open || cs.length > 0) && (
        <div className="cmts">
          {cs.map((x) => (
            <div className="cmt" key={x.id}>
              <b>{x.by === uid ? "나" : x.byName || "동료"}</b>
              <span>{x.text}</span>
              <small>{relTime(x.at)}</small>
            </div>
          ))}
          {open && (
            <div style={{ display: "flex", gap: 6 }}>
              <input className="inp" placeholder="댓글 달기" value={c} onChange={(e) => setC(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
              <button type="button" className="btn sm" style={{ whiteSpace: "nowrap" }} onClick={send}>
                등록
              </button>
            </div>
          )}
          {err && <div className="alert">{err}</div>}
        </div>
      )}
    </section>
  );
}

export function CommunityTab({ storeLabel }: { storeLabel: string }) {
  const comm = useCommunity();
  const [tag, setTag] = useState<PostTag>("good");
  const [text, setText] = useState("");
  const [prod, setProd] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<PostTag | "all">("all");

  const post = async () => {
    const t = text.trim();
    if (!t) return;
    const e = checkShare(t + " " + prod);
    if (e) {
      setErr(e);
      return;
    }
    setBusy(true);
    const ok = await comm.add({ tag, text: t.slice(0, 1000), prod: prod.trim().slice(0, 60), store: storeLabel });
    setBusy(false);
    if (ok) {
      setText("");
      setProd("");
      setErr("");
    } else setErr("올리지 못했어요.");
  };

  const list = comm.posts.filter((p) => filter === "all" || p.tag === filter);

  return (
    <>
      <section className="card" style={{ gap: 10 }}>
        <h2>글쓰기</h2>
        <div className="chips">
          {POST_TAGS.map(([k, l]) => (
            <button key={k} type="button" className="chip" aria-pressed={tag === k} onClick={() => setTag(k)}>
              {l}
            </button>
          ))}
        </div>
        <textarea className="inp" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="오늘 잘 된 세일즈나 주의할 점을 공유해주세요" />
        <input className="inp" placeholder="관련 제품 (선택)" value={prod} onChange={(e) => setProd(e.target.value)} />
        {err && <div className="alert">{err}</div>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span className="hint">고객 이름·연락처, 매출 금액은 적지 마세요</span>
          <button type="button" className="btn pri sm" disabled={busy || !text.trim() || !comm.canWrite} onClick={post}>
            {busy ? "올리는 중…" : "올리기"}
          </button>
        </div>
      </section>

      <div className="chips">
        <button type="button" className="chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
          전체
        </button>
        {POST_TAGS.map(([k, l]) => (
          <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {l}
          </button>
        ))}
      </div>

      {list.length === 0 && <p className="hint" style={{ textAlign: "center", padding: "20px 0" }}>아직 글이 없어요.</p>}
      {list.map((p) => (
        <PostCard key={p.id} p={p} comm={comm} />
      ))}
    </>
  );
}
