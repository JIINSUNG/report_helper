"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocalReports } from "@/lib/local-reports";
import { getClose, getOpen } from "@/lib/local-reports";
import { closeText, openText } from "@/lib/report-text";
import { retroText } from "@/lib/retro-utils";
import { amountRemaining, mapsFor } from "@/lib/custom-sections";
import { shift, parts, today as todayStr } from "@/lib/format";
import { holidayName } from "@/data/holidays";
import { OpenTab } from "@/components/tabs/open/OpenTab";
import { RecordTab } from "@/components/tabs/record/RecordTab";
import { CloseTab } from "@/components/tabs/close/CloseTab";
import { SalesTab } from "@/components/tabs/sales/SalesTab";
import { RetroTab } from "@/components/tabs/retro/RetroTab";
import { TodoTab } from "@/components/tabs/todo/TodoTab";
import { SettingsTab } from "@/components/tabs/settings/SettingsTab";
import { ProductsTab } from "@/components/tabs/products/ProductsTab";
import { ServiceTab } from "@/components/tabs/service/ServiceTab";
import { ScheduleTab } from "@/components/tabs/schedule/ScheduleTab";
import { CommunityTab } from "@/components/tabs/community/CommunityTab";
import { AdminTab } from "@/components/tabs/admin/AdminTab";
import { useRequests } from "@/lib/use-requests";
import { TabGuide } from "@/components/ui/TabGuide";
import { TAB_OPTIONS } from "@/data/tabs";

const WD = "일월화수목금토";

function dayLabel(date: string) {
  const [y, m, d] = parts(date);
  const hol = holidayName(date);
  return `${m}월 ${d}일 (${WD[new Date(y, m - 1, d).getDay()]})${hol ? " · " + hol : ""}`;
}

const TABS: [string, string][] = [["todo", "할일"], ...TAB_OPTIONS];
const TAB_KEY = "report-helper-tab:v1";

function readLastTab(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TAB_KEY);
  } catch {
    return null;
  }
}

function AdminNavBadge() {
  const reqs = useRequests();
  const n = reqs.list.filter((r) => r.status === "open").length;
  if (!n) return null;
  return <i className="navbadge">{n}</i>;
}

export function AppShell() {
  const { role, store, name, logout } = useAuth();
  const initialStoreLabel = role === "guest" ? "매장" : store ?? "매장";
  const { data, update } = useLocalReports(initialStoreLabel);
  const storeLabel = role === "admin" ? data.settings.storeName : initialStoreLabel;
  const [date, setDate] = useState(todayStr());
  const [savedTab, setTabRaw] = useState<string>(() => readLastTab() ?? "record");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState("");

  const isGuest = role === "guest";
  const isAdmin = role === "admin";
  const tabs = TABS.filter(([id]) => !(isGuest && (id === "community" || id === "schedule")));
  if (isAdmin) tabs.push(["admin", "관리"]);

  const tab = tabs.some(([id]) => id === savedTab) ? savedTab : "record";

  const setTab = (id: string) => {
    setTabRaw(id);
    try {
      window.localStorage.setItem(TAB_KEY, id);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  const activeNavBtnRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    activeNavBtnRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [tab]);

  const text = useMemo(() => {
    const customDefs = data.settings.customSections || [];
    const remainingFor = (defId: string) => {
      const def = customDefs.find((d) => d.id === defId);
      if (!def || def.type !== "amount" || def.totalBudget == null) return null;
      return amountRemaining(mapsFor(def, data.opens, data.closes), defId, def.totalBudget, date);
    };
    if (tab === "open") return openText(getOpen(data, date), storeLabel, customDefs, remainingFor);
    if (tab === "close") return closeText(getClose(data, date), storeLabel, data.settings.inventoryNote, customDefs, remainingFor);
    if (tab === "retro") return retroText(data, date);
    return "";
  }, [tab, data, date, storeLabel]);

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
    setToast("복사했어요. 미워크에 붙여넣으세요");
    setTimeout(() => setToast(""), 1800);
  };

  return (
    <>
      <div className="wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, paddingTop: 10, fontSize: 13 }}>
        <span style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0 }}>
          <i className={`rolechip${role === "admin" ? " r-admin" : ""}`}>
            {role === "admin" ? "관리자" : role === "staff" ? "직원" : "게스트"}
          </i>
          <span className="sub" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name}
            {store ? ` · ${store}` : ""}
          </span>
        </span>
        <button type="button" className="btn sm" onClick={logout}>
          로그아웃
        </button>
      </div>

      <header>
        <div className="wrap">
          <div className="top">
            <h1>
              {isGuest ? "" : storeLabel + " "}
              <span>보고 도우미</span>
            </h1>
            {tab !== "settings" && tab !== "products" && tab !== "community" && tab !== "schedule" && tab !== "admin" && tab !== "service" && (
              <div className="datebox">
                <button type="button" className="iconbtn" aria-label="이전 날" onClick={() => setDate(shift(date, -1))}>
                  ‹
                </button>
                <label>
                  {dayLabel(date)}
                  <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
                </label>
                <button type="button" className="iconbtn" aria-label="다음 날" onClick={() => setDate(shift(date, 1))}>
                  ›
                </button>
              </div>
            )}
          </div>
          <nav>
            {tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-current={tab === id}
                onClick={() => setTab(id)}
                style={{ position: "relative" }}
                ref={tab === id ? activeNavBtnRef : undefined}
              >
                {label}
                {id === "admin" && isAdmin && <AdminNavBadge />}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="wrap">
        {["open", "record", "close", "sales", "retro"].includes(tab) && (
          <div className="localnote" role="note">
            <b>🔒 이 기기에만 저장</b> 매출·목표·고객 정보는 법적 문제 방지를 위해 서버에 저장하지 않아요. 브라우저
            캐시·사이트 데이터를 지우거나 기기를 바꾸면 사라져요. 남겨둘 내용은 복사해서 개인 메모에 따로
            보관하세요.
          </div>
        )}

        <TabGuide key={tab} tab={tab} />

        {tab === "todo" && <TodoTab setTab={setTab} />}
        {tab === "open" && <OpenTab data={data} update={update} date={date} storeLabel={storeLabel} isGuest={isGuest} goSchedule={() => setTab("schedule")} />}
        {tab === "record" && <RecordTab data={data} update={update} date={date} />}
        {tab === "close" && <CloseTab data={data} update={update} date={date} storeLabel={storeLabel} isGuest={isGuest} goSchedule={() => setTab("schedule")} />}
        {tab === "sales" && <SalesTab data={data} update={update} date={date} goRecord={() => setTab("record")} />}
        {tab === "retro" && <RetroTab data={data} update={update} date={date} setDate={setDate} />}
        {tab === "settings" && <SettingsTab data={data} update={update} />}
        {tab === "products" && <ProductsTab />}
        {tab === "service" && <ServiceTab />}
        {tab === "schedule" && !isGuest && <ScheduleTab storeLabel={storeLabel} />}
        {tab === "community" && !isGuest && <CommunityTab storeLabel={storeLabel} />}
        {tab === "admin" && isAdmin && <AdminTab />}
      </main>

      {text && (
        <div className="bar">
          <div className="wrap">
            <button type="button" className="btn" onClick={() => setSheetOpen(true)}>
              미리보기
            </button>
            <button type="button" className="btn pri" onClick={doCopy}>
              {tab === "open" ? "오픈보고" : tab === "close" ? "마감보고" : "회고"} 복사
            </button>
          </div>
        </div>
      )}

      {sheetOpen && (
        <div className="sheet" onClick={() => setSheetOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div className="cardhead">
              <h2 style={{ fontSize: 16, margin: 0 }}>미리보기</h2>
              <button type="button" className="link" onClick={() => setSheetOpen(false)}>
                닫기
              </button>
            </div>
            <pre>{text}</pre>
            <button type="button" className="btn pri" onClick={doCopy}>
              복사하기
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
