"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, Alert } from "@/components/auth/parts";
import { updatePassword, friendlyError } from "@/lib/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (pw !== pw2) {
      setErr("两次输入的密码不一致。");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(pw);
      setDone(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (e) {
      setErr(friendlyError(e));
      setLoading(false);
    }
  };

  return (
    <AuthShell title="设置新密码" subtitle="通过邮件链接打开此页后即可重置">
      {done ? (
        <Alert kind="success">密码已更新，正在跳转…</Alert>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {err && <Alert kind="error">{err}</Alert>}
          <Field label="新密码" type="password" value={pw} onChange={setPw} placeholder="至少 6 位" autoComplete="new-password" required minLength={6} />
          <Field label="确认新密码" type="password" value={pw2} onChange={setPw2} placeholder="再次输入" autoComplete="new-password" required minLength={6} />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-reddit text-white font-semibold py-2.5 hover:brightness-110 transition disabled:opacity-60"
          >
            {loading ? "更新中…" : "更新密码"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
