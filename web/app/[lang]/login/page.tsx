"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { Divider, Alert } from "@/components/auth/parts";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const { configured } = useAuth();
  const [oauthErr, setOauthErr] = useState("");
  return (
    <AuthShell
      title="登录 redditalpha"
      subtitle="查看声量份额、情绪与每日 AI 简报"
      footer={
        <>
          还没有账号？
          <Link href="/signup" className="text-reddit hover:underline font-medium ml-1">
            注册
          </Link>
        </>
      }
    >
      {!configured && (
        <div className="mb-4">
          <Alert kind="info">账号系统尚未配置，登录暂不可用（见 SUPABASE_AUTH.md）。</Alert>
        </div>
      )}
      {oauthErr && (
        <div className="mb-3">
          <Alert kind="error">{oauthErr}</Alert>
        </div>
      )}
      <GoogleButton onError={setOauthErr} />
      <div className="my-4">
        <Divider>或用邮箱登录</Divider>
      </div>
      <EmailAuthForm mode="login" />
    </AuthShell>
  );
}
