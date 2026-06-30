"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseAuthClient, hasSupabaseAuthConfig } from "@/src/lib/supabase/auth-client";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell message="正在完成登入。" />}>
      <AuthCallbackHandler />
    </Suspense>
  );
}

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("正在完成登入。");

  useEffect(() => {
    async function completeSignIn() {
      if (!hasSupabaseAuthConfig()) {
        setMessage("尚未設定 Supabase 環境變數。");
        return;
      }

      const code = searchParams.get("code");
      const supabase = getSupabaseAuthClient();

      if (!code) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace("/account");
          return;
        }

        setMessage("沒有收到登入授權碼，請回帳號頁重新登入。");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setMessage("登入回傳處理失敗，請稍後再試。");
        return;
      }

      router.replace("/account");
    }

    completeSignIn();
  }, [router, searchParams]);

  return (
    <CallbackShell message={message} />
  );
}

function CallbackShell({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[520px] items-center px-4">
      <section className="section-card w-full text-center">
        <h1 className="text-xl font-semibold">Google 登入</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{message}</p>
      </section>
    </main>
  );
}
