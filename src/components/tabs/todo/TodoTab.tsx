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
import { SHIFTS, WD, WHENS, secOn, todoBlank, todoSeed, type TodoData, type TodoItem, type TodoSection, type TodoWhen } from "@/data/todo-seed";
import { TODO_LINKS } from "@/data/retro-hints";
import { TAB_OPTIONS } from "@/data/tabs";

function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
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

const SWIPE_OPEN = 72;
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
    disabled: !edit || !!item.parent,
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
  const dayTxt = item.days ? item.days.map((d) => WD[d]).join("·") : "";
  const isKid = !!item.parent;
  const swipe = useSwipeRow(onRequestEdit);

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
            {item.days ? dayTxt : "매일"} ▾
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
            <div className="wdpick">
              {[...WD].map((w, d) => {
                const on = !item.days || item.days.includes(d);
                return (
                  <button key={d} type="button" aria-pressed={on} aria-label={w + "요일"} onClick={() => onToggleDay(d)}>
                    {w}
                  </button>
                );
              })}
            </div>
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
    <div className="todo-swipe">
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
      <div
        className={"todo" + (isKid ? " kid" : "") + (done ? " done" : "")}
        style={{ transform: `translateX(${swipe.swipeX}px)`, transition: swipe.swipeX === 0 || swipe.swipeX === -SWIPE_OPEN ? "transform .15s" : "none" }}
        {...swipe.handlers}
      >
        <button type="button" className="chk" aria-pressed={done} aria-label={item.text} onClick={onToggle}>
          {done ? "✓" : ""}
        </button>
        <div className="tbody" style={{ cursor: "pointer" }} onClick={onToggle}>
          <span>{item.text}</span>
          {dayTxt && <small>{dayTxt} 반복</small>}
        </div>
        {linkTab && !done && (
          <button type="button" className="link" style={{ whiteSpace: "nowrap", fontSize: 12.5 }} onClick={() => onOpenTab(linkTab[0])}>
            {linkTab[1]} ›
          </button>
        )}
      </div>
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

export function TodoTab({ setTab }: { setTab: (id: string) => void }) {
  const [todo, update] = useTodo();
  const [edit, setEdit] = useState(false);
  const [shift, setShiftState] = useState(() => todo?.lastShift ?? "full");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [rep, setRep] = useState<Record<string, boolean>>({});
  const [daysOpenFor, setDaysOpenFor] = useState<string | null>(null);
  const [newSecName, setNewSecName] = useState("");
  const [newSecWhen, setNewSecWhen] = useState<TodoWhen>("all");
  const [secDeleteId, setSecDeleteId] = useState<string | null>(null);
  const editSnapshot = useRef<TodoData | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const date = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const done = todo?.done[date] || {};
  const extra = todo?.extra[date] || [];

  if (!todo) return <TodoStart onPick={(d) => update(() => d)} />;

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

  const itemsBySec = (sec: string) => todo.items.filter((i) => i.sec === sec && !i.parent);
  const kidsOf = (id: string) => todo.items.filter((i) => i.parent === id);

  const toggleDay = (item: TodoItem, d: number) => {
    update((prev) => {
      if (!prev) return prev;
      const cur = item.days || [0, 1, 2, 3, 4, 5, 6];
      const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort();
      const days = next.length < 7 ? next : null;
      return { ...prev, items: prev.items.map((i) => (i.id === item.id ? { ...i, days } : i)) };
    });
  };

  const addItem = (sec: string) => {
    const v = (draft[sec] || "").trim();
    if (!v) return;
    if (rep[sec] || edit) {
      update((prev) => (prev ? { ...prev, items: [...prev.items, { id: uid("u"), sec, text: v.slice(0, 80), days: null }] } : prev));
    } else {
      update((prev) =>
        prev ? { ...prev, extra: { ...prev.extra, [date]: [...(prev.extra[date] || []), { id: uid("x"), sec, text: v.slice(0, 80) }] } } : prev
      );
    }
    setDraft({ ...draft, [sec]: "" });
  };

  const addBulk = (sec: string, lines: string[]) => {
    if (!lines.length) return;
    if (rep[sec] || edit) {
      update((prev) => (prev ? { ...prev, items: [...prev.items, ...lines.map((v) => ({ id: uid("u"), sec, text: v.slice(0, 80), days: null }))] } : prev));
    } else {
      update((prev) =>
        prev ? { ...prev, extra: { ...prev.extra, [date]: [...(prev.extra[date] || []), ...lines.map((v) => ({ id: uid("x"), sec, text: v.slice(0, 80) }))] } } : prev
      );
    }
  };

  const delExtra = (id: string) =>
    update((prev) => (prev ? { ...prev, extra: { ...prev.extra, [date]: (prev.extra[date] || []).filter((x) => x.id !== id) } } : prev));

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
      items.splice(fromIdx, 1);
      let toIdx: number;
      if (overId.startsWith("section:")) {
        const secItems = items.filter((i) => i.sec === overSec && !i.parent);
        toIdx = secItems.length ? items.indexOf(secItems[secItems.length - 1]) + 1 : items.length;
      } else {
        const overIdx = items.findIndex((i) => i.id === overId);
        toIdx = overIdx < 0 ? items.length : overIdx;
      }
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

  const allLeaf: { id: string }[] = secs.flatMap((s) => [...itemsBySec(s.id), ...extra.filter((x) => x.sec === s.id)]);
  const cnt = allLeaf.filter((i) => done[i.id]).length;

  return (
    <>
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
            {shift !== "off" ? (
              <>
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
              </>
            ) : (
              <p className="hint" style={{ margin: 0 }}>
                휴무일이에요.
              </p>
            )}
            <p className="hint" style={{ margin: 0 }}>
              항목을 꾹 누르면 편집 모드로 바로 이동해요.
            </p>
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
              extra={extra.filter((x) => x.sec === sc.id)}
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
              onDeleteExtra={delExtra}
              onRequestEdit={enterEdit}
              onToggleAll={() => {
                const ids = [...itemsBySec(sc.id).map((i) => i.id), ...extra.filter((x) => x.sec === sc.id).map((x) => x.id)];
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
  onDeleteExtra,
  onRequestEdit,
  onToggleAll,
  onAddBulk,
}: {
  sc: TodoSection;
  edit: boolean;
  items: TodoItem[];
  kidsOf: (id: string) => TodoItem[];
  extra: { id: string; sec: string; text: string }[];
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
  onDeleteExtra: (id: string) => void;
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
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy} disabled={!edit}>
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
                <div className="todo" key={x.id}>
                  <button type="button" className="chk" aria-pressed={!!done[x.id]} onClick={() => onToggle(x.id)}>
                    {done[x.id] ? "✓" : ""}
                  </button>
                  <div className="tbody" style={{ cursor: "pointer" }} onClick={() => onToggle(x.id)}>
                    <span>{x.text}</span>
                    <small>오늘만</small>
                  </div>
                  <button type="button" className="iconbtn" aria-label={x.text + " 삭제"} onClick={() => onDeleteExtra(x.id)}>
                    ✕
                  </button>
                </div>
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
        <button type="button" className="btn sm" onClick={onAdd}>
          추가
        </button>
      </div>
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
