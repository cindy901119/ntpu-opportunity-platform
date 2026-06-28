"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAuthClient, hasSupabaseAuthConfig } from "@/src/lib/supabase/auth-client";

export function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasSupabaseAuthConfig()) {
      setReady(true);
      return;
    }

    const supabase = getSupabaseAuthClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return <span className="hidden text-xs font-semibold text-[var(--muted)] sm:inline">確認中</span>;
  }

  if (!hasSupabaseAuthConfig()) {
    return <span className="hidden text-xs font-semibold text-[var(--attention)] sm:inline">未設定登入</span>;
  }

  return (
    <Link
      href="/account"
      className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm font-semibold text-[var(--action)]"
    >
      {user ? "帳號" : "登入"}
    </Link>
  );
}
