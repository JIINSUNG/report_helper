"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, addDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase-client";
import { useAuth } from "@/context/auth-context";
import type { Comment, Post, PostTag } from "@/types/shared";

export function useCommunity() {
  const { uid, name, role } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const u1 = onSnapshot(query(collection(getFirebaseDb(), "posts"), orderBy("at", "desc")), (snap) => setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post)));
    const u2 = onSnapshot(query(collection(getFirebaseDb(), "comments"), orderBy("at", "asc")), (snap) => setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment)));
    return () => {
      u1();
      u2();
    };
  }, []);

  const canWrite = role === "staff" || role === "admin";

  async function add(p: { tag: PostTag; text: string; prod?: string; store?: string }) {
    try {
      await addDoc(collection(getFirebaseDb(), "posts"), { ...p, by: uid, byName: name, at: new Date().toISOString(), likes: {} });
      return true;
    } catch {
      return false;
    }
  }
  async function del(id: string) {
    await deleteDoc(doc(getFirebaseDb(), "posts", id));
  }
  async function like(p: Post) {
    const likes = { ...(p.likes || {}) };
    if (uid && likes[uid]) delete likes[uid];
    else if (uid) likes[uid] = true;
    await updateDoc(doc(getFirebaseDb(), "posts", p.id), { likes });
  }
  async function comment(postId: string, text: string) {
    try {
      await addDoc(collection(getFirebaseDb(), "comments"), { postId, text, by: uid, byName: name, at: new Date().toISOString() });
      return true;
    } catch {
      return false;
    }
  }
  async function edit(id: string, p: Partial<Post>) {
    try {
      await updateDoc(doc(getFirebaseDb(), "posts", id), { ...p, editedAt: new Date().toISOString() });
      return true;
    } catch {
      return false;
    }
  }
  async function editComment(id: string, text: string) {
    try {
      await updateDoc(doc(getFirebaseDb(), "comments", id), { text, editedAt: new Date().toISOString() });
      return true;
    } catch {
      return false;
    }
  }
  async function delComment(id: string) {
    await deleteDoc(doc(getFirebaseDb(), "comments", id));
  }

  return { posts, comments, me: uid, canWrite, add, del, like, comment, edit, editComment, delComment };
}
