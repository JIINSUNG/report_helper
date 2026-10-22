"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Num, Txt, Stepper } from "@/components/ui/Fields";
import { ItemPicker } from "@/components/ui/ItemPicker";
import { EXTRA_ITEMS } from "@/data/report-items";
import { CATS } from "@/data/record-options";
import { DEFS_BASE, blankReportData } from "@/lib/local-reports";
import { today } from "@/lib/format";
import { useAuth } from "@/context/auth-context";
import { StorePicker } from "./StorePicker";
import { CustomSectionsManager } from "./CustomSectionsManager";
import type { LocalReportData, ReportDefaults, ReportItemSetting } from "@/types/report";

function DefaultsCard({
  data,
  update,
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
}) {
  const init = () => ({ df: { ...DEFS_BASE, ...(data.settings.defaults ?? {}) } as ReportDefaults, items: data.settings.items });
  const [dr, setDr] = useState(init);
  const [saved, setSaved] = useState(false);
  const df = dr.df;
  const items = dr.items;
  const ym = today().slice(0, 7);
  const mt = df.monthTargets || {};
  const setD = (p: Partial<ReportDefaults>) => {
    setDr((x) => ({ ...x, df: { ...x.df, ...p } }));
    setSaved(false);
  };
  const setItems = (v: ReportItemSetting[]) => {
    setDr((x) => ({ ...x, items: v }));
    setSaved(false);
  };
  const setIt = (i: number, p: Partial<ReportItemSetting>) => setItems(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const cur = init();
  const dirty = JSON.stringify(cur) !== JSON.stringify(dr);
  const save = () => {
    update((d) => ({ ...d, settings: { ...d.settings, defaults: dr.df, items: dr.items } }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card
      title="기본값"
      right={dirty ? <span className="tag warn">저장 안 됨</span> : saved ? <span className="tag ok">저장했어요</span> : <span className="sub">새 보고서를 만들 때 들어가는 값</span>}
    >
      <div className="grid2">
        <Num id="d-mt" label={`이번 달 목표 GMV (${Number(ym.slice(5))}월)`} value={mt[ym] || 0} onChange={(v) => setD({ monthTargets: { ...mt, [ym]: v } })} suf="원" />
        <Txt id="d-cv" label="목표 전환율" value={df.targetConversion} onChange={(v) => setD({ targetConversion: v })} suf="%" mode="decimal" />
      </div>
      <p className="hint" style={{ marginTop: -4 }}>
        달이 바뀌면 이번 달 목표가 비워져요. 새 달 목표를 한 번만 넣어주세요.
      </p>
      <div className="field">
        <span>
          보고 품목 · 품목별 기본 목표 대수 <span>오픈·마감에 처음부터 들어가요</span>
        </span>
        <div className="itgrid">
          <span />
          <span className="sub">평일</span>
          <span className="sub">주말·공휴일</span>
          <span />
          {items.map((it, i) => (
            <div className="itname" key={it.name} style={{ display: "contents" }}>
              <div className="itname">
                <b>{it.name}</b>
                <select id={`s-cat${i}`} className="inp mini" aria-label={`${it.name} 기록 카테고리`} value={it.cat} onChange={(e) => setIt(i, { cat: e.target.value })}>
                  {CATS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <Stepper value={it.wd ?? df.weekdayTarget} onChange={(v) => setIt(i, { wd: v })} />
              <Stepper value={it.we ?? df.weekendTarget} onChange={(v) => setIt(i, { we: v })} />
              <button type="button" className="link danger" aria-label={`${it.name} 빼기`} onClick={() => setItems(items.filter((_, j) => j !== i))}>
                빼기
              </button>
            </div>
          ))}
        </div>
        <ItemPicker
          items={items as never}
          onChange={(v) => setItems(v.map((x) => items.find((y) => y.name === x.name) || { name: x.name, cat: EXTRA_ITEMS.find((e) => e.name === x.name)?.cat || "기타", wd: 0, we: 1 }) as ReportItemSetting[])}
          make={(n) => ({ name: n, target: 0, actual: 0 })}
          hint="매일 보고하는 품목"
        />
        <p className="hint">&apos;기록&apos; 카테고리는 기록 탭에서 그 카테고리로 판매를 찍으면 마감보고 판매 수량으로 계산된다는 뜻이에요.</p>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {dirty && (
          <button
            type="button"
            className="btn"
            onClick={() => {
              setDr(init());
              setSaved(false);
            }}
          >
            되돌리기
          </button>
        )}
        <button type="button" className="btn pri" style={{ flex: 1 }} disabled={!dirty} onClick={save}>
          {saved && !dirty ? "저장했어요 ✓" : dirty ? "기본값 저장" : "저장된 상태예요"}
        </button>
      </div>
      <p className="hint">저장한 값은 새로 만드는 보고서부터 들어가요. 이미 만든 오늘 보고서에는 바로 반영되지 않아요.</p>
    </Card>
  );
}

export function SettingsTab({
  data,
  update,
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
}) {
  const { role, store, name, setName } = useAuth();
  const [confirmReset, setConfirmReset] = useState(false);
  const [n, setN] = useState(name);

  return (
    <>
      <DefaultsCard data={data} update={update} />

      <Card title="매장">
        {role === "guest" ? (
          <p className="hint" style={{ margin: 0 }}>
            게스트는 지점 없이 이용해요. 보고서에는 &apos;매장&apos;으로 표시돼요.
          </p>
        ) : role === "staff" ? (
          <div>
            <p className="hint" style={{ margin: 0 }}>
              직원 로그인으로 <b>{store}</b>에 고정돼 있어요. 다른 지점은 로그아웃 후 다시 로그인하세요.
            </p>
            <p className="hint" style={{ margin: "8px 0 0" }}>
              내 이름 (일정·공유방 작성자로 표시)
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input className="inp" style={{ flex: 1 }} aria-label="내 이름" value={n} onChange={(e) => setN(e.target.value)} />
              <button type="button" className="btn sm" disabled={!n.trim() || n.trim() === name} onClick={() => setName(n)}>
                이름 저장
              </button>
            </div>
          </div>
        ) : (
          <StorePicker data={data} update={update} />
        )}
        <Txt id="s-inv" label="재고 확인 기본 문구" value={data.settings.inventoryNote} onChange={(v) => update((d) => ({ ...d, settings: { ...d.settings, inventoryNote: v } }))} />
        <label className="field" htmlFor="s-hol">
          <span>
            <span>추가 휴일</span>
            <span>예: 2026-12-31, 2027-01-02</span>
          </span>
          <input
            id="s-hol"
            className="inp"
            placeholder="임시공휴일 등 날짜를 쉼표로"
            value={data.settings.extraHolidays || ""}
            onChange={(e) => update((d) => ({ ...d, settings: { ...d.settings, extraHolidays: e.target.value } }))}
          />
        </label>
        <p className="hint">2026~2027년 공휴일은 미리 넣어두었어요. 추가 휴일은 주말 기준 목표로 계산돼요.</p>
      </Card>

      <CustomSectionsManager data={data} update={update} />

      <Card title="데이터 · 보안">
        <div className="secbox">
          <b>🔒 이 기기에만 저장</b>
          <span>오픈·마감보고, 매출·목표 GMV, 기록(고객 정보), 세일즈 보고, 회고</span>
          <small>서버로 보내지 않아요.</small>
        </div>
        <div className="secbox share">
          <b>👥 직원끼리 공유</b>
          <span>제품 가격·경쟁 제품, 제품별 세일즈 팁, 매장 일정, 공유방 글·댓글</span>
          <small>이 페이지를 쓰는 모든 직원에게 보여요. 고객 이름·연락처, 매출 숫자는 적지 마세요.</small>
        </div>
        <div className="warnbox">
          <b>⚠ 브라우저 캐시를 지우면 사라져요</b>
          <span>
            매출·목표·고객 정보는 법적 문제가 생기지 않도록 서버에 저장하지 않고 이 기기 브라우저에만 저장해요. 브라우저 캐시·사이트 데이터 삭제, 시크릿 모드, 기기 변경 시 되살릴 수 없어요. 남겨둘
            내용이 있으면 보고서·회고의 <b>복사</b> 버튼으로 개인 메모 앱 등에 따로 붙여넣어 두세요.
          </span>
        </div>
        {!confirmReset ? (
          <button type="button" className="btn" onClick={() => setConfirmReset(true)}>
            모든 데이터 지우고 빈 상태로 시작
          </button>
        ) : (
          <div className="alert">
            이 기기의 보고서·기록이 모두 지워져요.
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn sm" onClick={() => setConfirmReset(false)}>
                취소
              </button>
              <button
                type="button"
                className="btn pri sm"
                onClick={() => {
                  update(() => blankReportData(data.settings.storeName));
                  setConfirmReset(false);
                }}
              >
                지우기
              </button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
