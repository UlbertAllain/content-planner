"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      await signOut(firebaseAuth).catch(() => undefined);
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/login");
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
        aria-label="Keluar"
      >
        <LogOut size={16} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
    >
      {loading ? "Sedang keluar..." : "Keluar"}
    </button>
  );
}
