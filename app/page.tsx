import Link from "next/link";

export default function HomePage() {
  return (
    <main className="app-shell flex items-center px-5 py-8">
      <section className="mx-auto w-full max-w-xl rounded-[22px] border border-[var(--soft)] bg-[var(--paper)] p-6 shadow-[0_10px_28px_rgba(55,46,35,.05)]">
        <p className="mb-3 text-sm font-semibold text-[var(--action)]">北大／北聯大版</p>

        <h1 className="text-4xl font-semibold leading-tight text-[var(--text)]">北大版機會雷達</h1>

        <p className="mt-4 text-base leading-7 text-[var(--muted)]">
          先瀏覽比賽、獎學金與補助計畫。需要篩選時，再設定你的資格與偏好。
        </p>

        <div className="mt-8 grid gap-3">
          <Link
            href="/opportunities"
            className="rounded-2xl bg-[var(--action)] px-5 py-4 text-center font-semibold text-[var(--paper)]"
          >
            查看機會
          </Link>

          <Link
            href="/preferences"
            className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-5 py-4 text-center font-semibold text-[var(--action)]"
          >
            設定偏好
          </Link>
        </div>

        <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
          我們會整理重點與提醒適合條件，報名前仍建議打開官方簡章確認完整規則。
        </p>
      </section>
    </main>
  );
}
