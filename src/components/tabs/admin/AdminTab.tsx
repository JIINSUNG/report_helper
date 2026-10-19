"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { useRequests } from "@/lib/use-requests";
import { useCommunity } from "@/lib/use-community";
import { useShared } from "@/lib/use-shared";
import { useSchedule } from "@/lib/use-schedule";
import { useAuth } from "@/context/auth-context";
import { relTime } from "@/lib/format";
import type { DelReqKind } from "@/types/shared";

const AKIND: Record<DelReqKind, string> = { post: "공유방 글", comment: "댓글", tip: "세일즈 팁", rival: "경쟁 제품", event: "일정", product: "제품" };

export function AdminTab() {
  const { store } = useAuth();
  const reqs = useRequests();
  const comm = useCommunity();
  const shared = useShared();
  const sched = useSchedule(store || "매장");
  const [showDone, setShowDone] = useState(false);

  const open = reqs.list.filter((r) => r.status === "open");
  const done = reqs.list.filter((r) => r.status !== "open");

  const existsFor = (kind: DelReqKind, target: string) => {
    if (kind === "post") return comm.posts.some((p) => p.id === target);
    if (kind === "comment") return comm.comments.some((c) => c.id === target);
    if (kind === "tip") return shared.tips.some((t) => t.id === target);
    if (kind === "rival") return shared.rivals.some((r) => r.id === target);
    if (kind === "event") return sched.all.some((e) => e.id === target);
    if (kind === "product") return !!shared.overrides[target] && !shared.overrides[target].hidden;
    return false;
  };

  const doDelete = async (kind: DelReqKind, target: string) => {
    if (kind === "post") {
      for (const c of comm.comments.filter((c) => c.postId === target)) await comm.delComment(c.id);
      await comm.del(target);
    } else if (kind === "comment") await comm.delComment(target);
    else if (kind === "tip") await shared.deleteTip(target);
    else if (kind === "rival") await shared.deleteRival(target);
    else if (kind === "event") await sched.remove(target);
    else if (kind === "product") await shared.setHidden(target, true);
  };

  const approve = async (r: (typeof reqs.list)[number]) => {
    if (existsFor(r.kind, r.target)) await doDelete(r.kind, r.target);
    await reqs.close(r.id, "done");
  };

  return (
    <>
      <section className="card" style={{ gap: 6 }}>
        <div className="cardhead">
          <h2>관리자</h2>
          <span className="chip" aria-pressed="true">
            관리자 모드
          </span>
        </div>
        <p className="hint" style={{ margin: 0 }}>
          직원이 보낸 삭제 요청을 처리하고, 공유된 글·제품 정보를 확인·삭제할 수 있어요.
        </p>
      </section>

      <Card title="대기 중인 요청" right={<span className="sub">{open.length}건</span>}>
        {open.length === 0 && <p className="hint">대기 중인 삭제 요청이 없어요.</p>}
        {open.map((r) => (
          <div className="arow" key={r.id}>
            <div className="abody">
              <span className="akind">{AKIND[r.kind]} {r.kind === "product" ? "단종" : "삭제"} 요청</span>
              <b>{r.label}</b>
              <small>
                {relTime(r.at)}
                {r.reason ? " · 사유: " + r.reason : ""}
                {!existsFor(r.kind, r.target) ? " · 이미 없어진 항목" : ""}
              </small>
            </div>
            <div className="aact">
              <button type="button" className="btn sm" onClick={() => reqs.close(r.id, "rejected")}>
                반려
              </button>
              <button type="button" className="btn pri sm" onClick={() => approve(r)}>
                {r.kind === "product" ? "숨기기" : "삭제"}
              </button>
            </div>
          </div>
        ))}
      </Card>

      <button type="button" className="link" onClick={() => setShowDone(!showDone)}>
        {showDone ? "처리한 요청 접기" : `처리한 요청 보기 (${done.length})`}
      </button>
      {showDone && (
        <Card title="처리한 요청">
          {done.length === 0 && <p className="hint">아직 없어요.</p>}
          {done.map((r) => (
            <div className="arow" key={r.id}>
              <div className="abody">
                <span className="akind">{AKIND[r.kind]}</span>
                <b>{r.label}</b>
                <small>
                  {r.status === "done" ? "✓ 처리됨" : "반려됨"} · {relTime(r.doneAt)}
                </small>
              </div>
              <div className="aact">
                <button type="button" className="link" onClick={() => reqs.remove(r.id)}>
                  기록 지우기
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
