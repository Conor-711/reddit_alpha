"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { Divider, Alert } from "@/components/auth/parts";
import { useAuth } from "@/components/auth/AuthProvider";

export default function SignupPage() {
  const { configured } = useAuth();
  const [oauthErr, setOauthErr] = useState("");
  return (
    <AuthShell
      title="注册 redditalpha"
      subtitle="免费创建账号，解锁个性化体验"
      footer={
        <>
          已有账号？
          <Link href="/login" className="text-reddit hover:underline font-medium ml-1">
            登录
          </Link>
        </>
      }
    >
      {!configured && (
        <div className="mb-4">
          <Alert kind="info">账号系统尚未配置，注册暂不可用（见 SUPABASE_AUTH.md）。</Alert>
        </div>
      )}
      {oauthErr && (
        <div className="mb-3">
          <Alert kind="error">{oauthErr}</Alert>
        </div>
      )}
      <GoogleButton onError={setOauthErr} />
      <div className="my-4">
        <Divider>或用邮箱注册</Divider>
      </div>
      <EmailAuthForm mode="signup" />
      <p className="mt-4 text-xs text-neutral-600 text-center leading-relaxed">
        注册即表示你同意我们的服务条款与隐私政策。舆情结论仅供研究，不构成投资建议。
      </p>
    </AuthShell>
  );
}
