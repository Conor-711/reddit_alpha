"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { withLang } from "@/lib/i18n";
import { signInWithEmail, signUpWithEmail, friendlyError } from "@/lib/auth";
import { Field, Alert } from "./parts";

export function EmailAuthForm({ mode }: { mode: "login" | "signup" }) {
  const { lang, dict } = useLocale();
  const t = dict.auth;
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
        router.push(withLang(lang, "/")); // 跳转后由 AuthProvider 更新状态
      } else {
        const data = await signUpWithEmail(email, pw);
        if (data.session) {
          router.push(withLang(lang, "/"));
        } else {
          setMsg(t.confirmSent.replace("{email}", email));
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
      <Field label={t.email} type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" required />
      <Field
        label={t.password}
        type="password"
        value={pw}
        onChange={setPw}
        placeholder={t.pwMin}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        required
        minLength={6}
      />
      {mode === "login" && (
        <div className="text-right -mt-1">
          <LocaleLink href="/forgot-password" className="text-xs text-neutral-500 hover:text-reddit transition">
            {t.forgot}
          </LocaleLink>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-reddit text-white font-semibold py-2.5 hover:brightness-110 transition disabled:opacity-60"
      >
        {loading ? t.processing : mode === "login" ? t.loginBtn : t.createBtn}
      </button>
    </form>
  );
}
