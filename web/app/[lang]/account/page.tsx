"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui";
import { Field, Alert } from "@/components/auth/parts";
import { useAuth } from "@/components/auth/AuthProvider";
import { updatePassword, friendlyError, displayName, avatarUrl } from "@/lib/auth";

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="py-24 text-center text-sm text-neutral-500">加载中…</div>;
  }

  const name = displayName(user);
  const avatar = avatarUrl(user);
  const provider = (user.app_metadata?.provider as string) || "email";
  const providerLabel = provider === "google" ? "Google" : "邮箱";

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      await updatePassword(pw);
      setMsg("密码已更新。");
      setPw("");
    } catch (e) {
      setErr(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="font-display font-extrabold text-cream text-2xl">账户设置</h1>

      <Panel className="p-5 flex items-center gap-4">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={name} className="w-14 h-14 rounded-full object-cover ring-1 ring-white/10" referrerPolicy="no-referrer" />
        ) : (
          <span className="grid place-items-center w-14 h-14 rounded-full bg-reddit/90 text-white text-xl font-bold ring-1 ring-white/10">
            {(name.charAt(0) || "U").toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <div className="font-display font-bold text-cream text-lg truncate">{name}</div>
          <div className="text-sm text-neutral-500 truncate">{user.email}</div>
          <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-neutral-400 ring-1 ring-inset ring-white/8">
            登录方式：{providerLabel}
          </div>
        </div>
      </Panel>

      {provider === "email" && (
        <Panel className="p-5">
          <h2 className="font-display font-bold text-cream mb-3">修改密码</h2>
          <form onSubmit={changePw} className="space-y-3 max-w-sm">
            {err && <Alert kind="error">{err}</Alert>}
            {msg && <Alert kind="success">{msg}</Alert>}
            <Field label="新密码" type="password" value={pw} onChange={setPw} placeholder="至少 6 位" autoComplete="new-password" required minLength={6} />
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-reddit text-white font-semibold px-4 py-2 hover:brightness-110 transition disabled:opacity-60"
            >
              {busy ? "更新中…" : "更新密码"}
            </button>
          </form>
        </Panel>
      )}

      <Panel className="p-5 flex items-center justify-between">
        <div>
          <div className="font-medium text-cream">退出登录</div>
          <div className="text-sm text-neutral-500">在此设备上结束当前会话</div>
        </div>
        <button
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          className="rounded-lg border border-bear/30 text-bear font-semibold px-4 py-2 hover:bg-bear/10 transition"
        >
          退出登录
        </button>
      </Panel>
    </div>
  );
}
