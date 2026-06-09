"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/auth/parts";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!supabase) {
      router.replace("/login");
      return;
    }
    // URL 中可能带 OAuth 错误
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("error")) {
      const p = new URLSearchParams(hash.slice(1));
      setErr(p.get("error_description") || "登录失败，请重试。");
      return;
    }

    let tries = 0;
    let alive = true;
    const check = async () => {
      const { data } = await supabase!.auth.getSession();
      if (!alive) return;
      if (data.session) {
        router.replace("/");
      } else if (tries++ < 25) {
        setTimeout(check, 200);
      } else {
        setErr("登录超时，请重试。");
      }
    };
    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) router.replace("/");
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <AuthShell title={err ? "登录失败" : "登录中…"} subtitle={err ? undefined : "正在完成身份验证"}>
      {err ? (
        <>
          <Alert kind="error">{err}</Alert>
          <div className="mt-4 text-center">
            <a href="/login" className="text-reddit text-sm hover:underline">
              返回登录
            </a>
          </div>
        </>
      ) : (
        <div className="flex justify-center py-3">
          <svg className="animate-spin w-7 h-7 text-reddit" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </AuthShell>
  );
}
