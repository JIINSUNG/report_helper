"use client";

import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useTodo } from "@/lib/use-todo";
import { monthKey, today, weekKey } from "@/lib/format";
import {
  ITEM_WHENS,
  SHIFTS,
  WD,
  WHENS,
  itemDueOn,
  secOn,
  todoBlank,
  todoSeed,
  type TodoData,
  type TodoExtraItem,
  type TodoItem,
  type TodoSection,
  type TodoWhen,
} from "@/data/todo-seed";
import { TODO_LINKS } from "@/data/retro-hints";
import { TAB_OPTIONS } from "@/data/tabs";
import { BriefingSheet } from "./BriefingSheet";
import { briefingEligibleSections, EVENT_KIND_LABEL, splitTodayTodos, upcomingScheduleActions } from "@/lib/briefing";
import { useSchedule } from "@/lib/use-schedule";
import { ActList } from "../schedule/ActList";

function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

function itemWhenLabel(w: TodoWhen | undefined) {
  return w && w !== "all" ? ITEM_WHENS.find(([k]) => k === w)?.[1] : "";
}

function repeatLabel(days: number[] | null | undefined, monthDay: number | null | undefined) {
  if (monthDay) return `매월 ${monthDay}일`;
  if (days) return days.map((d) => WD[d]).join("·");
  return "매일";
}

/** 요일 반복 ↔ 매월 특정 일 반복을 고르는 공용 패널. 항목 추가할 때·편집 모드에서 둘 다 쓴다. */
function RepeatPicker({
  days,
  monthDay,
  onToggleDay,
  onSetMonthDay,
}: {
  days: number[] | null | undefined;
  monthDay: number | null | undefined;
  onToggleDay: (d: number) => void;
  onSetMonthDay: (day: number | null) => void;
}) {
  return (
    <>
      <div className="chips" style={{ flexBasis: "100%" }}>
        <button type="button" className="chip" aria-pressed={!monthDay} onClick={() => onSetMonthDay(null)}>
          요일 반복
        </button>
        <button type="button" className="chip" aria-pressed={!!monthDay} onClick={() => onSetMonthDay(monthDay || new Date().getDate())}>
          매월 특정 일
        </button>
      </div>
      {monthDay ? (
        <div style={{ flexBasis: "100%", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="hint" style={{ margin: 0 }}>
            매월
          </span>
          <input
            type="number"
            className="inp mini"
            style={{ width: 60 }}
            min={1}
            max={31}
            value={monthDay}
            onChange={(e) => onSetMonthDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
            aria-label="매월 반복 일자"
          />
          <span className="hint" style={{ margin: 0 }}>
            일 · 31일 없는 달은 자동으로 건너뛰어요
          </span>
        </div>
      ) : (
        <div className="wdpick">
          {[...WD].map((w, d) => {
            const on = !days || days.includes(d);
            return (
              <button key={d} type="button" aria-pressed={on} aria-label={w + "요일"} onClick={() => onToggleDay(d)}>
                {w}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/** 반복을 "언제부터 언제까지"로 좁히는 패널 — 비워두면 기한 없이 항상 반복한다. */
function DateRangePicker({
  startDate,
  endDate,
  onSetStart,
  onSetEnd,
}: {
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  onSetStart: (v: string | null) => void;
  onSetEnd: (v: string | null) => void;
}) {
  return (
    <div style={{ flexBasis: "100%", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span className="hint" style={{ margin: 0, whiteSpace: "nowrap" }}>
        기간
      </span>
      <input
        type="date"
        className="inp mini"
        value={startDate || ""}
        onChange={(e) => onSetStart(e.target.value || null)}
        aria-label="반복 시작일"
      />
      <span className="hint" style={{ margin: 0 }}>
        ~
      </span>
      <input
        type="date"
        className="inp mini"
        value={endDate || ""}
        onChange={(e) => onSetEnd(e.target.value || null)}
        aria-label="반복 종료일"
      />
      {(startDate || endDate) && (
        <button
          type="button"
          className="link"
          style={{ fontSize: 12.5 }}
          onClick={() => {
            onSetStart(null);
            onSetEnd(null);
          }}
        >
          기한 없음으로
        </button>
      )}
    </div>
  );
}

const LONG_PRESS_MS = 500;

function useLongPress(onLongPress: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return {
    start: () => {
      firedRef.current = false;
      clear();
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        onLongPress();
      }, LONG_PRESS_MS);
    },
    cancel: clear,
    consumeFired: () => {
      if (!firedRef.current) return false;
      firedRef.current = false;
      return true;
    },
  };
}

const SWIPE_OPEN = 140;
const SWIPE_START_THRESHOLD = 8;

/** 항목을 왼쪽으로 슬라이드하면 오른쪽에 삭제 버튼이 드러난다. 길게 누르면(편집 모드 진입) 과 같은 포인터 제스처라서 한 곳에서 같이 다룬다. */
function useSwipeRow(onLongPress: () => void) {
  const [swipeX, setSwipeX] = useState(0);
  const longPress = useLongPress(onLongPress);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const swiping = useRef(false);
  const hadSwipe = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    startOffset.current = swipeX;
    swiping.current = false;
    longPress.start();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return; // 버튼을 안 누른 채 지나가는 hover 이동은 스와이프 제스처가 아니다
    const dx = e.clientX - startX.current;
    if (!swiping.current && Math.abs(dx) > SWIPE_START_THRESHOLD) {
      swiping.current = true;
      hadSwipe.current = true;
      longPress.cancel();
    }
    if (swiping.current) setSwipeX(Math.min(0, Math.max(-SWIPE_OPEN, startOffset.current + dx)));
  };

  const endSwipe = () => {
    longPress.cancel();
    if (swiping.current) setSwipeX((x) => (x < -SWIPE_OPEN / 2 ? -SWIPE_OPEN : 0));
    swiping.current = false;
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (swipeX !== 0) {
      e.preventDefault();
      e.stopPropagation();
      setSwipeX(0);
      hadSwipe.current = false;
      return;
    }
    if (hadSwipe.current || longPress.consumeFired()) {
      hadSwipe.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const close = () => setSwipeX(0);

  return {
    swipeX,
    close,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endSwipe,
      onPointerCancel: endSwipe,
      onClickCapture,
    },
  };
}

function TodoStart({ onPick }: { onPick: (d: TodoData) => void }) {
  return (
    <div className="card">
      <h2>나만의 할 일 체크리스트</h2>
      <p className="hint" style={{ margin: 0 }}>
        출근 전부터 퇴근까지 매일 챙길 일을 묶음별로 만들어 체크해요. 이 기기에만 저장되는 나만의 목록이에요.
      </p>
      <button type="button" className="btn pri" onClick={() => onPick(todoBlank())}>
        빈 목록으로 시작
      </button>
      <button type="button" className="btn" onClick={() => onPick(todoSeed())}>
        예시 목록으로 시작 <small className="sub">(출근 시·오픈·마감·퇴근 등 50여 개)</small>
      </button>
      <p className="hint" style={{ margin: 0 }}>
        예시로 시작해도 묶음과 항목을 자유롭게 고치고 지울 수 있어요.
      </p>
    </div>
  );
}

function SortableItemRow({
  item,
  edit,
  done,
  linkTab,
  onOpenTab,
  onToggle,
  onDelete,
  onOpenDays,
  daysOpen,
  onToggleDay,
  onSetMonthDay,
  onSetDateRange,
  onAddKid,
  kidOf,
  onRename,
  onSetLink,
  onRenameKid,
  onRequestEdit,
}: {
  item: TodoItem;
  edit: boolean;
  done: boolean;
  linkTab: [string, string] | null;
  onOpenTab: (id: string) => void;
  onToggle: () => void;
  onDelete: () => void;
  onOpenDays: () => void;
  daysOpen: boolean;
  onToggleDay: (d: number) => void;
  onSetMonthDay: (day: number | null) => void;
  onSetDateRange: (field: "startDate" | "endDate", value: string | null) => void;
  onAddKid: (text: string) => void;
  kidOf: TodoItem[];
  onRename: (text: string) => void;
  onSetLink: (tab: string | null) => void;
  onRenameKid: (kidId: string, text: string) => void;
  onRequestEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { sec: item.sec },
    disabled: !!item.parent,
  });
  // CSS.Transform.toString은 scaleX/scaleY도 같이 넣는데, 드래그 중 항목이 커졌다 작아졌다
  // 하는 게 보기 안 좋아서 이동(translate)만 적용한다.
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const [kidText, setKidText] = useState("");
  const [addingKid, setAddingKid] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameText, setRenameText] = useState(item.text);
  const dayTxt = repeatLabel(item.days, item.monthDay);
  const isKid = !!item.parent;
  const swipe = useSwipeRow(onRequestEdit);

  const confirmRename = () => {
    const v = renameText.trim();
    if (v) onRename(v);
    setRenaming(false);
  };

  if (edit && !isKid) {
    return (
      <div ref={setNodeRef} style={style} className="todo edit">
        <button type="button" className="grip" aria-label={item.text + " 끌어서 옮기기"} {...attributes} {...listeners}>
          ⠿
        </button>
        <div className="tbody">
          <input className="inp" style={{ fontWeight: 600 }} value={item.text} onChange={(e) => onRename(e.target.value)} aria-label="항목 이름" />
        </div>
        <div className="tact">
          <button type="button" className={"daybtn" + (daysOpen ? " on" : "")} aria-expanded={daysOpen} onClick={onOpenDays}>
            {dayTxt} ▾
          </button>
          <button type="button" className="iconbtn" style={{ color: "var(--warn)" }} aria-label="삭제" onClick={onDelete}>
            ✕
          </button>
        </div>
        <div style={{ flexBasis: "100%", display: "flex", gap: 8, alignItems: "center" }}>
          <span className="hint" style={{ margin: 0, whiteSpace: "nowrap" }}>
            탭 바로가기
          </span>
          <select className="inp mini" value={item.linkTab || ""} onChange={(e) => onSetLink(e.target.value || null)} aria-label={item.text + " 탭 바로가기"}>
            <option value="">자동 (내용으로 추측)</option>
            <option value="__none__">없음</option>
            {TAB_OPTIONS.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {daysOpen && (
          <>
            <RepeatPicker days={item.days} monthDay={item.monthDay} onToggleDay={onToggleDay} onSetMonthDay={onSetMonthDay} />
            <DateRangePicker startDate={item.startDate} endDate={item.endDate} onSetStart={(v) => onSetDateRange("startDate", v)} onSetEnd={(v) => onSetDateRange("endDate", v)} />
            <button type="button" className="link" style={{ flexBasis: "100%", textAlign: "left", fontSize: 12.5 }} onClick={() => setAddingKid(!addingKid)}>
              + 세부 항목 추가
            </button>
          </>
        )}
        {addingKid && (
          <div className="tadd" style={{ flexBasis: "100%", paddingLeft: 20 }}>
            <input className="inp" placeholder="세부 항목 이름" value={kidText} onChange={(e) => setKidText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (onAddKid(kidText), setKidText(""))} />
            <button type="button" className="btn sm" onClick={() => (onAddKid(kidText), setKidText(""))}>
              추가
            </button>
          </div>
        )}
        {kidOf.map((k) => (
          <div key={k.id} className="todo edit kid" style={{ width: "100%" }}>
            <div className="tbody">
              <input className="inp" value={k.text} onChange={(e) => onRenameKid(k.id, e.target.value)} aria-label="세부 항목 이름" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="todo-swipe" ref={setNodeRef} style={style}>
      <div className="todo-swipe-actions">
        <button
          type="button"
          className="todo-swipe-edit"
          aria-label={item.text + " 이름 수정"}
          onClick={() => {
            swipe.close();
            setRenameText(item.text);
            setRenaming(true);
          }}
        >
          수정
        </button>
        <button
          type="button"
          className="todo-swipe-del"
          aria-label={item.text + " 삭제"}
          onClick={() => {
            swipe.close();
            onDelete();
          }}
        >
          삭제
        </button>
      </div>
      {renaming ? (
        <div className="todo" style={{ background: "var(--card,var(--bg))", position: "relative", zIndex: 1 }}>
          <div className="tbody">
            <input
              className="inp"
              style={{ fontWeight: 600 }}
              value={renameText}
              autoFocus
              onChange={(e) => setRenameText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              onBlur={confirmRename}
              aria-label="항목 이름"
            />
          </div>
        </div>
      ) : (
        <div
          className={"todo" + (isKid ? " kid" : "") + (done ? " done" : "")}
          style={{ transform: `translateX(${swipe.swipeX}px)`, transition: swipe.swipeX === 0 || swipe.swipeX === -SWIPE_OPEN ? "transform .15s" : "none" }}
          {...swipe.handlers}
        >
          {!isKid && (
            <button
              type="button"
              className="grip sm"
              aria-label={item.text + " 끌어서 옮기기"}
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => {
                // 이 버튼의 부모 .todo에도 스와이프/길게 누르기 제스처가 붙어 있어서, 그대로 두면
                // 포인터다운이 거기까지 번져 드래그와 스와이프가 서로 간섭한다 — 여기서 끊는다.
                listeners?.onPointerDown?.(e);
                e.stopPropagation();
              }}
            >
              ⠿
            </button>
          )}
          <button type="button" className="chk" aria-pressed={done} aria-label={item.text} onClick={onToggle}>
            {done ? "✓" : ""}
          </button>
          <div className="tbody" style={{ cursor: "pointer" }} onClick={onToggle}>
            <span>{item.text}</span>
            {dayTxt && <small>{dayTxt} 반복</small>}
            {(item.startDate || item.endDate) && (
              <small>
                {item.startDate || "처음"} ~ {item.endDate || "끝"}
              </small>
            )}
            {itemWhenLabel(item.when) && <small>{itemWhenLabel(item.when)}</small>}
          </div>
          {linkTab && !done && (
            <button type="button" className="link" style={{ whiteSpace: "nowrap", fontSize: 12.5 }} onClick={() => onOpenTab(linkTab[0])}>
              {linkTab[1]} ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ExtraItemRow({
  item,
  done,
  onToggle,
  onDelete,
  onRename,
}: {
  item: TodoExtraItem;
  done: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (text: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [renameText, setRenameText] = useState(item.text);
  const swipe = useSwipeRow(() => {});

  const confirmRename = () => {
    const v = renameText.trim();
    if (v) onRename(v);
    setRenaming(false);
  };

  return (
    <div className="todo-swipe">
      <div className="todo-swipe-actions">
        <button
          type="button"
          className="todo-swipe-edit"
          aria-label={item.text + " 이름 수정"}
          onClick={() => {
            swipe.close();
            setRenameText(item.text);
            setRenaming(true);
          }}
        >
          수정
        </button>
        <button
          type="button"
          className="todo-swipe-del"
          aria-label={item.text + " 삭제"}
          onClick={() => {
            swipe.close();
            onDelete();
          }}
        >
          삭제
        </button>
      </div>
      {renaming ? (
        <div className="todo" style={{ background: "var(--card,var(--bg))", position: "relative", zIndex: 1 }}>
          <div className="tbody">
            <input
              className="inp"
              style={{ fontWeight: 600 }}
              value={renameText}
              autoFocus
              onChange={(e) => setRenameText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              onBlur={confirmRename}
              aria-label="항목 이름"
            />
          </div>
        </div>
      ) : (
        <div
          className="todo"
          style={{ transform: `translateX(${swipe.swipeX}px)`, transition: swipe.swipeX === 0 || swipe.swipeX === -SWIPE_OPEN ? "transform .15s" : "none" }}
          {...swipe.handlers}
        >
          <button type="button" className="chk" aria-pressed={done} aria-label={item.text} onClick={onToggle}>
            {done ? "✓" : ""}
          </button>
          <div className="tbody" style={{ cursor: "pointer" }} onClick={onToggle}>
            <span>{item.text}</span>
            <small>오늘만{itemWhenLabel(item.when) ? ` · ${itemWhenLabel(item.when)}` : ""}</small>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionDrop({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `section:${id}`, data: { sec: id } });
  return (
    <div ref={setNodeRef} className="todos">
      {children}
    </div>
  );
}

export function TodoTab({ setTab, storeLabel }: { setTab: (id: string) => void; storeLabel: string }) {
  const [todo, update] = useTodo();
  const [edit, setEdit] = useState(false);
  const [shift, setShiftState] = useState(() => todo?.lastShift ?? "full");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [rep, setRep] = useState<Record<string, boolean>>({});
  const [whenSel, setWhenSel] = useState<Record<string, TodoWhen>>({});
  const [daysSel, setDaysSel] = useState<Record<string, number[] | null>>({});
  const [monthDaySel, setMonthDaySel] = useState<Record<string, number | null>>({});
  const [dateRangeSel, setDateRangeSel] = useState<Record<string, { start: string | null; end: string | null }>>({});
  const [repeatPickerFor, setRepeatPickerFor] = useState<string | null>(null);
  const [daysOpenFor, setDaysOpenFor] = useState<string | null>(null);
  const [newSecName, setNewSecName] = useState("");
  const [newSecWhen, setNewSecWhen] = useState<TodoWhen>("all");
  const [secDeleteId, setSecDeleteId] = useState<string | null>(null);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<"week" | "month" | null>(null);
  const [goalDraft, setGoalDraft] = useState("");
  const [doneSummaryDraft, setDoneSummaryDraft] = useState("");
  const editSnapshot = useRef<TodoData | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const sched = useSchedule(storeLabel);

  // 다른 탭들의 "오늘"과 같은 기준(로컬 날짜)을 써야 한다 — UTC 기준(toISOString)으로 하면 한국
  // 자정~오전 9시 사이에 할일 탭의 "오늘"만 어제로 계산되는 버그가 있었다.
  const date = useMemo(() => today(), []);
  const done = todo?.done[date] || {};
  const extra = todo?.extra[date] || [];

  if (!todo) return <TodoStart onPick={(d) => update(() => d)} />;

  const wKey = weekKey(date);
  const mKey = monthKey(date);
  const weeklyGoalText = todo.weeklyGoal?.key === wKey ? todo.weeklyGoal.text : "";
  const monthlyGoalText = todo.monthlyGoal?.key === mKey ? todo.monthlyGoal.text : "";

  const startEditGoal = (kind: "week" | "month") => {
    setGoalDraft(kind === "week" ? weeklyGoalText : monthlyGoalText);
    setEditingGoal(kind);
  };

  const saveGoal = (kind: "week" | "month") => {
    const text = goalDraft.trim();
    update((prev) => {
      if (!prev) return prev;
      if (kind === "week") return { ...prev, weeklyGoal: text ? { text, key: wKey } : undefined };
      return { ...prev, monthlyGoal: text ? { text, key: mKey } : undefined };
    });
    setEditingGoal(null);
  };

  // "오늘 한 일" — 브리핑에서 쓰는 것과 같은 묶음 선택(todo.briefingSections)을 그대로 써서, 체크한
  // 항목 중 어느 묶음까지 "한 일"로 칠지 여기서도 고를 수 있게 한다(예: 매장 일과만, 또는
  // 매장 일과+투두리스트 둘 다).
  const doneSummaryEligible = briefingEligibleSections(todo, shift);
  const doneSummaryPicked = todo.briefingSections ?? doneSummaryEligible.map((s) => s.id);
  const doneSummary = splitTodayTodos(todo, date, shift).done;

  const toggleDoneSummarySection = (id: string) => {
    const next = doneSummaryPicked.includes(id) ? doneSummaryPicked.filter((x) => x !== id) : [...doneSummaryPicked, id];
    update((prev) => (prev ? { ...prev, briefingSections: next } : prev));
  };

  // "오늘 한 일" 줄에서 ✕를 누르면: 자동으로 걸린 항목(체크된 할일)이면 체크는 그대로 두고 그날만
  // 목록에서 빼고(briefingExcluded), 직접 적어 넣은 항목이면 그냥 지운다.
  const removeDoneSummaryItem = (item: { id: string; manual?: boolean }) => {
    update((prev) => {
      if (!prev) return prev;
      if (item.manual) {
        const list = (prev.briefingExtra?.[date] || []).filter((m) => m.id !== item.id);
        return { ...prev, briefingExtra: { ...prev.briefingExtra, [date]: list } };
      }
      const list = [...new Set([...(prev.briefingExcluded?.[date] || []), item.id])];
      return { ...prev, briefingExcluded: { ...prev.briefingExcluded, [date]: list } };
    });
  };

  // 일정 탭의 행사(할인)·배송·대기 등도 할일 탭에서 바로 체크할 수 있게 — 일정 탭/브리핑과 같은
  // 데이터(sched.actions)를 그대로 쓰니, 여기서 체크하면 일정 탭에도 그대로 반영된다.
  const upcomingActs = upcomingScheduleActions(sched.actions, date);
  const schedKinds = [...new Set(upcomingActs.map((a) => a.kind))];
  const pickedSchedKinds = todo.briefingScheduleKinds ?? schedKinds;
  const schedTasks = upcomingActs.filter((a) => pickedSchedKinds.includes(a.kind));

  const toggleSchedKind = (k: (typeof schedKinds)[number]) => {
    const next = pickedSchedKinds.includes(k) ? pickedSchedKinds.filter((x) => x !== k) : [...pickedSchedKinds, k];
    update((prev) => (prev ? { ...prev, briefingScheduleKinds: next } : prev));
  };

  const addDoneSummaryItem = () => {
    const text = doneSummaryDraft.trim();
    if (!text) return;
    update((prev) => {
      if (!prev) return prev;
      const list = [...(prev.briefingExtra?.[date] || []), { id: uid("be"), text: text.slice(0, 80) }];
      return { ...prev, briefingExtra: { ...prev.briefingExtra, [date]: list } };
    });
    setDoneSummaryDraft("");
  };

  const enterEdit = () => {
    editSnapshot.current = todo;
    setEdit(true);
  };

  const saveExit = () => {
    editSnapshot.current = null;
    setEdit(false);
  };

  const cancelExit = () => {
    const snap = editSnapshot.current;
    if (snap) update(() => snap);
    editSnapshot.current = null;
    setEdit(false);
  };

  const setShift = (v: string) => {
    setShiftState(v);
    update((prev) => (prev ? { ...prev, lastShift: v } : prev));
  };

  const setDone = (id: string, v: boolean) => {
    update((prev) => {
      if (!prev) return prev;
      const d = { ...(prev.done[date] || {}) };
      if (v) d[id] = true;
      else delete d[id];
      return { ...prev, done: { ...prev.done, [date]: d } };
    });
  };

  const setAllDone = (ids: string[], v: boolean) => {
    update((prev) => {
      if (!prev) return prev;
      const d = { ...(prev.done[date] || {}) };
      ids.forEach((id) => {
        if (v) d[id] = true;
        else delete d[id];
      });
      return { ...prev, done: { ...prev.done, [date]: d } };
    });
  };

  const secs = edit ? todo.sections : todo.sections.filter((s) => secOn(s.when, shift));

  const itemsBySec = (sec: string) =>
    todo.items.filter((i) => i.sec === sec && !i.parent && (edit || (secOn(i.when ?? "all", shift) && itemDueOn(i, date))));
  const extraBySec = (sec: string): TodoExtraItem[] => extra.filter((x) => x.sec === sec && (edit || secOn(x.when ?? "all", shift)));
  const kidsOf = (id: string) => todo.items.filter((i) => i.parent === id);

  const toggleDay = (item: TodoItem, d: number) => {
    update((prev) => {
      if (!prev) return prev;
      const cur = item.days || [0, 1, 2, 3, 4, 5, 6];
      const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort();
      const days = next.length < 7 ? next : null;
      return { ...prev, items: prev.items.map((i) => (i.id === item.id ? { ...i, days, monthDay: null } : i)) };
    });
  };

  const setMonthDay = (item: TodoItem, day: number | null) =>
    update((prev) => (prev ? { ...prev, items: prev.items.map((i) => (i.id === item.id ? { ...i, monthDay: day } : i)) } : prev));

  const setDateRange = (item: TodoItem, field: "startDate" | "endDate", value: string | null) =>
    update((prev) => (prev ? { ...prev, items: prev.items.map((i) => (i.id === item.id ? { ...i, [field]: value } : i)) } : prev));

  const addItem = (sec: string) => {
    const v = (draft[sec] || "").trim();
    if (!v) return;
    const when = whenSel[sec] ?? "all";
    if (rep[sec] || edit) {
      const days = daysSel[sec] ?? null;
      const monthDay = monthDaySel[sec] ?? null;
      const range = dateRangeSel[sec];
      update((prev) =>
        prev
          ? { ...prev, items: [...prev.items, { id: uid("u"), sec, text: v.slice(0, 80), days, monthDay, when, startDate: range?.start ?? null, endDate: range?.end ?? null }] }
          : prev
      );
      setDaysSel({ ...daysSel, [sec]: null });
      setMonthDaySel({ ...monthDaySel, [sec]: null });
      setDateRangeSel({ ...dateRangeSel, [sec]: { start: null, end: null } });
    } else {
      update((prev) =>
        prev ? { ...prev, extra: { ...prev.extra, [date]: [...(prev.extra[date] || []), { id: uid("x"), sec, text: v.slice(0, 80), when }] } } : prev
      );
    }
    setDraft({ ...draft, [sec]: "" });
  };

  const addBulk = (sec: string, lines: string[]) => {
    if (!lines.length) return;
    const when = whenSel[sec] ?? "all";
    if (rep[sec] || edit) {
      const days = daysSel[sec] ?? null;
      const monthDay = monthDaySel[sec] ?? null;
      update((prev) =>
        prev ? { ...prev, items: [...prev.items, ...lines.map((v) => ({ id: uid("u"), sec, text: v.slice(0, 80), days, monthDay, when }))] } : prev
      );
      setDaysSel({ ...daysSel, [sec]: null });
      setMonthDaySel({ ...monthDaySel, [sec]: null });
    } else {
      update((prev) =>
        prev
          ? { ...prev, extra: { ...prev.extra, [date]: [...(prev.extra[date] || []), ...lines.map((v) => ({ id: uid("x"), sec, text: v.slice(0, 80), when }))] } }
          : prev
      );
    }
  };

  const delExtra = (id: string) =>
    update((prev) => (prev ? { ...prev, extra: { ...prev.extra, [date]: (prev.extra[date] || []).filter((x) => x.id !== id) } } : prev));

  const renameExtra = (id: string, text: string) =>
    update((prev) =>
      prev ? { ...prev, extra: { ...prev.extra, [date]: (prev.extra[date] || []).map((x) => (x.id === id ? { ...x, text: text.slice(0, 80) } : x)) } } : prev
    );

  const addKid = (parentId: string, sec: string, text: string) => {
    const v = text.trim();
    if (!v) return;
    update((prev) => {
      if (!prev) return prev;
      const a = [...prev.items];
      const kids = a.filter((i) => i.parent === parentId);
      const at = kids.length ? a.indexOf(kids[kids.length - 1]) + 1 : a.findIndex((i) => i.id === parentId) + 1;
      a.splice(at, 0, { id: uid("u"), sec, text: v.slice(0, 80), parent: parentId, days: null });
      return { ...prev, items: a };
    });
  };

  const delItem = (id: string) => update((prev) => (prev ? { ...prev, items: prev.items.filter((i) => i.id !== id && i.parent !== id) } : prev));

  const renameItem = (id: string, text: string) =>
    update((prev) => (prev ? { ...prev, items: prev.items.map((i) => (i.id === id ? { ...i, text: text.slice(0, 80) } : i)) } : prev));

  const setLinkTab = (id: string, tab: string | null) =>
    update((prev) => (prev ? { ...prev, items: prev.items.map((i) => (i.id === id ? { ...i, linkTab: tab } : i)) } : prev));

  const addSec = () => {
    const v = newSecName.trim();
    if (!v) return;
    update((prev) => (prev ? { ...prev, sections: [...prev.sections, { id: uid("s"), name: v.slice(0, 30), when: newSecWhen }] } : prev));
    setNewSecName("");
    setNewSecWhen("all");
  };

  const delSec = (id: string) => {
    update((prev) => (prev ? { ...prev, sections: prev.sections.filter((s) => s.id !== id), items: prev.items.filter((i) => i.sec !== id) } : prev));
    setSecDeleteId(null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const overSec = (over.data.current?.sec as string | undefined) ?? todo.items.find((i) => i.id === overId)?.sec;
    if (!overSec) return;

    update((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      const fromIdx = items.findIndex((i) => i.id === activeId);
      if (fromIdx < 0) return prev;
      const moving = items[fromIdx];
      // 목표 위치를 "제거하기 전" 원본 배열 기준으로 먼저 찾는다. 제거부터 하고 나서 찾으면,
      // 끌던 항목보다 뒤에 있던 대상은 인덱스가 하나 당겨진 채로 잡혀서 — 그 자리에 다시 꽂으면
      // 원래 자리로 돌아가 버린다(위로 옮길 땐 안 겪는 문제라, 아래로만 안 움직이는 것처럼 보였다).
      let toIdx: number;
      if (overId.startsWith("section:")) {
        const secItems = items.filter((i) => i.sec === overSec && !i.parent && i.id !== activeId);
        toIdx = secItems.length ? items.indexOf(secItems[secItems.length - 1]) + 1 : items.length;
      } else {
        const overIdx = items.findIndex((i) => i.id === overId);
        toIdx = overIdx < 0 ? items.length : overIdx;
      }
      items.splice(fromIdx, 1);
      items.splice(toIdx, 0, { ...moving, sec: overSec });
      return { ...prev, items };
    });
  };

  const onSectionDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    update((prev) => {
      if (!prev) return prev;
      const oldIdx = prev.sections.findIndex((s) => s.id === active.id);
      const newIdx = prev.sections.findIndex((s) => s.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return prev;
      return { ...prev, sections: arrayMove(prev.sections, oldIdx, newIdx) };
    });
  };

  const allLeaf: { id: string }[] = secs.flatMap((s) => [...itemsBySec(s.id), ...extraBySec(s.id)]);
  const cnt = allLeaf.filter((i) => done[i.id]).length;

  return (
    <>
      {!edit && (
        <section className="card" style={{ gap: 10 }}>
          <div className="cardhead">
            <h2>목표</h2>
          </div>
          {(["week", "month"] as const).map((kind) => {
            const label = kind === "week" ? "이번 주 목표" : "이번 달 목표";
            const text = kind === "week" ? weeklyGoalText : monthlyGoalText;
            return (
              <div key={kind} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {editingGoal === kind ? (
                  <>
                    <input
                      className="inp"
                      autoFocus
                      value={goalDraft}
                      onChange={(e) => setGoalDraft(e.target.value)}
                      placeholder={label}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveGoal(kind);
                        if (e.key === "Escape") setEditingGoal(null);
                      }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" className="btn sm pri" onClick={() => saveGoal(kind)}>
                        저장
                      </button>
                      <button type="button" className="btn sm" onClick={() => setEditingGoal(null)}>
                        취소
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div>
                      <span className="hint">{label}</span>
                      <p style={{ margin: "2px 0 0" }}>{text || <span className="hint">아직 안 정했어요.</span>}</p>
                    </div>
                    <button type="button" className="link" onClick={() => startEditGoal(kind)}>
                      {text ? "수정" : "정하기"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {!edit && (
        <section className="card" style={{ gap: 10 }}>
          <div className="cardhead">
            <h2>✅ 오늘 한 일 ({doneSummary.length})</h2>
          </div>
          {doneSummaryEligible.length > 1 && (
            <div>
              <p className="hint" style={{ margin: "0 0 6px" }}>
                어느 묶음까지 &quot;한 일&quot;로 칠까요?
              </p>
              <div className="chips">
                {doneSummaryEligible.map((s) => (
                  <button key={s.id} type="button" className="chip sm" aria-pressed={doneSummaryPicked.includes(s.id)} onClick={() => toggleDoneSummarySection(s.id)}>
                    {doneSummaryPicked.includes(s.id) ? "✓ " : ""}
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {doneSummary.length === 0 ? (
            <p className="hint" style={{ margin: 0 }}>
              아직 체크한 항목이 없어요.
            </p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
              {doneSummary.map((t) => (
                <li key={t.id} style={{ fontSize: 13.5, display: "flex", alignItems: "center", gap: 6 }}>
                  <span aria-hidden="true">·</span>
                  <span style={{ flex: 1 }}>
                    {t.text}
                    {t.manual && <span className="hint"> (직접 추가)</span>}
                  </span>
                  <button type="button" className="iconbtn" aria-label={`${t.text} 오늘 한 일에서 빼기`} onClick={() => removeDoneSummaryItem(t)}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="inp"
              placeholder="오늘 한 일에 직접 추가"
              value={doneSummaryDraft}
              onChange={(e) => setDoneSummaryDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDoneSummaryItem()}
            />
            <button type="button" className="btn sm" onClick={addDoneSummaryItem} disabled={!doneSummaryDraft.trim()}>
              추가
            </button>
          </div>
        </section>
      )}

      {upcomingActs.length > 0 && (
        <section className="card" style={{ gap: 10 }}>
          <div className="cardhead">
            <h2>📅 일정에서 확인할 일 ({schedTasks.filter((a) => !a.done).length})</h2>
          </div>
          {schedKinds.length > 1 && (
            <div>
              <p className="hint" style={{ margin: "0 0 6px" }}>
                어느 카테고리를 볼까요?
              </p>
              <div className="chips">
                {schedKinds.map((k) => (
                  <button key={k} type="button" className="chip sm" aria-pressed={pickedSchedKinds.includes(k)} onClick={() => toggleSchedKind(k)}>
                    {pickedSchedKinds.includes(k) ? "✓ " : ""}
                    {EVENT_KIND_LABEL[k]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <ActList
            acts={schedTasks}
            onToggle={(a) => sched.toggle(a)}
            onOpen={() => setTab("schedule")}
            showDate
            empty="선택한 카테고리엔 확인할 일정이 없어요."
          />
        </section>
      )}

      <section className="card" style={{ gap: 10 }}>
        <div className="cardhead">
          <h2>오늘 할 일</h2>
          <button type="button" className={"btn sm" + (edit ? " pri" : "")} onClick={() => (edit ? saveExit() : enterEdit())}>
            {edit ? "편집 완료" : "목록 편집"}
          </button>
        </div>
        {!edit && (
          <>
            <div className="seg" role="group" aria-label="근무" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
              {SHIFTS.map(([k, l]) => (
                <button key={k} type="button" aria-pressed={shift === k} onClick={() => setShift(k)}>
                  {l}
                </button>
              ))}
            </div>
            {shift === "off" && (
              <p className="hint" style={{ margin: 0 }}>
                휴무일이에요 · 근무와 상관없는 개인 할 일만 보여요.
              </p>
            )}
            <div className="tprog">
              <div style={{ width: (allLeaf.length ? (cnt / allLeaf.length) * 100 : 0) + "%" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <p className="hint" style={{ margin: 0 }}>
                {cnt} / {allLeaf.length} 완료{cnt === allLeaf.length && allLeaf.length ? " · 오늘도 수고했어요!" : ""}
              </p>
              {allLeaf.length > 0 && (
                <button type="button" className="link" onClick={() => setAllDone(allLeaf.map((i) => i.id), cnt !== allLeaf.length)}>
                  {cnt === allLeaf.length ? "전체 해제" : "전체 완료"}
                </button>
              )}
            </div>
            <p className="hint" style={{ margin: 0 }}>
              항목을 꾹 누르면 편집 모드로 바로 이동해요.
            </p>
            <button type="button" className="btn" onClick={() => setBriefingOpen(true)}>
              📋 오늘 브리핑 만들기
            </button>
          </>
        )}
        {edit && (
          <p className="hint" style={{ margin: 0 }}>
            <b>⠿ 손잡이를 끌어서</b> 항목·묶음 순서를 바꾸거나 다른 묶음으로 옮겨요. 묶음마다 &apos;항상 / 오픈 근무 / 마감 근무&apos; 중 언제 보일지 정하고, 항목 옆 &apos;매일 ▾&apos;을 누르면
            요일을 골라 특정 요일에만 보이게 하거나 세부 항목을 달 수 있어요.
          </p>
        )}
      </section>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={edit ? onSectionDragEnd : undefined}>
        <SortableContext items={secs.map((s) => s.id)} strategy={verticalListSortingStrategy} disabled={!edit}>
          {secs.map((sc) => (
            <TodoSectionCard
              key={sc.id}
              sc={sc}
              edit={edit}
              items={itemsBySec(sc.id)}
              kidsOf={kidsOf}
              extra={extraBySec(sc.id)}
              done={done}
              draft={draft[sc.id] || ""}
              onDraft={(v) => setDraft({ ...draft, [sc.id]: v })}
              onAdd={() => addItem(sc.id)}
              onToggle={(id) => setDone(id, !done[id])}
              onDeleteItem={delItem}
              onDeleteSection={() => setSecDeleteId(sc.id)}
              confirmingDelete={secDeleteId === sc.id}
              onConfirmDelete={() => delSec(sc.id)}
              onCancelDelete={() => setSecDeleteId(null)}
              onToggleDay={(item, d) => toggleDay(item, d)}
              onSetMonthDay={(item, day) => setMonthDay(item, day)}
              onSetDateRange={(item, field, value) => setDateRange(item, field, value)}
              daysOpenFor={daysOpenFor}
              setDaysOpenFor={setDaysOpenFor}
              onAddKid={(parentId, text) => addKid(parentId, sc.id, text)}
              onDragEnd={onDragEnd}
              sensors={sensors}
              setTab={setTab}
              onRenameItem={renameItem}
              onSetLinkTab={setLinkTab}
              repeat={!!rep[sc.id]}
              onToggleRepeat={() => setRep({ ...rep, [sc.id]: !rep[sc.id] })}
              itemWhen={whenSel[sc.id] ?? "all"}
              onSetItemWhen={(w) => setWhenSel({ ...whenSel, [sc.id]: w })}
              draftDays={daysSel[sc.id] ?? null}
              draftMonthDay={monthDaySel[sc.id] ?? null}
              draftRange={dateRangeSel[sc.id] ?? { start: null, end: null }}
              onSetDraftRange={(field, value) =>
                setDateRangeSel({ ...dateRangeSel, [sc.id]: { ...(dateRangeSel[sc.id] ?? { start: null, end: null }), [field]: value } })
              }
              onToggleDraftDay={(d) => {
                const cur = daysSel[sc.id] || [0, 1, 2, 3, 4, 5, 6];
                const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort();
                setDaysSel({ ...daysSel, [sc.id]: next.length < 7 ? next : null });
                setMonthDaySel({ ...monthDaySel, [sc.id]: null });
              }}
              onSetDraftMonthDay={(day) => {
                setMonthDaySel({ ...monthDaySel, [sc.id]: day });
                if (day) setDaysSel({ ...daysSel, [sc.id]: null });
              }}
              repeatPickerOpen={repeatPickerFor === sc.id}
              onToggleRepeatPicker={() => setRepeatPickerFor(repeatPickerFor === sc.id ? null : sc.id)}
              onDeleteExtra={delExtra}
              onRenameExtra={renameExtra}
              onRequestEdit={enterEdit}
              onToggleAll={() => {
                const ids = [...itemsBySec(sc.id).map((i) => i.id), ...extraBySec(sc.id).map((x) => x.id)];
                const allDone = ids.length > 0 && ids.every((id) => done[id]);
                setAllDone(ids, !allDone);
              }}
              onAddBulk={(lines) => addBulk(sc.id, lines)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {edit && (
        <div className="card">
          <h2>새 묶음 만들기</h2>
          <input className="inp" placeholder="예: 출근 전, 점심시간, 주말에만" value={newSecName} onChange={(e) => setNewSecName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSec()} />
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span className="hint" style={{ margin: 0 }}>
              언제 보일까요?
            </span>
            <div className="chips">
              {WHENS.map(([w, l]) => (
                <button key={w} type="button" className="chip" aria-pressed={newSecWhen === w} onClick={() => setNewSecWhen(w)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="btn pri" disabled={!newSecName.trim()} onClick={addSec}>
            묶음 추가
          </button>
        </div>
      )}
      <p className="hint" style={{ textAlign: "center" }}>
        체크리스트는 이 기기에만 저장되는 나만의 목록이에요.
      </p>

      {edit && (
        <div className="bar">
          <div className="wrap">
            <button type="button" className="btn" onClick={cancelExit}>
              취소
            </button>
            <button type="button" className="btn pri" onClick={saveExit}>
              편집 완료
            </button>
          </div>
        </div>
      )}

      {briefingOpen && <BriefingSheet todo={todo} date={date} shift={shift} onClose={() => setBriefingOpen(false)} onUpdateTodo={update} />}
    </>
  );
}

function TodoSectionCard({
  sc,
  edit,
  items,
  kidsOf,
  extra,
  done,
  draft,
  onDraft,
  onAdd,
  onToggle,
  onDeleteItem,
  onDeleteSection,
  confirmingDelete,
  onConfirmDelete,
  onCancelDelete,
  onToggleDay,
  onSetMonthDay,
  onSetDateRange,
  daysOpenFor,
  setDaysOpenFor,
  onAddKid,
  onDragEnd,
  sensors,
  setTab,
  onRenameItem,
  onSetLinkTab,
  repeat,
  onToggleRepeat,
  itemWhen,
  onSetItemWhen,
  draftDays,
  draftMonthDay,
  draftRange,
  onSetDraftRange,
  onToggleDraftDay,
  onSetDraftMonthDay,
  repeatPickerOpen,
  onToggleRepeatPicker,
  onDeleteExtra,
  onRenameExtra,
  onRequestEdit,
  onToggleAll,
  onAddBulk,
}: {
  sc: TodoSection;
  edit: boolean;
  items: TodoItem[];
  kidsOf: (id: string) => TodoItem[];
  extra: TodoExtraItem[];
  done: Record<string, boolean>;
  draft: string;
  onDraft: (v: string) => void;
  onAdd: () => void;
  onToggle: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onDeleteSection: () => void;
  confirmingDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onToggleDay: (item: TodoItem, d: number) => void;
  onSetMonthDay: (item: TodoItem, day: number | null) => void;
  onSetDateRange: (item: TodoItem, field: "startDate" | "endDate", value: string | null) => void;
  daysOpenFor: string | null;
  setDaysOpenFor: (id: string | null) => void;
  onAddKid: (parentId: string, text: string) => void;
  onDragEnd: (e: DragEndEvent) => void;
  sensors: ReturnType<typeof useSensors>;
  setTab: (id: string) => void;
  onRenameItem: (id: string, text: string) => void;
  onSetLinkTab: (id: string, tab: string | null) => void;
  repeat: boolean;
  onToggleRepeat: () => void;
  itemWhen: TodoWhen;
  onSetItemWhen: (w: TodoWhen) => void;
  draftDays: number[] | null;
  draftMonthDay: number | null;
  draftRange: { start: string | null; end: string | null };
  onSetDraftRange: (field: "start" | "end", value: string | null) => void;
  onToggleDraftDay: (d: number) => void;
  onSetDraftMonthDay: (day: number | null) => void;
  repeatPickerOpen: boolean;
  onToggleRepeatPicker: () => void;
  onDeleteExtra: (id: string) => void;
  onRenameExtra: (id: string, text: string) => void;
  onRequestEdit: () => void;
  onToggleAll: () => void;
  onAddBulk: (lines: string[]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: sc.id, disabled: !edit });
  const style = { transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, transition };
  const leafIds = [...items.map((i) => i.id), ...(!edit ? extra.map((x) => x.id) : [])];
  const c = leafIds.filter((id) => done[id]).length;
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  return (
    <section ref={setNodeRef} style={style} className="card">
      {edit ? (
        <div className="secedit">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button type="button" className="grip" aria-label={sc.name + " 묶음 끌어서 옮기기"} {...attributes} {...listeners}>
              ⠿
            </button>
            <h2 style={{ flex: 1, margin: 0 }}>{sc.name}</h2>
            <button type="button" className="iconbtn" style={{ color: "var(--warn)" }} aria-label="묶음 삭제" onClick={onDeleteSection}>
              ✕
            </button>
          </div>
          {confirmingDelete && (
            <div className="alert">
              &apos;{sc.name}&apos; 묶음과 항목 {items.length + extra.length}개를 지울까요?
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" className="btn sm" onClick={onCancelDelete}>
                  취소
                </button>
                <button type="button" className="btn sm pri" onClick={onConfirmDelete}>
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="cardhead">
          <h2>{sc.name}</h2>
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="sub">
              {c} / {leafIds.length}
            </span>
            {leafIds.length > 0 && (
              <button type="button" className="link" onClick={onToggleAll}>
                {c === leafIds.length ? "전체 해제" : "전체 완료"}
              </button>
            )}
          </span>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <SectionDrop id={sc.id}>
            {items.map((item) => {
              let linkTab: [string, string] | null = null;
              if (item.linkTab === "__none__") {
                linkTab = null;
              } else if (item.linkTab) {
                const t = TAB_OPTIONS.find(([id]) => id === item.linkTab);
                linkTab = t ? [t[0], `${t[1]} 탭`] : null;
              } else {
                const auto = TODO_LINKS.find(([re]) => re.test(item.text));
                linkTab = auto ? [auto[1], auto[2]] : null;
              }
              return (
                <SortableItemRow
                  key={item.id}
                  item={item}
                  edit={edit}
                  done={!!done[item.id]}
                  linkTab={linkTab}
                  onOpenTab={setTab}
                  onToggle={() => onToggle(item.id)}
                  onDelete={() => onDeleteItem(item.id)}
                  onOpenDays={() => setDaysOpenFor(daysOpenFor === item.id ? null : item.id)}
                  daysOpen={daysOpenFor === item.id}
                  onToggleDay={(d) => onToggleDay(item, d)}
                  onSetMonthDay={(day) => onSetMonthDay(item, day)}
                  onSetDateRange={(field, value) => onSetDateRange(item, field, value)}
                  onAddKid={(text) => onAddKid(item.id, text)}
                  kidOf={kidsOf(item.id)}
                  onRename={(text) => onRenameItem(item.id, text)}
                  onSetLink={(tab) => onSetLinkTab(item.id, tab)}
                  onRenameKid={onRenameItem}
                  onRequestEdit={onRequestEdit}
                />
              );
            })}
            {!edit &&
              extra.map((x) => (
                <ExtraItemRow
                  key={x.id}
                  item={x}
                  done={!!done[x.id]}
                  onToggle={() => onToggle(x.id)}
                  onDelete={() => onDeleteExtra(x.id)}
                  onRename={(text) => onRenameExtra(x.id, text)}
                />
              ))}
          </SectionDrop>
        </SortableContext>
      </DndContext>

      <div className="tadd">
        <input
          className="inp"
          placeholder={edit || repeat ? "매일 반복할 일 추가" : "오늘만 할 일 추가"}
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
        />
        {!edit && (
          <button type="button" className="chip" aria-pressed={repeat} onClick={onToggleRepeat}>
            {repeat ? "반복" : "오늘만"}
          </button>
        )}
        {!edit && repeat && (
          <button type="button" className={"daybtn" + (repeatPickerOpen ? " on" : "")} aria-expanded={repeatPickerOpen} onClick={onToggleRepeatPicker}>
            {repeatLabel(draftDays, draftMonthDay)} ▾
          </button>
        )}
        <button type="button" className="btn sm" onClick={onAdd}>
          추가
        </button>
      </div>
      {!edit && repeat && repeatPickerOpen && (
        <>
          <RepeatPicker days={draftDays} monthDay={draftMonthDay} onToggleDay={onToggleDraftDay} onSetMonthDay={onSetDraftMonthDay} />
          <DateRangePicker
            startDate={draftRange.start}
            endDate={draftRange.end}
            onSetStart={(v) => onSetDraftRange("start", v)}
            onSetEnd={(v) => onSetDraftRange("end", v)}
          />
        </>
      )}
      {!edit && (
        <div className="chips" style={{ margin: 0 }}>
          {ITEM_WHENS.map(([w, l]) => (
            <button key={w} type="button" className="chip sm" aria-pressed={itemWhen === w} onClick={() => onSetItemWhen(w)}>
              {l}
            </button>
          ))}
        </div>
      )}
      <button type="button" className="link" style={{ alignSelf: "flex-start", fontSize: 12.5 }} onClick={() => setBulkOpen(!bulkOpen)}>
        {bulkOpen ? "여러 개 추가 닫기" : "+ 여러 개 한 번에 추가"}
      </button>
      {bulkOpen && (
        <div className="tadd" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <textarea className="inp" rows={3} placeholder="한 줄에 하나씩 적어주세요" value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
          <button
            type="button"
            className="btn sm"
            onClick={() => {
              onAddBulk(
                bulkText
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
              );
              setBulkText("");
              setBulkOpen(false);
            }}
          >
            모두 추가
          </button>
        </div>
      )}
    </section>
  );
}
