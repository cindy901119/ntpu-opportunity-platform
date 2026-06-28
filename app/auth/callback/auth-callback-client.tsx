"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseAuthClient, hasSupabaseAuthConfig } from "@/src/lib/supabase/auth-client";

export function AuthCallbackClient() {
  const router = useRouter();
  const [message, setMessage] = useState("正在確認登入狀態。");

  useEffect(() => {
    if (!hasSupabaseAuthConfig()) {
      setMessage("尚未設定 Supabase 環境變數。");
      return;
    }

    const confirmSession = async () => {
      const supabase = getSupabaseAuthClient();
      const code = new URLSearchParams(window.location.search).get("code");
      const { data, error } = code ? await supabase.auth.exchangeCodeForSession(code) : await supabase.auth.getSession();

      if (error) {
        setMessage("登入回傳處理失敗，請重新登入。");
        return;
      }

      if (!data.session) {
        setMessage("尚未取得登入 session，請重新登入。");
        return;
      }

      router.replace("/account");
    };

    void confirmSession();
  }, [router]);

  return (
    <main className="mx-auto max-w-[760px] px-4 py-8">
      <section className="section-card space-y-4">
        <h1 className="text-2xl font-semibold">登入確認</h1>
        <p className="text-sm leading-6 text-[var(--muted)]">{message}</p>
        <Link href="/account" className="inline-flex rounded-2xl bg-[var(--action)] px-4 py-3 font-semibold text-[var(--paper)]">
          回到帳號頁
        </Link>
      </section>
    </main>
  );
}
