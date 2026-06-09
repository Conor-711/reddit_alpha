import type { User } from "@supabase/supabase-js";
import { supabase, AUTH_NOT_CONFIGURED } from "./supabase";

// 回调/重定向 URL（兼容 basePath 与 trailingSlash）。仅在浏览器调用。
function appRedirect(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${base}${path}`;
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error(AUTH_NOT_CONFIGURED);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) throw new Error(AUTH_NOT_CONFIGURED);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: appRedirect("/auth/callback/") },
  });
  if (error) throw error;
  return data; // data.session === null → 需邮箱确认
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error(AUTH_NOT_CONFIGURED);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: appRedirect("/auth/callback/") },
  });
  if (error) throw error; // 成功则浏览器跳转到 Google
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}

export async function sendPasswordReset(email: string) {
  if (!supabase) throw new Error(AUTH_NOT_CONFIGURED);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: appRedirect("/reset-password/"),
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  if (!supabase) throw new Error(AUTH_NOT_CONFIGURED);
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ---------- 展示助手 ----------
export function displayName(user: User | null): string {
  if (!user) return "";
  const m = (user.user_metadata || {}) as Record<string, string>;
  return m.full_name || m.name || m.user_name || (user.email ? user.email.split("@")[0] : "用户");
}

export function avatarUrl(user: User | null): string | null {
  if (!user) return null;
  const m = (user.user_metadata || {}) as Record<string, string>;
  return m.avatar_url || m.picture || null;
}

export function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message || String(e);
  const map: Record<string, string> = {
    "Invalid login credentials": "邮箱或密码不正确。",
    "User already registered": "该邮箱已注册，请直接登录。",
    "Email not confirmed": "邮箱尚未验证，请先查收确认邮件。",
    "Password should be at least 6 characters": "密码至少 6 位。",
    "Unable to validate email address: invalid format": "邮箱格式不正确。",
    "For security purposes, you can only request this after 60 seconds.": "操作过于频繁，请 60 秒后再试。",
  };
  return map[msg] || msg;
}
