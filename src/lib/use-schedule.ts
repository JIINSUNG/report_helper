"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc, addDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase-client";
import { useAuth } from "@/context/auth-context";
import { shift } from "./format";
import type { EventKind, ScheduleEvent } from "@/types/shared";

export interface ScheduleAction {
  id: string;
  key: string;
  date: string;
  end?: string;
  short: string;
  label: string;
  hint: string;
  kind: EventKind;
  ev: ScheduleEvent;
  done: boolean;
}

export function aEnd(a: ScheduleAction) {
  return a.end || a.date;
}

export function onDay(a: ScheduleAction, d: string) {
  return a.date <= d && d <= aEnd(a);
}

export function schedActions(e: ScheduleEvent): ScheduleAction[] {
  const A: { key: string; date: string; end?: string; short: string; label: string; hint: string }[] = [];
  if (!e || (e.kind !== "wait" && !e.start)) return [];
  if (e.kind === "promo" && e.start) {
    const end = e.end || e.start;
    const pre = e.when === "close";
    A.push({ key: "s", date: pre ? shift(e.start, -1) : e.start, short: "행사가", label: `가격표 행사가로 교체 · ${e.title}`, hint: (pre ? "전날 마감 때" : "당일 오픈 전") + (e.items ? ` · ${e.items}` : "") });
    A.push({ key: "e", date: pre ? end : shift(end, 1), short: "원복", label: `가격표 정상가로 원복 · ${e.title}`, hint: (pre ? "행사 마지막 날 마감 때" : "종료 다음 날 오픈 전") + (e.items ? ` · ${e.items}` : "") });
  } else if (e.kind === "delivery" && e.start) {
    const lead = Number(e.lead) || 2;
    A.push({ key: "r", date: shift(e.start, -lead), short: "요청", label: `배송·설치 요청 · ${e.title}`, hint: `설치일 ${e.start}${e.time ? " " + e.time : ""} · ${lead}일 전 요청${e.memo ? " · " + e.memo : ""}` });
    A.push({ key: "i", date: e.start, short: "설치", label: `설치일 · ${e.title}`, hint: `${e.time ? e.time + " 방문 · " : ""}설치 완료 확인${e.memo ? " · " + e.memo : ""}` });
  } else if (e.kind === "wait") {
    if (e.due && e.status !== "closed") A.push({ key: "w", date: e.due, short: "확인", label: `확인 · ${e.title}`, hint: e.memo || "상태 확인 후 진행 기록 남기기" });
  } else if (e.start) {
    const end = e.end && e.end > e.start ? e.end : e.start;
    A.push({ key: "t", date: e.start, end, short: (e.title || "").slice(0, 4), label: e.title, hint: [end !== e.start && `${e.start} ~ ${end} 기간 중 완료`, e.time, e.memo].filter(Boolean).join(" · ") });
  }
  return A.map((a) => ({ ...a, id: e.id + ":" + a.key, kind: e.kind, ev: e, done: !!(e.done && e.done[a.key]) }));
}

export function useSchedule(store: string) {
  const { uid, role } = useAuth();
  const [evs, setEvs] = useState<ScheduleEvent[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    const u = onSnapshot(
      collection(getFirebaseDb(), "schedule"),
      (snap) => setEvs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ScheduleEvent)),
      () => setErr("일정을 불러오지 못했어요.")
    );
    return () => u();
  }, []);

  const mine = useMemo(() => evs.filter((e) => (e.store || store) === store), [evs, store]);
  const actions = useMemo(() => mine.flatMap(schedActions).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.ev.time || "").localeCompare(b.ev.time || ""))), [mine]);

  const isGuest = role === "guest";

  async function save(e: Partial<ScheduleEvent> & { id?: string }) {
    if (isGuest) return false;
    const { id, ...rest } = e;
    const now = new Date().toISOString();
    const old = (id && evs.find((x) => x.id === id)) || null;
    const body = { ...rest, store: rest.store || store, created: old?.created || rest.created || now, by: id ? old?.by || rest.by || uid : uid, at: now } as Omit<ScheduleEvent, "id">;
    if (id) (body as Record<string, unknown>).editedBy = uid;
    try {
      if (id) await setDoc(doc(getFirebaseDb(), "schedule", id), body);
      else await addDoc(collection(getFirebaseDb(), "schedule"), body);
      setErr("");
      return true;
    } catch {
      setErr("저장하지 못했어요.");
      return false;
    }
  }

  async function remove(id: string) {
    if (isGuest) return false;
    try {
      await deleteDoc(doc(getFirebaseDb(), "schedule", id));
      return true;
    } catch {
      setErr("삭제하지 못했어요. 관리자만 삭제할 수 있어요.");
      return false;
    }
  }

  async function patch(ev: ScheduleEvent, p: Partial<ScheduleEvent>) {
    if (isGuest) return false;
    try {
      await updateDoc(doc(getFirebaseDb(), "schedule", ev.id), p);
      return true;
    } catch {
      setErr("저장하지 못했어요.");
      return false;
    }
  }

  async function toggle(a: ScheduleAction) {
    const done = { ...(a.ev.done || {}), [a.key]: !a.done };
    return patch(a.ev, { done });
  }

  return { evs: mine, all: evs, actions, err, store, save, remove, patch, toggle, isGuest };
}
