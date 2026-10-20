"use client";

import { useMemo, useState } from "react";
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
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { useTodo } from "@/lib/use-todo";
import { SHIFTS, WD, WHENS, secOn, todoBlank, todoSeed, type TodoData, type TodoItem, type TodoSection, type TodoWhen } from "@/data/todo-seed";
import { TODO_LINKS } from "@/data/retro-hints";
import { TAB_OPTIONS } from "@/data/tabs";

function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
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
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { sec: item.sec },
    disabled: !edit || !!item.parent,
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const [kidText, setKidText] = useState("");
  const [addingKid, setAddingKid] = useState(false);
  const dayTxt = item.days ? item.days.map((d) => WD[d]).join("·") : "";
  const isKid = !!item.parent;

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
    <div className={"todo" + (isKid ? " kid" : "") + (done ? " done" : "")}>
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
  const [shift, setShiftState] = useState("full");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [daysOpenFor, setDaysOpenFor] = useState<string | null>(null);
  const [newSecName, setNewSecName] = useState("");
  const [newSecWhen, setNewSecWhen] = useState<TodoWhen>("all");
  const [secDeleteId, setSecDeleteId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const date = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const done = todo?.done[date] || {};
  const extra = todo?.extra[date] || [];

  if (!todo) return <TodoStart onPick={(d) => update(() => d)} />;

  const setDone = (id: string, v: boolean) => {
    update((prev) => {
      if (!prev) return prev;
      const d = { ...(prev.done[date] || {}) };
      if (v) d[id] = true;
      else delete d[id];
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
    update((prev) => (prev ? { ...prev, items: [...prev.items, { id: uid("u"), sec, text: v.slice(0, 80), days: null }] } : prev));
    setDraft({ ...draft, [sec]: "" });
  };

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
          <button type="button" className={"btn sm" + (edit ? " pri" : "")} onClick={() => setEdit(!edit)}>
            {edit ? "편집 완료" : "목록 편집"}
          </button>
        </div>
        {!edit && (
          <>
            <div className="seg" role="group" aria-label="근무" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
              {SHIFTS.map(([k, l]) => (
                <button key={k} type="button" aria-pressed={shift === k} onClick={() => setShiftState(k)}>
                  {l}
                </button>
              ))}
            </div>
            {shift !== "off" ? (
              <>
                <div className="tprog">
                  <div style={{ width: (allLeaf.length ? (cnt / allLeaf.length) * 100 : 0) + "%" }} />
                </div>
                <p className="hint" style={{ margin: 0 }}>
                  {cnt} / {allLeaf.length} 완료{cnt === allLeaf.length && allLeaf.length ? " · 오늘도 수고했어요!" : ""}
                </p>
              </>
            ) : (
              <p className="hint" style={{ margin: 0 }}>
                휴무일이에요.
              </p>
            )}
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
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: sc.id, disabled: !edit });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const leaf = items.length ? items : [];
  const c = leaf.filter((i) => done[i.id]).length;

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
          <span className="sub">
            {c} / {leaf.length}
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
                </div>
              ))}
          </SectionDrop>
        </SortableContext>
      </DndContext>

      <div className="tadd">
        <input className="inp" placeholder="할 일 추가" value={draft} onChange={(e) => onDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onAdd()} />
        <button type="button" className="btn sm" onClick={onAdd}>
          추가
        </button>
      </div>
    </section>
  );
}
