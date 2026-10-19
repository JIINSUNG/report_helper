"use client";

import { AuthProvider, useAuth } from "@/context/auth-context";
import { LoginScreen } from "@/components/login/LoginScreen";
import { AppShell } from "@/components/layout/AppShell";

function Gate() {
  const { status } = useAuth();
  if (status === "loading") {
    return (
      <div className="wrap" style={{ paddingBlock: 24, display: "flex", gap: 8, alignItems: "center", color: "var(--muted)" }}>
        <span className="spinner" aria-hidden="true" />
        불러오는 중…
      </div>
    );
  }
  if (status === "needs-role") return <LoginScreen />;
  return <AppShell />;
}

export default function Home() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
