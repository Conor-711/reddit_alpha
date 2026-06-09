"use client";

import { LocaleLink } from "@/components/i18n/LocaleLink";
import { useLocale } from "@/components/i18n/LocaleProvider";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { dict } = useLocale();
  return (
    <div className="fixed inset-0 z-50 bg-ink overflow-y-auto">
      <div
        className="min-h-full grid place-items-center p-4"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 50% 0%, rgba(255,69,0,.10), transparent 70%)",
        }}
      >
        <div className="w-full max-w-[400px] py-8">
          <LocaleLink href="/" className="flex items-center justify-center gap-2 mb-6">
            <span className="w-8 h-8 rounded-lg overflow-hidden bg-white ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${BASE}/logo.png`} alt="redditalpha" className="w-full h-full object-contain" />
            </span>
            <span className="font-display font-extrabold text-cream text-xl">
              reddit<span className="text-reddit">alpha</span>
            </span>
          </LocaleLink>

          <div className="panel rounded-2xl p-6 sm:p-7">
            <h1 className="font-display font-bold text-cream text-xl text-center">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-neutral-500 text-center">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>

          {footer && <div className="mt-5 text-center text-sm text-neutral-500">{footer}</div>}

          <div className="mt-6 text-center">
            <LocaleLink href="/" className="text-xs text-neutral-600 hover:text-neutral-400 transition">
              ← {dict.common.backToDashboard}
            </LocaleLink>
          </div>
        </div>
      </div>
    </div>
  );
}
