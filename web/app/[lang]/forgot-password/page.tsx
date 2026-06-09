"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, Alert } from "@/components/auth/parts";
import { sendPasswordReset, friendlyError } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setMsg(`重置链接已发送至 ${email}，请查收邮件。`);
    } catch (e) {
      setErr(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="重置密码"
      subtitle="输入注册邮箱，我们会发送重置链接"
      footer={
        <Link href="/login" className="text-reddit hover:underline">
          返回登录
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        {err && <Alert kind="error">{err}</Alert>}
        {msg && <Alert kind="success">{msg}</Alert>}
        <Field label="邮箱" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" required />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-reddit text-white font-semibold py-2.5 hover:brightness-110 transition disabled:opacity-60"
        >
          {loading ? "发送中…" : "发送重置链接"}
        </button>
      </form>
    </AuthShell>
  );
}
