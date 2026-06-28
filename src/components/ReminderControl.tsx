"use client";

import { useEffect, useState } from "react";
import { getReminderSetting, saveReminderSetting, sendReminderTestEmail, type ReminderSetting } from "@/src/lib/reminders";

const defaultLeadDays = "30, 14";

export function ReminderControl({ opportunityId }: { opportunityId: string }) {
  const [signedIn, setSignedIn] = useState(false);
  const [setting, setSetting] = useState<ReminderSetting>({
    opportunityId,
    remindEnabled: false,
    remindDaysBefore: [30, 14],
    preferredSendTime: "09:00",
    notificationEmail: "",
    emailVerified: false,
  });
  const [leadDaysText, setLeadDaysText] = useState(defaultLeadDays);
  const [status, setStatus] = useState("讀取提醒設定中。");
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    getReminderSetting(opportunityId)
      .then((result) => {
        if (result.status === "signed-out") {
          setSignedIn(false);
          setStatus("登入後可以設定提醒。");
          return;
        }

        setSignedIn(true);

        if (result.status === "loaded" && result.setting) {
          setSetting(result.setting);
          setLeadDaysText(result.setting.remindDaysBefore.join(", "));
          setStatus("已讀取提醒設定。");
          return;
        }

        if (result.status === "error") {
          setStatus("提醒設定讀取失敗，請確認 reminder_settings schema。");
          return;
        }

        setSetting((current) => ({
          ...current,
          notificationEmail: result.userEmail,
        }));
        setStatus("尚未設定提醒。");
      })
      .catch(() => {
        setStatus("提醒設定讀取失敗。");
      });
  }, [opportunityId]);

  function parseLeadDays(value: string) {
    return value
      .split(/,|，|、|\s+/)
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item) && item > 0 && item <= 365)
      .filter((item, index, array) => array.indexOf(item) === index)
      .sort((a, b) => b - a);
  }

  function updateLeadDays(value: string) {
    setLeadDaysText(value);
    setSetting((current) => ({
      ...current,
      remindDaysBefore: parseLeadDays(value),
    }));
  }

  async function save() {
    if (setting.remindEnabled && !setting.remindDaysBefore.length) {
      setStatus("請至少填一個提醒天數。");
      return;
    }

    setSaving(true);
    const result = await saveReminderSetting(setting);
    setSaving(false);

    if (result === "signed-out") {
      setSignedIn(false);
      setStatus("登入後可以設定提醒。");
      return;
    }

    setStatus(result === "saved" ? "提醒設定已儲存。這一版尚未實際寄信。" : "提醒設定儲存失敗，請確認 schema 與 RLS。");
  }

  return (
    <section className="section-card space-y-4">
      <div>
        <h2 className="text-lg font-semibold">提醒設定</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">先設定你想多早知道，不會催你交件。這裡尚未實際寄送 Email。</p>
      </div>

      {!signedIn ? (
        <p className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-3 text-sm leading-6 text-[var(--muted)]">{status}</p>
      ) : (
        <>
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">
            <span className="text-sm font-semibold">開啟截止提醒</span>
            <input
              type="checkbox"
              checked={setting.remindEnabled}
              onChange={(event) => setSetting((current) => ({ ...current, remindEnabled: event.target.checked }))}
              className="h-5 w-5 accent-[var(--action)]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">提醒 Email</span>
            <input
              type="email"
              value={setting.notificationEmail}
              onChange={(event) => setSetting((current) => ({ ...current, notificationEmail: event.target.value, emailVerified: false }))}
              className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-semibold text-[var(--text)]"
              placeholder="you@example.com"
            />
            <span className="text-xs font-semibold text-[var(--muted)]">
              {setting.emailVerified ? "這個 Email 已通過測試信。" : "寄送測試信後，才會標記為已驗證。"}
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">提前幾天提醒</span>
              <input
                value={leadDaysText}
                onChange={(event) => updateLeadDays(event.target.value)}
                className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-semibold text-[var(--text)]"
                placeholder="30, 14"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">寄送時間</span>
              <input
                type="time"
                value={setting.preferredSendTime}
                onChange={(event) => setSetting((current) => ({ ...current, preferredSendTime: event.target.value }))}
                className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-semibold text-[var(--text)]"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-3 text-sm leading-6 text-[var(--muted)]">
            之後接 Gmail 寄信前，會先提供測試信。測試通過後才會把 Email 標記為已驗證。
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full rounded-2xl bg-[var(--action)] px-4 py-3 font-semibold text-[var(--paper)] disabled:opacity-60"
          >
            {saving ? "儲存中" : "儲存提醒設定"}
          </button>

          <button
            type="button"
            onClick={async () => {
              setSendingTest(true);
              const saveResult = await saveReminderSetting(setting);

              if (saveResult !== "saved") {
                setSendingTest(false);
                setStatus(saveResult === "signed-out" ? "登入後可以寄送測試信。" : "請先確認提醒設定可以儲存。");
                return;
              }

              const result = await sendReminderTestEmail(setting);
              setSendingTest(false);

              if (result === "sent") {
                setSetting((current) => ({ ...current, emailVerified: true }));
                setStatus("測試信已寄出。請到信箱確認是否收到。");
                return;
              }

              if (result === "gmail-not-configured") {
                setStatus("Gmail API 尚未設定完成，請確認環境變數。");
                return;
              }

              setStatus(result === "signed-out" ? "登入後可以寄送測試信。" : "測試信寄送失敗，請稍後再試。");
            }}
            disabled={sendingTest || saving}
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 font-semibold text-[var(--action)] disabled:opacity-60"
          >
            {sendingTest ? "寄送中" : "寄送測試信"}
          </button>

          <p className="text-sm leading-6 text-[var(--info)]">{status}</p>
        </>
      )}
    </section>
  );
}
