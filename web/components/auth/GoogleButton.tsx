"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { signInWithGoogle, friendlyError } from "@/lib/auth";
import { GoogleLogo } from "./parts";

export function GoogleButton({ onError }: { onError?: (m: string) => void }) {
  const { dict } = useLocale();
  const t = dict.auth;
  const [loading, setLoading] = useState(false);
  const go = async () => {
    setLoading(true);
    try {
      await signInWithGoogle(); // 成功则跳转到 Google
    } catch (e) {
      onError?.(friendlyError(e));
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      onClick={go}
      disabled={loading}
      className="w-full inline-flex items-center justify-center gap-2.5 rounded-lg bg-white text-[#1f1f1f] text-sm font-medium px-4 py-2.5 hover:bg-neutral-100 transition disabled:opacity-60"
    >
      <GoogleLogo />
      {loading ? t.googleRedirecting : t.googleContinue}
    </button>
  );
}
