"use client";

import { useState } from "react";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { Divider, Alert } from "@/components/auth/parts";
import { useAuth } from "@/components/auth/AuthProvider";

export default function SignupPage() {
  const { dict } = useLocale();
  const t = dict.auth;
  const { configured } = useAuth();
  const [oauthErr, setOauthErr] = useState("");
  return (
    <AuthShell
      title={t.signupTitle}
      subtitle={t.signupSubtitle}
      footer={
        <>
          {t.haveAccount}
          <LocaleLink href="/login" className="text-reddit hover:underline font-medium ml-1">
            {t.loginLink}
          </LocaleLink>
        </>
      }
    >
      {!configured && (
        <div className="mb-4">
          <Alert kind="info">{t.notConfiguredSignup}</Alert>
        </div>
      )}
      {oauthErr && (
        <div className="mb-3">
          <Alert kind="error">{oauthErr}</Alert>
        </div>
      )}
      <GoogleButton onError={setOauthErr} />
      <div className="my-4">
        <Divider>{t.orEmailSignup}</Divider>
      </div>
      <EmailAuthForm mode="signup" />
      <p className="mt-4 text-xs text-neutral-600 text-center leading-relaxed">{t.terms}</p>
    </AuthShell>
  );
}
