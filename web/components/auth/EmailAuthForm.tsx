"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmail, signUpWithEmail, friendlyError } from "@/lib/auth";
import { Field, Alert } from "./parts";

export function EmailAuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmail(email, pw);
        router.push("/"); // 跳转后由 AuthProvider 更新状态
      } else {
        const data = await signUpWithEmail(email, pw);
        if (data.session) {
          router.push("/");
        } else {
          setMsg(`确认邮件已发送至 ${email}，请点击邮件中的链接完成注册。`);
          setLoading(false);
        }
      }
    } catch (e) {
      setErr(friendlyError(e));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {err && <Alert kind="error">{err}</Alert>}
      {msg && <Alert kind="success">{msg}</Alert>}
      <Field label="邮箱" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" required />
      <Field
        label="密码"
        type="password"
        value={pw}
        onChange={setPw}
        placeholder="至少 6 位"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        required
        minLength={6}
      />
      {mode === "login" && (
        <div className="text-right -mt-1">
          <Link href="/forgot-password" className="text-xs text-neutral-500 hover:text-reddit transition">
            忘记密码？
          </Link>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-reddit text-white font-semibold py-2.5 hover:brightness-110 transition disabled:opacity-60"
      >
        {loading ? "处理中…" : mode === "login" ? "登录" : "创建账号"}
      </button>
    </form>
  );
}
