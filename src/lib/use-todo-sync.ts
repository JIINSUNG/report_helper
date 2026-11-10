"use client";

import { useEffect, useRef } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase-client";
import { useAuth } from "@/context/auth-context";
import { useTodo } from "./use-todo";
import { todoBlank, type TodoData } from "@/data/todo-seed";

/** 할일 목록을 Firestore(`todos/{todoKey}`)에 동기화한다. todoKey는 기기가 아니라 "사람"
 * (매장+이름, 관리자는 단일 키) 단위라서, 같은 사람이 로그인한 기기끼리는 어디서 체크해도
 * 같은 목록을 본다. 게스트는 todoKey가 없어(로그인 때 claim을 안 심음) 동기화 없이 이
 * 기기에만 남는다 — AppShell에 한 번만 마운트해서 쓴다(화면마다 따로 구독하면 안 됨). */
export function useTodoCloudSync() {
  const { todoKey } = useAuth();
  const [todo, , updateFromRemote] = useTodo();
  const lastSyncedUpdatedAtRef = useRef<number | null>(null);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!todoKey) return;
    lastSyncedUpdatedAtRef.current = null;
    const unsub = onSnapshot(
      doc(getFirebaseDb(), "todos", todoKey),
      (snap) => {
        const cloud = snap.data() as (TodoData & { updatedAt?: number }) | undefined;
        if (!cloud) return;
        if ((cloud.updatedAt ?? 0) === lastSyncedUpdatedAtRef.current) return;
        const local = cloud as TodoData;
        lastSyncedUpdatedAtRef.current = cloud.updatedAt ?? null;
        updateFromRemote({ ...todoBlank(), ...local });
      },
      () => {
        // Firestore 규칙이 아직 배포되기 전이거나 네트워크가 없으면 그냥 로컬로만 동작한다.
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todoKey]);

  useEffect(() => {
    if (!todoKey || !todo) return;
    const stamp = todo.updatedAt ?? 0;
    if (stamp === lastSyncedUpdatedAtRef.current) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      lastSyncedUpdatedAtRef.current = stamp;
      setDoc(doc(getFirebaseDb(), "todos", todoKey), { ...todo, updatedAt: stamp }).catch(() => {
        lastSyncedUpdatedAtRef.current = null;
      });
    }, 2000);
    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  }, [todoKey, todo]);
}
