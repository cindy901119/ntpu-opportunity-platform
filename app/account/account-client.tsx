"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getDepartmentsForSchool } from "@/src/data/departmentCatalog";
import { getPreferences, savePreferences } from "@/src/lib/localStorage";
import { getSupabaseAuthClient, hasSupabaseAuthConfig } from "@/src/lib/supabase/auth-client";
import type { UserProfile } from "@/src/types";

type ProfileRow = UserProfile & {
  id: string;
  email: string | null;
  display_name: string | null;
};

const schools = ["國立臺北大學"];
const grades = ["大一", "大二", "大三", "大四", "碩一", "碩二"];
const adminEmail = "cindy901119@gmail.com";

function profileFromLocal(user: User): ProfileRow {
  const local = getPreferences().profile;
  return {
    id: user.id,
    email: user.email ?? null,
    display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    school: local.school,
    majorDepartment: local.majorDepartment,
    grade: local.grade,
    doubleMajorDepartment: local.doubleMajorDepartment ?? "",
    minorDepartment: local.minorDepartment ?? "",
  };
}

function toDbProfile(profile: ProfileRow) {
  return {
    id: profile.id,
    email: profile.email,
    display_name: profile.display_name,
    school: profile.school,
    major_department: profile.majorDepartment,
    grade: profile.grade,
    double_major_department: profile.doubleMajorDepartment || null,
    minor_department: profile.minorDepartment || null,
    updated_at: new Date().toISOString(),
  };
}

function fromDbProfile(row: {
  id: string;
  email: string | null;
  display_name: string | null;
  school: string;
  major_department: string;
  grade: string;
  double_major_department: string | null;
  minor_department: string | null;
}): ProfileRow {
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    school: row.school,
    majorDepartment: row.major_department,
    grade: row.grade,
    doubleMajorDepartment: row.double_major_department ?? "",
    minorDepartment: row.minor_department ?? "",
  };
}

export function AccountClient() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [status, setStatus] = useState("讀取登入狀態中");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasSupabaseAuthConfig()) {
      setStatus("尚未設定 Supabase 環境變數，無法登入。");
      return;
    }

    const supabase = getSupabaseAuthClient();

    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);

      if (!data.user) {
        setStatus("登入後可以把基本資格存到 profiles。");
        return;
      }

      const { data: existing, error } = await supabase
        .from("profiles")
        .select("id,email,display_name,school,major_department,grade,double_major_department,minor_department")
        .eq("id", data.user.id)
        .maybeSingle();

      if (existing) {
        const cloudProfile = fromDbProfile(existing);
        setProfile(cloudProfile);
        savePreferences({
          ...getPreferences(),
          profile: {
            school: cloudProfile.school,
            majorDepartment: cloudProfile.majorDepartment,
            grade: cloudProfile.grade,
            doubleMajorDepartment: cloudProfile.doubleMajorDepartment,
            minorDepartment: cloudProfile.minorDepartment,
          },
        });
        setStatus("已讀取雲端 profile。");
        return;
      }

      if (error) {
        setStatus(`尚未讀到 profile：${error.message}`);
      }

      setProfile(profileFromLocal(data.user));
    });
  }, []);

  async function signIn() {
    const supabase = getSupabaseAuthClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
  }

  async function signOut() {
    const supabase = getSupabaseAuthClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setStatus("已登出。");
  }

  async function saveProfile() {
    if (!profile) return;

    setSaving(true);
    const supabase = getSupabaseAuthClient();
    const { error } = await supabase.from("profiles").upsert(toDbProfile(profile), { onConflict: "id" });
    setSaving(false);

    if (!error) {
      savePreferences({
        ...getPreferences(),
        profile: {
          school: profile.school,
          majorDepartment: profile.majorDepartment,
          grade: profile.grade,
          doubleMajorDepartment: profile.doubleMajorDepartment,
          minorDepartment: profile.minorDepartment,
        },
      });
    }

    setStatus(error ? `儲存失敗：${error.message}` : "profile 已儲存。");
  }

  function updateProfile(key: keyof UserProfile, value: string) {
    setStatus("");
    setProfile((current) => (current ? { ...current, [key]: value } : current));
  }

  const accountEmail = user?.email ?? profile?.email ?? "";
  const isAdmin = accountEmail.toLowerCase() === adminEmail;

  return (
    <main className="mx-auto max-w-[760px] px-4 py-5">
      <div className="mb-5">
        <h1 className="mt-1 text-2xl font-semibold">帳號與基本資格</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          登入後可以同步基本資格、收藏與提醒設定。未登入仍可瀏覽機會。
        </p>
      </div>

      {!hasSupabaseAuthConfig() ? (
        <section className="section-card text-sm leading-6 text-[var(--attention)]">
          尚未設定 Supabase 環境變數，請先確認 `.env.local`。
        </section>
      ) : null}

      {!user ? (
        <section className="section-card space-y-4">
          <h2 className="text-lg font-semibold">登入</h2>
          <p className="text-sm leading-6 text-[var(--muted)]">{status}</p>
          <button
            type="button"
            onClick={signIn}
            className="w-full rounded-2xl bg-[var(--action)] px-4 py-3 font-semibold text-[var(--paper)]"
          >
            使用 Google 登入
          </button>
        </section>
      ) : null}

      {user && profile ? (
        <div className="space-y-4">
          {isAdmin ? (
            <section className="section-card space-y-3">
              <div>
                <h2 className="text-lg font-semibold">管理工具</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">只有管理者帳號會看到這裡。</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  href="/data-staging"
                  className="rounded-2xl bg-[var(--primary)] px-4 py-3 text-center font-semibold text-[var(--primary-ink)]"
                >
                  整理公告草稿
                </Link>
                <Link
                  href="/data-entry"
                  className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-center font-semibold text-[var(--action)]"
                >
                  編輯匯入資料
                </Link>
              </div>
            </section>
          ) : null}

          <section className="section-card space-y-4">
            <div>
              <h2 className="text-lg font-semibold">我的 profile</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{profile.email}</p>
            </div>

            <SelectField label="學校" value={profile.school} options={schools} onChange={(value) => updateProfile("school", value)} />
            <SelectField
              label="主修系所"
              value={profile.majorDepartment}
              options={getDepartmentsForSchool(profile.school)}
              onChange={(value) => updateProfile("majorDepartment", value)}
            />
            <SelectField label="年級" value={profile.grade} options={grades} onChange={(value) => updateProfile("grade", value)} />
            <SelectField
              label="雙主修"
              value={profile.doubleMajorDepartment ?? ""}
              options={["", ...getDepartmentsForSchool(profile.school)]}
              emptyLabel="沒有或暫不填"
              onChange={(value) => updateProfile("doubleMajorDepartment", value)}
            />
            <SelectField
              label="輔系"
              value={profile.minorDepartment ?? ""}
              options={["", ...getDepartmentsForSchool(profile.school)]}
              emptyLabel="沒有或暫不填"
              onChange={(value) => updateProfile("minorDepartment", value)}
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="rounded-2xl bg-[var(--action)] px-4 py-3 font-semibold text-[var(--primary-ink)] disabled:opacity-60"
              >
                {saving ? "儲存中" : "儲存 profile"}
              </button>
              <button
                type="button"
                onClick={signOut}
                className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 font-semibold text-[var(--muted)]"
              >
                登出
              </button>
            </div>
            {status ? <p className="text-sm font-semibold text-[var(--action)]">{status}</p> : null}
          </section>
        </div>
      ) : null}
    </main>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  emptyLabel,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  emptyLabel?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-bold text-[var(--text)]"
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option || emptyLabel || "未填"}
          </option>
        ))}
      </select>
    </label>
  );
}
