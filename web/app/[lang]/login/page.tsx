"use client";

import { useState } from "react";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { Divider, Alert } from "@/components/auth/parts";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const { dict } = useLocale();
  const t = dict.auth;
  const { configured } = useAuth();
  const [oauthErr, setOauthErr] = useState("");
  return (
    <AuthShell
      title={t.loginTitle}
      subtitle={t.loginSubtitle}
      footer={
        <>
          {t.noAccount}
          <LocaleLink href="/signup" className="text-reddit hover:underline font-medium ml-1">
            {t.signupLink}
          </LocaleLink>
        </>
      }
    >
      {!configured && (
        <div className="mb-4">
          <Alert kind="info">{t.notConfiguredLogin}</Alert>
        </div>
      )}
      {oauthErr && (
        <div className="mb-3">
          <Alert kind="error">{oauthErr}</Alert>
        </div>
      )}
      <GoogleButton onError={setOauthErr} />
      <div className="my-4">
        <Divider>{t.orEmailLogin}</Divider>
      </div>
      <EmailAuthForm mode="login" />
    </AuthShell>
  );
}
